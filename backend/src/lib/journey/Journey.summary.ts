import { JourneyEvent, JourneySummary } from "../../types/journey";
import { daysBetween } from "./helpers";

/**
 * Derives a JourneySummary from the final sorted event list.
 * Driven entirely by real events — no magic numbers baked in.
 */
export function buildJourneySummary(
  events: JourneyEvent[],
  invoices: any[],
): JourneySummary {
  // ── Invoice aggregates (from raw Stripe rows — more accurate than events) ──

  const totalInvoices = invoices.length;

  const totalPaid = invoices.reduce(
    (sum, inv) => sum + (Number(inv.amount_paid) || 0),
    0,
  );

  const totalDue = invoices.reduce(
    (sum, inv) =>
      sum + Math.max((Number(inv.amount_due) || 0) - (Number(inv.amount_paid) || 0), 0),
    0,
  );

  const paidCount = invoices.filter((inv) => inv.status === "paid").length;

  const overdueCount = invoices.filter((inv) => {
    const dueDateMs = inv.due_date ? Number(inv.due_date) * 1000 : null;
    return dueDateMs && dueDateMs < Date.now() && inv.status !== "paid";
  }).length;

  const paymentSuccessRate =
    totalInvoices > 0 ? paidCount / totalInvoices : 0;

  // ── Email engagement (from events) ─────────────────────────────────────────

  const emailsSent = events.filter(
    (e) => e.type === "email_sent" || e.type === "follow_up_sent",
  ).length;

  const emailsOpened = events.filter((e) => e.type === "email_opened").length;

  const linksClicked = events.filter(
    (e) => e.type === "email_clicked",
  ).length;

  const followUpCount = events.filter(
    (e) => e.type === "follow_up_sent",
  ).length;

  // ── Ghosted / last contact ─────────────────────────────────────────────────

  const isGhosted = events.some((e) => e.type === "ghosted");

  const outreachEvents = events
    .filter(
      (e) =>
        (e.type === "email_sent" || e.type === "follow_up_sent") &&
        !!e.timestamp,
    )
    .sort(
      (a, b) =>
        new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime(),
    );

  const daysSinceLastContact =
    outreachEvents.length > 0
      ? daysBetween(outreachEvents[0].timestamp!)
      : null;

  return {
    totalInvoices,
    totalPaid,
    totalDue,
    paidCount,
    overdueCount,
    emailsSent,
    emailsOpened,
    linksClicked,
    followUpCount,
    isGhosted,
    daysSinceLastContact,
    paymentSuccessRate,
  };
}