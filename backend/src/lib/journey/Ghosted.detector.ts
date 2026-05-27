import { JourneyEvent } from "../../types/journey";
import { addDays, daysBetween } from "./helpers";

// After this many days of silence following the last outreach on an overdue
// invoice, we synthesise a "ghosted" node in the timeline.
const GHOSTED_SILENCE_DAYS = 7;

/**
 * Analyses a sorted list of JourneyEvents and, if the customer appears to have
 * gone silent on an overdue invoice, appends a synthesised `ghosted` event.
 *
 * Rules:
 *  1. There must be at least one `invoice_overdue` event.
 *  2. The customer must not have paid (no `invoice_paid` after the overdue).
 *  3. The last outreach (email_sent / follow_up_sent) must be >= GHOSTED_SILENCE_DAYS ago
 *     with no subsequent email_opened / email_clicked.
 *
 * The synthesised event timestamp is set to (lastOutreach + GHOSTED_SILENCE_DAYS)
 * so it sorts into the correct position in the timeline.
 */
export function detectGhostedEvents(
  events: JourneyEvent[],
): JourneyEvent[] {
  const now = new Date();

  // ── Guards ──────────────────────────────────────────────────────────────────

  const hasOverdue = events.some((e) => e.type === "invoice_overdue");
  if (!hasOverdue) return [];

  // If the customer eventually paid every invoice, not ghosted.
  const lastOverdue = [...events]
    .filter((e) => e.type === "invoice_overdue")
    .at(-1);

  const lastPaid = [...events]
    .filter((e) => e.type === "invoice_paid")
    .at(-1);

  if (
    lastPaid?.timestamp &&
    lastOverdue?.timestamp &&
    new Date(lastPaid.timestamp) > new Date(lastOverdue.timestamp)
  ) {
    return []; // paid after the overdue — not ghosted
  }

  // ── Find last outreach ──────────────────────────────────────────────────────

  const outreachTypes: JourneyEvent["type"][] = ["email_sent", "follow_up_sent"];
  const engagementTypes: JourneyEvent["type"][] = ["email_opened", "email_clicked"];

  const lastOutreach = [...events]
    .filter((e) => outreachTypes.includes(e.type) && !!e.timestamp)
    .at(-1);

  if (!lastOutreach?.timestamp) return []; // no outreach recorded → can't determine ghosted

  const daysSilent = daysBetween(lastOutreach.timestamp, now);
  if (daysSilent < GHOSTED_SILENCE_DAYS) return []; // too soon to call it

  // ── Check for post-outreach engagement ─────────────────────────────────────

  const lastOutreachTime = new Date(lastOutreach.timestamp).getTime();

  const hadEngagementAfterOutreach = events.some(
    (e) =>
      engagementTypes.includes(e.type) &&
      e.timestamp &&
      new Date(e.timestamp).getTime() > lastOutreachTime,
  );

  // If they opened/clicked after the last email, they're not ghosted —
  // they're just slow payers. Still concerning, but a different signal.
  if (hadEngagementAfterOutreach) return [];

  // ── Build the synthesised ghosted node ─────────────────────────────────────

  const ghostedTimestamp = addDays(lastOutreach.timestamp, GHOSTED_SILENCE_DAYS);

  const hadAnyEngagement = events.some((e) =>
    engagementTypes.includes(e.type),
  );

  return [
    {
      id: "system_ghosted",
      type: "ghosted",
      label: "Customer Went Silent",
      source: "system",
      timestamp: ghostedTimestamp,
      status: "ghosted",
      metadata: {
        daysSinceLastContact: daysSilent,
        hadPriorEngagement: hadAnyEngagement,
        lastOutreachType: lastOutreach.type,
        silenceThresholdDays: GHOSTED_SILENCE_DAYS,
      },
    },
  ];
}