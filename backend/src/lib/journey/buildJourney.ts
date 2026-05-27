import { runCoralQuery } from "../../coral/client";
import { queries } from "../../coral/queries";
import { supabase } from "../../lib/supabase";
import { calculateRiskScore } from "../../risk/scorer";
import { CustomerJourney, JourneyEvent } from "../../types/journey";
import { detectGhostedEvents } from "./Ghosted.detector";
import { mapHubspotToJourneyEvents } from "./hubspot.transformer";
import { generateJourneyInsight, JourneyAIInsight } from "./journey.ai";
import { deriveSignalsFromJourneyData } from "./Journey.signals";
import { buildJourneySummary } from "./Journey.summary";
import { detectJourneyPatterns, JourneyPattern } from "./Pattern.detector";
import { mapEmailEventsToJourneyEvents } from "./resend.transformer";
import { mapInvoiceToJourneyEvents } from "./stripe.transformer";

// ── Extended journey response type ──────────────────────────────────────────

export interface FullCustomerJourney extends CustomerJourney {
  patterns: JourneyPattern[];
  ai: JourneyAIInsight | null;
  riskScore: number;
  riskCategory: "healthy" | "watch" | "high_risk" | "critical";
}

// ── Data fetchers (each isolated — one source failing won't kill the journey) ─

async function fetchHubspotContact(email: string): Promise<any | null> {
  try {
    const rows = await runCoralQuery<any[]>(
      queries.getHubspotContactByEmail(email),
    );
    return rows?.[0] ?? null;
  } catch (err: any) {
    console.warn("⚠️  HubSpot unavailable:", err.message);
    return null;
  }
}

async function fetchStripeInvoices(email: string): Promise<any[]> {
  try {
    return await runCoralQuery<any[]>(queries.getCustomerInvoices(email));
  } catch (err: any) {
    console.warn("⚠️  Stripe unavailable:", err.message);
    return [];
  }
}

async function fetchResendEvents(email: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("email_events")
      .select("*")
      .eq("email", email)
      .order("created", { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  } catch (err: any) {
    console.warn("⚠️  Resend events unavailable:", err.message);
    return [];
  }
}

// ── Sort helper ──────────────────────────────────────────────────────────────

function sortEvents(events: JourneyEvent[]): JourneyEvent[] {
  return [...events].sort((a, b) => {
    if (!a.timestamp && !b.timestamp) return 0;
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
}

// ── Main builder ─────────────────────────────────────────────────────────────

export async function buildJourney(
  customerEmail: string,
): Promise<FullCustomerJourney> {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚀 BUILDING CUSTOMER JOURNEY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📧 EMAIL:", customerEmail);

  // ── 1. Parallel data fetch ──────────────────────────────────────────────────

  const [contact, invoices, resendEvents] = await Promise.all([
    fetchHubspotContact(customerEmail),
    fetchStripeInvoices(customerEmail),
    fetchResendEvents(customerEmail),
  ]);

  console.log(
    `📦 Fetched: HubSpot=${contact ? "found" : "none"} | Stripe=${invoices.length} invoices | Resend=${resendEvents.length} events`,
  );

  // ── 2. Transform each source to JourneyEvents ───────────────────────────────

  const hubspotEvents = mapHubspotToJourneyEvents(contact);
  const stripeEvents = invoices.flatMap(mapInvoiceToJourneyEvents);
  const emailEvents = mapEmailEventsToJourneyEvents(resendEvents);

  const rawEvents = sortEvents([
    ...hubspotEvents,
    ...stripeEvents,
    ...emailEvents,
  ]);

  // ── 3. Ghosted detection (requires sorted events) ───────────────────────────

  const ghostedEvents = detectGhostedEvents(rawEvents);
  const events = sortEvents([...rawEvents, ...ghostedEvents]);

  // ── 4. Summary ──────────────────────────────────────────────────────────────

  const summary = buildJourneySummary(events, invoices);

  // ── 5. Pattern detection ────────────────────────────────────────────────────

  const patterns = detectJourneyPatterns(events, invoices);

  console.log(
    `🔍 Patterns: ${patterns.length > 0 ? patterns.map((p) => p.code).join(", ") : "none"}`,
  );

  // ── 6. Risk scoring (uses data we already have — no extra queries) ──────────

  const aggregatedSignals = deriveSignalsFromJourneyData(
    customerEmail,
    contact,
    invoices,
    resendEvents,
  );
  const riskProfile = calculateRiskScore(aggregatedSignals);

  console.log(`⚠️  Risk: ${riskProfile.score} pts / ${riskProfile.category}`);

  // ── 7. AI insight (narrative + pattern explanations + outreach draft) ────────

  let ai: JourneyAIInsight | null = null;
  try {
    ai = await generateJourneyInsight(
      customerEmail,
      events,
      summary,
      patterns,
      riskProfile,
    );
    console.log(`🤖 AI urgency: ${ai.urgency}`);
  } catch (err) {
    console.error("❌ AI insight skipped:", err);
  }

  // ── 8. Debug output ─────────────────────────────────────────────────────────

  console.log("\n🧠 CANONICAL TIMELINE");
  console.table(
    events.map((e) => ({
      type: e.type,
      source: e.source,
      status: e.status,
      timestamp: e.timestamp
        ? new Date(e.timestamp).toLocaleString()
        : "(no date)",
    })),
  );
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  return {
    customerEmail,
    events,
    summary,
    patterns,
    ai,
    riskScore: riskProfile.score,
    riskCategory: riskProfile.category,
  };
}