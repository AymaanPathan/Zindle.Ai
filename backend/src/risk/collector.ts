// src/risk/collector.ts
import { coralMultiSql } from "../coral/mcp";
import { AggregatedSignals, HubSpotSignals, StripeSignals } from "./signals";

// ───────────────── Helpers ─────────────────

function daysSince(val?: string | number | null): number | undefined {
  if (val == null) return undefined;
  const n = Number(val);
  const d = !isNaN(n) && n > 1_000_000_000
    ? new Date(n * 1000)
    : new Date(val as string);
  if (isNaN(d.getTime())) return undefined;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

function safeNum(val: any, fallback = 0): number {
  const n = parseFloat(String(val ?? ""));
  return isNaN(n) ? fallback : n;
}

// ───────────────── Collector ─────────────────

export async function collectAllSignals(): Promise<Map<string, AggregatedSignals>> {
  console.log("📡 Collecting signals — 1 coralMultiSql call across Stripe + HubSpot...");

  // ── One call, five queries, one persistent Coral process ──────────────
  const results = await coralMultiSql({

    // 1. HubSpot contacts — source of truth for which customers we score
    contacts: `
      SELECT id, email, firstname, lastname, company, lifecyclestage
      FROM hubspot.contacts
      WHERE email IS NOT NULL
    `,

    // 2. Stripe open invoice risk — overdue, failed, outstanding
    stripeRisk: `
      SELECT
        customer_email,
        COUNT(*)                                              AS open_invoice_count,
        SUM(amount_due - amount_paid)                         AS total_amount_due,
        MAX(DATEDIFF('day', due_date, CURRENT_DATE))          AS max_days_overdue,
        SUM(CASE WHEN status = 'uncollectible' THEN 1 ELSE 0 END) AS failed_payments
      FROM stripe.invoices
      WHERE status NOT IN ('paid', 'void')
      GROUP BY customer_email
    `,

    // 3. Stripe payment history — success rate + historical lateness
    stripeHistory: `
      SELECT
        customer_email,
        COUNT(*)                                              AS total_invoices,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)     AS paid_invoices,
        SUM(
          CASE
            WHEN status = 'paid'
              AND status_transitions__paid_at > due_date
            THEN 1 ELSE 0
          END
        )                                                     AS historically_late
      FROM stripe.invoices
      GROUP BY customer_email
    `,

    // 4. HubSpot engagement — reply/open signals per contact
    hubspotEngagement: `
      SELECT
        recipient                                             AS email,
        MAX(CASE WHEN type = 'REPLY' THEN created END)        AS last_reply,
        MAX(CASE WHEN type = 'OPEN'  THEN created END)        AS last_open,
        SUM(CASE WHEN type = 'OPEN'  THEN 1 ELSE 0 END)       AS total_opens,
        SUM(CASE WHEN type = 'REPLY' THEN 1 ELSE 0 END)       AS total_replies,
        COUNT(*)                                              AS total_sent,
        SUM(CASE WHEN type = 'BOUNCE' THEN 1 ELSE 0 END)      AS total_bounces
      FROM hubspot.email_events
      GROUP BY recipient
    `,

    // 5. All unique emails from Stripe — catches Stripe customers
    //    not yet in HubSpot so we can flag the gap
    stripeEmails: `
      SELECT DISTINCT LOWER(customer_email) AS email
      FROM stripe.invoices
      WHERE customer_email IS NOT NULL
    `,
  });

  console.log(
    `✅ Raw rows — contacts: ${results.contacts.length}, ` +
    `stripeRisk: ${results.stripeRisk.length}, ` +
    `stripeHistory: ${results.stripeHistory.length}, ` +
    `engagement: ${results.hubspotEngagement.length}`
  );

  // ── Build O(1) lookup maps ────────────────────────────────────────────
  const stripeRiskMap    = new Map(results.stripeRisk.map(r =>
    [r.customer_email?.toLowerCase(), r]));
  const stripeHistoryMap = new Map(results.stripeHistory.map(r =>
    [r.customer_email?.toLowerCase(), r]));
  const engagementMap    = new Map(results.hubspotEngagement.map(r =>
    [r.email?.toLowerCase(), r]));

  // ── Aggregate — HubSpot contacts are the join key ─────────────────────
  const signalMap = new Map<string, AggregatedSignals>();

  for (const contact of results.contacts) {
    const key = contact.email?.toLowerCase();
    if (!key) continue;

    const sr = stripeRiskMap.get(key);
    const sh = stripeHistoryMap.get(key);
    const eg = engagementMap.get(key);

    const totalInvoices = safeNum(sh?.total_invoices);
    const paidInvoices  = safeNum(sh?.paid_invoices);

    const stripe: StripeSignals = {
      daysOverdue:          safeNum(sr?.max_days_overdue),
      hasFailedPayment:     safeNum(sr?.failed_payments) > 0,
      openInvoiceCount:     safeNum(sr?.open_invoice_count),
      totalAmountDue:       safeNum(sr?.total_amount_due),
      previousLatePayments: safeNum(sh?.historically_late),
      paymentSuccessRate:   totalInvoices > 0 ? paidInvoices / totalInvoices : 1,
    };

    const totalSent    = safeNum(eg?.total_sent);
    const totalReplies = safeNum(eg?.total_replies);
    const totalOpens   = safeNum(eg?.total_opens);

    const hubspot: HubSpotSignals = {
      daysSinceLastReply:    daysSince(eg?.last_reply) ?? 999,
      daysSinceLastOpen:     daysSince(eg?.last_open),
      openedButNeverReplied: totalOpens > 0 && totalReplies === 0,
      totalIgnoredEmails:    Math.max(0, totalSent - totalReplies),
      hasActiveMeeting:      false, // extend: add hubspot.meetings query when available
      lifecycleStage:        contact.lifecyclestage ?? "unknown",
    };

    signalMap.set(contact.email, {
      email:       contact.email,
      name:        [contact.firstname, contact.lastname].filter(Boolean).join(" ") || undefined,
      company:     contact.company ?? undefined,
      stripe,
      hubspot,
      collectedAt: new Date().toISOString(),
    });
  }

  console.log(`✅ Signals aggregated for ${signalMap.size} customers`);
  return signalMap;
}

// ── Single-customer path — reuses the batch, no extra queries ────────────────
export async function collectSignalsForEmail(
  email: string
): Promise<AggregatedSignals | null> {
  const all = await collectAllSignals();
  return all.get(email.toLowerCase()) ?? null;
}