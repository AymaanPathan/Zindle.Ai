import { JourneyEvent } from "../../types/journey";

export interface JourneyPattern {
  code: string;
  label: string;
  description: string;
  severity: "info" | "warning" | "critical";
  relatedEventIds?: string[];
}

/**
 * Reads the sorted event list and emits typed pattern signals.
 * Each pattern represents a meaningful behavioural observation —
 * not just "what happened" but "what this probably means".
 *
 * These are attached to the journey summary and fed to the AI as context.
 */
export function detectJourneyPatterns(
  events: JourneyEvent[],
  invoices: any[],
): JourneyPattern[] {
  const patterns: JourneyPattern[] = [];

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const eventsOfType = (...types: JourneyEvent["type"][]) =>
    events.filter((e) => types.includes(e.type) && !!e.timestamp);

  const tsOf = (e: JourneyEvent) => new Date(e.timestamp!).getTime();

  const minutesBetween = (a: JourneyEvent, b: JourneyEvent) =>
    Math.abs(tsOf(b) - tsOf(a)) / (1000 * 60);

  const hourOf = (e: JourneyEvent) => new Date(e.timestamp!).getUTCHours();

  // ── Pattern 1: Double-click on payment link (within 10 min) ─────────────────
  // Signal: customer reached checkout but something stopped them

  const clicks = eventsOfType("email_clicked");
  for (let i = 0; i < clicks.length - 1; i++) {
    if (minutesBetween(clicks[i], clicks[i + 1]) <= 10) {
      patterns.push({
        code: "DOUBLE_CLICK_CONFUSION",
        label: "Clicked payment link twice",
        description:
          `Customer clicked the payment link ${Math.round(minutesBetween(clicks[i], clicks[i + 1]))} minutes apart — ` +
          "likely reached checkout but encountered friction (card error, login wall, or price surprise).",
        severity: "warning",
        relatedEventIds: [clicks[i].id, clicks[i + 1].id],
      });
      break;
    }
  }

  // ── Pattern 2: Clicked link but invoice still unpaid ────────────────────────

  const hasClicks = clicks.length > 0;
const hasOpenInvoice = invoices.some(
  (inv) => inv.status !== "paid" && inv.status !== "void",
);

const hasAnyEmail = eventsOfType(
  "email_sent", "email_delivered", "email_opened",
  "email_clicked", "follow_up_sent",
).length > 0;

if (hasOpenInvoice && !hasAnyEmail) {
  const openInvEvents = events.filter((e) =>
    e.type === "invoice_created" &&
    invoices.find(
      (inv) => inv.id === e.metadata?.invoiceId && inv.status !== "paid",
    ),
  );
  patterns.push({
    code: "NO_FOLLOWUP_ON_OPEN_INVOICE",
    label: "Open invoice with no outreach",
    description:
      "Customer has an unpaid invoice but no follow-up emails have been sent — " +
      "they may not have seen the invoice or may be waiting to be chased.",
    severity: "warning",
    relatedEventIds: openInvEvents.map((e) => e.id),
  });
}

// ── Pattern: Fast payment ────────────────────────────────────────────────────


const invoiceSents  = eventsOfType("invoice_sent");
const invoicePaids  = eventsOfType("invoice_paid");

for (const paid of invoicePaids) {
  const matchedSent = invoiceSents.find(
    (s) =>
      s.metadata?.invoiceId === paid.metadata?.invoiceId &&
      tsOf(paid) > tsOf(s),
  );
  if (matchedSent && minutesBetween(matchedSent, paid) <= 10) {
    patterns.push({
      code: "FAST_PAYMENT",
      label: "Paid within minutes of invoice",
      description:
        `Invoice was paid ${Math.round(minutesBetween(matchedSent, paid))} minute(s) after being sent — ` +
        "this customer is highly responsive and a strong payer.",
      severity: "info",
      relatedEventIds: [matchedSent.id, paid.id],
    });
    break;
  }
}

  // ── Pattern 3: Invoiced before CRM contact existed ──────────────────────────

  const contactCreated = eventsOfType("contact_created")[0];
  const firstInvoice = eventsOfType("invoice_created")[0];

  if (
    contactCreated?.timestamp &&
    firstInvoice?.timestamp &&
    tsOf(firstInvoice) < tsOf(contactCreated)
  ) {
    const hoursEarly = Math.round(
      (tsOf(contactCreated) - tsOf(firstInvoice)) / (1000 * 60 * 60),
    );
    patterns.push({
      code: "INVOICED_BEFORE_CRM",
      label: "Billed before CRM entry",
      description:
        `Customer was invoiced ${hoursEarly}h before being added to HubSpot — ` +
        "contact was likely created reactively after payment issues, not proactively managed.",
      severity: "info",
      relatedEventIds: [firstInvoice.id, contactCreated.id],
    });
  }

  // ── Pattern 4: Late-night email engagement ───────────────────────────────────

  const opens = eventsOfType("email_opened");
  const lateNightOpens = opens.filter((e) => {
    const h = hourOf(e);
    return h >= 22 || h <= 4; // 10pm–4am UTC
  });

  if (lateNightOpens.length > 0) {
    patterns.push({
      code: "LATE_NIGHT_OPENER",
      label: "Opens emails late at night",
      description:
        `Customer opened ${lateNightOpens.length} email(s) between 10pm–4am UTC — ` +
        "may be in a different timezone or reviewing invoices outside business hours.",
      severity: "info",
      relatedEventIds: lateNightOpens.map((e) => e.id),
    });
  }

  // ── Pattern 5: Rapid follow-up (sent within 1hr of original) ────────────────

  const allSends = eventsOfType("email_sent", "follow_up_sent");
  const followUps = eventsOfType("follow_up_sent");

  for (const fu of followUps) {
    const prior = allSends.find(
      (e) => e.type === "email_sent" && tsOf(e) < tsOf(fu),
    );
    if (prior && minutesBetween(prior, fu) < 60) {
      patterns.push({
        code: "RAPID_FOLLOW_UP",
        label: "Follow-up sent within the hour",
        description:
          `A follow-up was sent only ${Math.round(minutesBetween(prior, fu))} minutes after the original — ` +
          "may feel aggressive to the customer. Consider spacing outreach.",
        severity: "warning",
        relatedEventIds: [prior.id, fu.id],
      });
      break;
    }
  }

  // ── Pattern 6: Zero-dollar invoice marked paid ───────────────────────────────
  //
  // FIXED: Only flag this if the customer has NO real paid invoices at all, or
  // if the zero-dollar paid count is a high proportion of total invoices.
  // A customer who paid one invoice normally and has one $0 credit invoice
  // should NOT trigger this — the credit/discount is expected in that context.
  //
  // We fire the warning only when:
  //   (a) ALL paid invoices are $0 (revenue not actually recognised), OR
  //   (b) More than half the invoices are $0-paid with no real payments at all
  //
  // We SKIP this pattern if the customer has at least one invoice with a real
  // non-zero payment — they are clearly able to pay and have done so.

    const zeroDollarPaid = invoices.filter(
      (inv) =>
        inv.status === "paid" &&
        Number(inv.amount_due) === 0 &&
        Number(inv.amount_paid) === 0,
    );
    const realPaid = invoices.filter(
      (inv) =>
        inv.status === "paid" &&
        Number(inv.amount_due) > 0,  // had real value → genuine payment
    );

  if (zeroDollarPaid.length > 0 && realPaid.length === 0) {
    // All "paid" invoices collected $0 — no real revenue recognised at all
    patterns.push({
      code: "ZERO_DOLLAR_PAYMENT",
      label: "All invoices paid at $0",
      description:
        `${zeroDollarPaid.length} invoice(s) marked paid with $0 collected — ` +
        "no real revenue has been recognised yet. These may be covered by credits, " +
        "coupons, or a Stripe trial. Verify when cash payment is expected.",
      severity: "warning",
      relatedEventIds: zeroDollarPaid.map(
        (inv) => `invoice_paid_${inv.id}`,
      ),
    });
  }
  // If realPaid.length > 0 the customer has legitimately paid — skip this pattern.

  // ── Pattern 7: High email frequency (3+ emails in 24h) ──────────────────────

  if (allSends.length >= 3) {
    const sorted = [...allSends].sort((a, b) => tsOf(a) - tsOf(b));
    for (let i = 0; i < sorted.length - 2; i++) {
      const windowMs = tsOf(sorted[i + 2]) - tsOf(sorted[i]);
      if (windowMs <= 24 * 60 * 60 * 1000) {
        patterns.push({
          code: "HIGH_EMAIL_FREQUENCY",
          label: "3+ emails in 24 hours",
          description:
            "Three or more emails were sent within a 24-hour window — " +
            "risk of being marked as spam or frustrating the customer.",
          severity: "critical",
          relatedEventIds: sorted.slice(i, i + 3).map((e) => e.id),
        });
        break;
      }
    }
  }

  // ── Pattern 8: Engagement before CRM entry ──────────────────────────────────
console.log("RAW invoices for pattern detection:", 
  invoices.map(i => ({
    id: i.id,
    status: i.status,
    amount_due: i.amount_due,
    amount_paid: i.amount_paid,
    total: i.total,
  }))
);
  if (contactCreated?.timestamp) {
    const preContactEngagement = [...opens, ...clicks].filter(
      (e) => e.timestamp && tsOf(e) < tsOf(contactCreated),
    );
    if (preContactEngagement.length > 0) {
      patterns.push({
        code: "ENGAGEMENT_BEFORE_CRM",
        label: "Email engagement before CRM entry",
        description:
          `Customer opened/clicked ${preContactEngagement.length} email(s) before being added to HubSpot — ` +
          "these interactions have no CRM record and are invisible to your sales team.",
        severity: "info",
        relatedEventIds: preContactEngagement.map((e) => e.id),
      });
    }
  }

  return patterns;
}