import { runCoralQuery } from "../coral/client";
import { supabase } from "../lib/supabase";
import { AggregatedSignals, HubSpotSignals, StripeSignals } from "./signals";

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

async function fetchEngagementMap(): Promise<Map<string, any>> {
  const map = new Map<string, any>();
  try {
    const { data, error } = await supabase
      .from("email_events")
      .select("email, type, created");

    if (error) {
      console.warn("⚠️ engagement fetch failed:", error.message);
      return map;
    }

    for (const row of data ?? []) {
      const key = row.email?.toLowerCase();
      if (!key) continue;

      const existing = map.get(key) ?? {
        total_sent:  0,
        total_opens: 0,
        last_open:   null as string | null,
      };

      if (row.type === "sent")    existing.total_sent++;
      if (row.type === "opened") {
        existing.total_opens++;
        if (!existing.last_open || row.created > existing.last_open)
          existing.last_open = row.created;
      }

      map.set(key, existing);
    }

    console.log(`✅ engagement: ${map.size} contacts from Supabase`);
  } catch (err: any) {
    console.warn("⚠️ engagement fetch exception:", err.message);
  }
  return map;
}

export async function collectAllSignals(): Promise<Map<string, AggregatedSignals>> {
  console.log("📡 Collecting signals...");

  const [contacts, stripeRisk, stripeHistory, engagementMap] = await Promise.all([
    runCoralQuery<any[]>(`
      SELECT id, email, firstname, lastname, company, lifecyclestage
      FROM hubspot.contacts
      WHERE email IS NOT NULL
    `),
    runCoralQuery<any[]>(`
      SELECT
        customer_email,
        COUNT(*) AS open_invoice_count,
        SUM(amount_due - amount_paid) AS total_amount_due,
        MIN(due_date) AS earliest_due_date,
        SUM(CASE WHEN status = 'uncollectible' THEN 1 ELSE 0 END) AS failed_payments
      FROM stripe.invoices
      WHERE status NOT IN ('paid', 'void')
      GROUP BY customer_email
    `),
    runCoralQuery<any[]>(`
      SELECT
        customer_email,
        COUNT(*) AS total_invoices,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_invoices,
        SUM(CASE WHEN status = 'paid' AND status_transitions__paid_at > due_date THEN 1 ELSE 0 END) AS historically_late
      FROM stripe.invoices
      WHERE status != 'void'
      GROUP BY customer_email
    `),
    fetchEngagementMap(),
  ]);

  console.log(`✅ contacts: ${contacts.length}, stripeRisk: ${stripeRisk.length}, stripeHistory: ${stripeHistory.length}`);

  const stripeRiskMap    = new Map(stripeRisk.map(r => [r.customer_email?.toLowerCase(), r]));
  const stripeHistoryMap = new Map(stripeHistory.map(r => [r.customer_email?.toLowerCase(), r]));

  const signalMap = new Map<string, AggregatedSignals>();

  for (const contact of contacts) {
    const key = contact.email?.toLowerCase();
    if (!key) continue;

    const sr = stripeRiskMap.get(key);
    const sh = stripeHistoryMap.get(key);
    const eg = engagementMap.get(key);

    const totalInvoices = safeNum(sh?.total_invoices);
    const paidInvoices  = safeNum(sh?.paid_invoices);

    const daysOverdue = sr?.earliest_due_date
  ? (() => {
      const raw = sr.earliest_due_date;
      const n = Number(raw);
      const d = !isNaN(n) && n > 1_000_000_000
        ? new Date(n * 1000)        // Unix seconds → ms
        : new Date(raw as string);  // ISO string
      return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));
    })()
  : 0;

    const stripe: StripeSignals = {
      daysOverdue,
      hasFailedPayment:     safeNum(sr?.failed_payments) > 0,
      openInvoiceCount:     safeNum(sr?.open_invoice_count),
      totalAmountDue:       safeNum(sr?.total_amount_due),
      previousLatePayments: safeNum(sh?.historically_late),
      paymentSuccessRate:   totalInvoices > 0 ? paidInvoices / totalInvoices : 1,
    };

    const totalSent  = safeNum(eg?.total_sent);
    const totalOpens = safeNum(eg?.total_opens);
    const lastOpen   = eg?.last_open ?? null;

    const hubspot: HubSpotSignals = {
      daysSinceLastReply:    daysSince(lastOpen) ?? 999, // use last email open as proxy
      daysSinceLastOpen:     daysSince(lastOpen),
      openedButNeverReplied: false,                      // not applicable for Resend events
      totalIgnoredEmails:    Math.max(0, totalSent - totalOpens),
      hasActiveMeeting:      false,
      lifecycleStage:        contact.lifecyclestage ?? "unknown",
    };

    signalMap.set(key, {
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

export async function collectSignalsForEmail(email: string): Promise<AggregatedSignals | null> {
  const all = await collectAllSignals();
  return all.get(email.toLowerCase()) ?? null;
}