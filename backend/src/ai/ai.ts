// Responsibilities: explain WHY, recommend WHAT TO DO, draft outreach.

import { RiskProfile } from "../risk/signals";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL   = "llama-3.3-70b-versatile";

interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callGroq(messages: GroqMessage[]): Promise<string> {
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
      temperature: 0.4,
      max_tokens: 800,
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

// ─── Build context string from risk profile ───────────────────────────────────

function buildProfileContext(profile: RiskProfile): string {
  const { email, name, company, score, category, breakdown, signals } = profile;

  const breakdownText = breakdown
    .map((b) => `  - [${b.source.toUpperCase()}] ${b.reason} (+${b.points} pts)`)
    .join("\n");

  return `
CUSTOMER: ${name ?? email}${company ? ` at ${company}` : ""}
EMAIL: ${email}
RISK SCORE: ${score} / CATEGORY: ${category.toUpperCase()}

RISK SIGNALS DETECTED:
${breakdownText || "  No risk signals detected"}

RAW SIGNAL DATA:
  Stripe:
    - Days overdue: ${signals.stripe.daysOverdue}
    - Open invoices: ${signals.stripe.openInvoiceCount}
    - Total amount due: $${signals.stripe.totalAmountDue}
    - Failed payments: ${signals.stripe.hasFailedPayment ? "YES" : "no"}
    - Historical late payments: ${signals.stripe.previousLatePayments}
    - Payment success rate: ${Math.round(signals.stripe.paymentSuccessRate * 100)}%

  CRM (HubSpot):
    - Lifecycle stage: ${signals.hubspot.lifecycleStage}
    - Days since last reply: ${signals.hubspot.daysSinceLastReply === 999 ? "unknown" : signals.hubspot.daysSinceLastReply}
  `.trim();
}

// ─── AI Exports ───────────────────────────────────────────────────────────────

export interface AIInsight {
  situation: string;
  actions: string[];
  urgency: "low" | "medium" | "high" | "immediate";
}

export async function generateRiskInsight(profile: RiskProfile): Promise<AIInsight> {
  const context = buildProfileContext(profile);

  const systemPrompt = `You are a B2B customer success AI assistant.
Your job is to analyze customer risk signals and generate actionable insights for account managers.
Be concise, specific, and direct. Do NOT be vague or generic.
Always respond with valid JSON only — no markdown, no explanation outside the JSON.`;

  const userPrompt = `
Analyze this customer risk profile and respond with a JSON object containing:
- "situation": 2–3 sentences explaining what is likely happening with this customer and why they are at risk
- "actions": array of 3–4 specific action items, ordered by priority (most urgent first)
- "urgency": one of "low" | "medium" | "high" | "immediate" based on risk score and signals

CUSTOMER PROFILE:
${context}

Respond ONLY with valid JSON. Example structure:
{
  "situation": "...",
  "actions": ["...", "..."],
  "urgency": "high"
}`;

  const raw = await callGroq([
    { role: "system", content: systemPrompt },
    { role: "user",   content: userPrompt },
  ]);

  const cleaned = raw.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      situation:     parsed.situation     ?? "Unable to generate situation summary.",
      actions:       Array.isArray(parsed.actions) ? parsed.actions : [],
      urgency:       parsed.urgency       ?? "medium",
    };
  } catch (e) {
    console.error("❌ Failed to parse Groq response:", cleaned);
    return {
      situation:     "AI analysis unavailable.",
      actions:       ["Review manually", "Check payment status", "Contact customer"],
      urgency:       "medium",
    };
  }
}

export async function generateBatchInsights(
  profiles: RiskProfile[],
  options: { onlyHighRisk?: boolean; maxConcurrent?: number } = {}
): Promise<Map<string, AIInsight>> {
  const { onlyHighRisk = true, maxConcurrent = 3 } = options;

  const toProcess = onlyHighRisk
    ? profiles.filter((p) => p.category === "high_risk" || p.category === "critical")
    : profiles;

  console.log(`🤖 Generating AI insights for ${toProcess.length} customers...`);

  const results = new Map<string, AIInsight>();

  for (let i = 0; i < toProcess.length; i += maxConcurrent) {
    const batch   = toProcess.slice(i, i + maxConcurrent);
    const settled = await Promise.allSettled(
      batch.map(async (p) => {
        const insight = await generateRiskInsight(p);
        return { email: p.email, insight };
      })
    );

    for (const result of settled) {
      if (result.status === "fulfilled") {
        results.set(result.value.email, result.value.insight);
      } else {
        console.error("❌ AI insight failed:", result.reason);
      }
    }

    if (i + maxConcurrent < toProcess.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return results;
}