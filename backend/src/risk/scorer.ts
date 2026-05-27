import { AggregatedSignals, RiskBreakdown, RiskProfile } from "./signals";

type Rule = (signals: AggregatedSignals) => RiskBreakdown | null;

// ───────────────── Stripe Rules ─────────────────

const STRIPE_RULES: Rule[] = [

  (s) => s.stripe.daysOverdue >= 7 && s.stripe.daysOverdue < 14
    ? { signal: "invoice_overdue_7d",  points: 15, reason: `Invoice overdue ${s.stripe.daysOverdue} days`, source: "stripe" }
    : null,

  (s) => s.stripe.daysOverdue >= 14 && s.stripe.daysOverdue < 30
    ? { signal: "invoice_overdue_14d", points: 30, reason: `Invoice overdue ${s.stripe.daysOverdue} days`, source: "stripe" }
    : null,

  (s) => s.stripe.daysOverdue >= 30
    ? { signal: "invoice_overdue_30d", points: 50, reason: `Invoice critically overdue — ${s.stripe.daysOverdue} days past due`, source: "stripe" }
    : null,

  (s) => s.stripe.hasFailedPayment
    ? { signal: "failed_payment", points: 25, reason: "Has a failed payment attempt on record", source: "stripe" }
    : null,

  (s) => s.stripe.openInvoiceCount >= 2
    ? { signal: "multiple_open_invoices", points: 20, reason: `${s.stripe.openInvoiceCount} open invoices simultaneously`, source: "stripe" }
    : null,

  (s) => s.stripe.previousLatePayments >= 2
    ? { signal: "repeat_late_payer", points: 20, reason: `Historically pays late — ${s.stripe.previousLatePayments} prior late payments`, source: "stripe" }
    : null,

  // Only fires when there are actual open invoices — never flags fully-paid accounts
  (s) => s.stripe.paymentSuccessRate < 0.6 &&
         s.stripe.paymentSuccessRate > 0 &&
         s.stripe.openInvoiceCount > 0
    ? { signal: "low_payment_rate", points: 15, reason: `Only ${Math.round(s.stripe.paymentSuccessRate * 100)}% of invoices paid historically`, source: "stripe" }
    : null,
];

// ───────────────── HubSpot Rules ─────────────────

const HUBSPOT_RULES: Rule[] = [

  (s) => s.hubspot.daysSinceLastReply !== undefined &&
         s.hubspot.daysSinceLastReply >= 7 &&
         s.hubspot.daysSinceLastReply < 14
    ? { signal: "no_reply_7d",  points: 10, reason: `No email reply for ${s.hubspot.daysSinceLastReply} days`, source: "hubspot" }
    : null,

  // 999 = no reply data at all (new customer) — don't penalise
  (s) => s.hubspot.daysSinceLastReply !== undefined &&
         s.hubspot.daysSinceLastReply >= 14 &&
         s.hubspot.daysSinceLastReply < 999
    ? { signal: "no_reply_14d", points: 20, reason: `Unresponsive for ${s.hubspot.daysSinceLastReply} days`, source: "hubspot" }
    : null,

  (s) => s.hubspot.openedButNeverReplied && s.hubspot.totalIgnoredEmails >= 3
    ? { signal: "ghost_reader", points: 15, reason: `Opens emails but ignored ${s.hubspot.totalIgnoredEmails} messages`, source: "hubspot" }
    : null,

  (s) => s.hubspot.daysSinceLastOpen !== undefined && s.hubspot.daysSinceLastOpen >= 21
    ? { signal: "email_dark", points: 20, reason: `Hasn't opened any email in ${s.hubspot.daysSinceLastOpen} days`, source: "hubspot" }
    : null,

  (s) => s.hubspot.lifecycleStage === "churned"
    ? { signal: "marked_churned", points: 40, reason: "Marked as churned in HubSpot", source: "hubspot" }
    : null,
];

// ───────────────── Scorer ─────────────────

function scoreToCategory(score: number): "healthy" | "watch" | "high_risk" | "critical" {
  if (score <= 30)  return "healthy";
  if (score <= 60)  return "watch";
  if (score <= 100) return "high_risk";
  return "critical";
}

export function calculateRiskScore(signals: AggregatedSignals): RiskProfile {

  // If fully settled billing-wise, skip all Stripe rules entirely
const fullySettled =
  signals.stripe.openInvoiceCount === 0 &&
  !signals.stripe.hasFailedPayment &&
  signals.stripe.daysOverdue <= 0 &&  
  signals.stripe.totalAmountDue <= 0;

  const rulesToRun = fullySettled
    ? HUBSPOT_RULES       // only engagement/churn signals matter
    : [...STRIPE_RULES, ...HUBSPOT_RULES];

  const breakdown: RiskBreakdown[] = [];
  for (const rule of rulesToRun) {
    const result = rule(signals);
    if (result) breakdown.push(result);
  }

  const deduplicated = deduplicateOverdueRules(breakdown);
  const score        = deduplicated.reduce((sum, b) => sum + b.points, 0);

  return {
    email:        signals.email,
    name:         signals.name,
    company:      signals.company,
    score,
    category:     scoreToCategory(score),
    breakdown:    deduplicated,
    signals,
    calculatedAt: new Date().toISOString(),
  };
}

function deduplicateOverdueRules(breakdown: RiskBreakdown[]): RiskBreakdown[] {
  const overdueSignals = ["invoice_overdue_30d", "invoice_overdue_14d", "invoice_overdue_7d"];
  const fired          = breakdown.filter((b) => overdueSignals.includes(b.signal));
  if (fired.length <= 1) return breakdown;
  const worst = fired[0];
  return breakdown.filter((b) => !overdueSignals.includes(b.signal) || b.signal === worst.signal);
}