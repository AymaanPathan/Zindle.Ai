import { RiskProfile } from "../../risk/signals";
import { JourneyEvent, JourneySummary } from "../../types/journey";
import { JourneyPattern } from "./Pattern.detector";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export interface JourneyAIInsight {
  /** 2–3 sentence plain-English explanation of what is happening with this customer */
  situation: string;

  /** One-paragraph narrative reading the journey like a story, referencing specific events */
  journeyNarrative: string;

  /** Human-readable explanations of each detected pattern, in the AI's own words */
  patternInsights: string[];

  /** Ordered list of concrete next actions (most urgent first) */
  actions: string[];

  /** Ready-to-send outreach draft personalised to this customer's journey */

  /** Urgency level based on the full picture */
  urgency: "low" | "medium" | "high" | "immediate";
}

// ── Context builder ──────────────────────────────────────────────────────────

function buildJourneyContext(
  email: string,
  events: JourneyEvent[],
  summary: JourneySummary,
  patterns: JourneyPattern[],
  riskProfile: RiskProfile,
): string {
  const name = riskProfile.name ?? email;
  const company = riskProfile.company;

  // Compact event list — AI doesn't need full metadata, just the shape
  const eventLines = events
    .map((e) => {
      const ts = e.timestamp
        ? new Date(e.timestamp).toLocaleString("en-US", {
            dateStyle: "short",
            timeStyle: "short",
          })
        : "no date";
      return `  [${ts}] ${e.source.toUpperCase()} → ${e.type} (${e.status})`;
    })
    .join("\n");

  const patternLines =
    patterns.length > 0
      ? patterns
          .map(
            (p) =>
              `  [${p.severity.toUpperCase()}] ${p.code}: ${p.description}`,
          )
          .join("\n")
      : "  None detected";

  const breakdownLines =
    riskProfile.breakdown.length > 0
      ? riskProfile.breakdown
          .map((b) => `  - ${b.reason} (+${b.points} pts)`)
          .join("\n")
      : "  No risk signals";

  return `
CUSTOMER: ${name}${company ? ` at ${company}` : ""}
EMAIL: ${email}
RISK: ${riskProfile.score} pts / ${riskProfile.category.toUpperCase()}

JOURNEY TIMELINE (chronological):
${eventLines}

JOURNEY SUMMARY:
  Total invoices: ${summary.totalInvoices}
  Paid: ${summary.paidCount} | Overdue: ${summary.overdueCount}
  Total collected: $${(summary.totalPaid / 100).toFixed(2)}
  Amount still owed: $${(summary.totalDue / 100).toFixed(2)}
  Payment success rate: ${Math.round(summary.paymentSuccessRate * 100)}%
  Emails sent: ${summary.emailsSent} | Opened: ${summary.emailsOpened} | Links clicked: ${summary.linksClicked}
  Follow-ups sent: ${summary.followUpCount}
  Ghosted: ${summary.isGhosted ? "YES" : "no"}
  Days since last contact: ${summary.daysSinceLastContact ?? "unknown"}

BEHAVIOUR PATTERNS DETECTED:
${patternLines}

RISK SIGNAL BREAKDOWN:
${breakdownLines}
`.trim();
}

// ── Groq caller ─────────────────────────────────────────────────────────────

async function callGroq(
  messages: { role: "system" | "user"; content: string }[],
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set in environment");

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.35,
      max_tokens: 1200,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ── Main export ─────────────────────────────────────────────────────────────

export async function generateJourneyInsight(
  email: string,
  events: JourneyEvent[],
  summary: JourneySummary,
  patterns: JourneyPattern[],
  riskProfile: RiskProfile,
): Promise<JourneyAIInsight> {
  const context = buildJourneyContext(
    email,
    events,
    summary,
    patterns,
    riskProfile,
  );

  const systemPrompt = `You are a B2B customer intelligence AI. 
You analyse a customer's complete payment and communication journey and produce sharp, specific insights for account managers.
You read patterns like a detective — you notice timing, gaps, repeated behaviours, and anomalies.
Be direct, specific, and reference actual events. Never be generic.
Respond ONLY with valid JSON — no markdown, no preamble.`;

  const userPrompt = `
Analyse this customer's full journey and respond with a JSON object:

- "situation": 2–3 sentences. What is happening with this customer right now and why?
- "journeyNarrative": 1 paragraph reading their journey as a story. Reference specific events (e.g. "clicked twice in 5 minutes", "was invoiced a day before HubSpot knew they existed"). Make it feel like an intelligent human read it.
- "patternInsights": array of strings, one insight per detected behaviour pattern. Each should explain what the pattern means in plain English for an account manager.
- "actions": array of 3–4 specific actions ordered by priority. Be concrete — name channels, timings, amounts.
- "urgency": "low" | "medium" | "high" | "immediate"

CUSTOMER JOURNEY:
${context}

Respond ONLY with valid JSON. No markdown fences.`;

  let raw = "";
  try {
    raw = await callGroq([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      situation: parsed.situation ?? "Analysis unavailable.",
      journeyNarrative: parsed.journeyNarrative ?? "",
      patternInsights: Array.isArray(parsed.patternInsights)
        ? parsed.patternInsights
        : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      urgency: parsed.urgency ?? "medium",
    };
  } catch (err) {
    console.error("❌ Journey AI insight failed:", err);
    console.error("Raw response:", raw);

    return {
      situation: "AI analysis unavailable.",
      journeyNarrative: "",
      patternInsights: patterns.map((p) => p.description),
      actions: [
        "Review journey manually",
        "Check latest invoice status",
        "Contact customer directly",
      ],
      urgency: "medium",
    };
  }
}