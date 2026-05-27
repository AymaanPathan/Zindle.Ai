import {
  AggregatedSignals,
  HubSpotSignals,
  StripeSignals,
} from "../../risk/signals";

/**
 * Builds an AggregatedSignals object directly from the raw data already
 * fetched by buildJourney — no extra Coral queries needed.
 *
 * PostHog is unavailable here (journey doesn't fetch it), so those fields
 * default to safe zeroes that won't trigger false risk rules.
 */
export function deriveSignalsFromJourneyData(
  email: string,
  contact: any | null,
  invoices: any[],
  resendEvents: any[],
): AggregatedSignals {
  const now = Date.now();

  // ── Stripe signals ──────────────────────────────────────────────────────────

  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter((inv) => inv.status === "paid").length;

  const openInvoices = invoices.filter((inv) => {
    const dueDateMs = inv.due_date ? Number(inv.due_date) * 1000 : null;
    return dueDateMs && dueDateMs < now && inv.status !== "paid";
  });

  const maxDaysOverdue = openInvoices.reduce((max, inv) => {
    const dueDateMs = Number(inv.due_date) * 1000;
    const days = Math.floor((now - dueDateMs) / (1000 * 60 * 60 * 24));
    return Math.max(max, days);
  }, 0);

  const totalAmountDue = openInvoices.reduce(
    (sum, inv) =>
      sum +
      Math.max(
        (Number(inv.amount_due) || 0) - (Number(inv.amount_paid) || 0),
        0,
      ),
    0,
  );

  // "Historically late" = paid invoice where due_date < created (Stripe proxy)
  const historicallyLate = invoices.filter(
    (inv) =>
      inv.status === "paid" &&
      inv.due_date &&
      inv.created &&
      Number(inv.created) > Number(inv.due_date),
  ).length;

  const stripeSignals: StripeSignals = {
    daysOverdue: maxDaysOverdue,
    hasFailedPayment: false, // not available without extra query
    openInvoiceCount: openInvoices.length,
    totalAmountDue,
    previousLatePayments: historicallyLate,
    paymentSuccessRate: totalInvoices > 0 ? paidInvoices / totalInvoices : 1,
  };

  // ── HubSpot signals (from Resend events as proxy) ───────────────────────────

  const sentEvents = resendEvents.filter((e) =>
    ["sent", "email.sent"].includes((e.type ?? "").toLowerCase()),
  );
  const replyEvents: any[] = []; // Resend doesn't track replies
  const openEvents = resendEvents.filter((e) =>
    ["opened", "email.opened"].includes((e.type ?? "").toLowerCase()),
  );
  const bounceEvents = resendEvents.filter((e) =>
    ["bounced", "email.bounced", "bounce"].includes(
      (e.type ?? "").toLowerCase(),
    ),
  );

  const lastOpenDate = openEvents
    .map((e) => new Date(e.created).getTime())
    .sort((a, b) => b - a)[0];

  const hubspotSignals: HubSpotSignals = {
    daysSinceLastReply: 999, // no reply tracking in Resend
    daysSinceLastOpen: lastOpenDate
      ? Math.floor((now - lastOpenDate) / (1000 * 60 * 60 * 24))
      : undefined,
    openedButNeverReplied: openEvents.length > 0 && replyEvents.length === 0,
    totalIgnoredEmails: Math.max(0, sentEvents.length - replyEvents.length),
    hasActiveMeeting: false,
    lifecycleStage: contact?.lifecyclestage ?? "unknown",
  };

 

  return {
    email,
    name: contact
      ? `${contact.firstname ?? ""} ${contact.lastname ?? ""}`.trim() ||
        undefined
      : undefined,
    company: contact?.company ?? undefined,
    stripe: stripeSignals,
    hubspot: hubspotSignals,
    collectedAt: new Date().toISOString(),
  };
}