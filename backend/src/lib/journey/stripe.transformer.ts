import { JourneyEvent } from "../../types/journey";
import { formatUnixDate, daysBetween } from "./helpers";

/**
 * Turns a single Stripe invoice row into an ordered sequence of JourneyEvents.
 *
 * Event IDs are namespaced with the invoice ID so multiple invoices in
 * the same journey never collide.
 *
 * Timeline produced per invoice:
 *   invoice_created  →  invoice_sent  →  (invoice_paid | invoice_overdue | invoice_partially_paid)
 */
export function mapInvoiceToJourneyEvents(invoice: any): JourneyEvent[] {
  const now = Date.now();

  // ── Derived values ──────────────────────────────────────────────────────────

  const iid = invoice.id as string; // e.g. "in_1Abc..."
  const label = invoice.number ? `Invoice ${invoice.number}` : "Invoice";

  const amountDue: number = Number(invoice.amount_due) || 0;
  const amountPaid: number = Number(invoice.amount_paid) || 0;
  const amountRemaining = amountDue - amountPaid;

  // Stripe stores timestamps in Unix seconds
  const createdMs = invoice.created ? Number(invoice.created) * 1000 : null;
  const dueDateMs = invoice.due_date ? Number(invoice.due_date) * 1000 : null;

  // Stripe exposes status_transitions_paid_at when the schema is flattened by Coral.
  // If that column doesn't exist yet in your integration, paidAtMs falls back to null
  // and we don't emit a paid timestamp — the event still appears but without a date.
  const paidAtMs = invoice.paid_at
  ? Number(invoice.paid_at) * 1000
  : null;

  const isPaid = invoice.status === "paid";
  const isDraft = invoice.status === "draft";
  const isPartial = !isPaid && amountPaid > 0 && amountRemaining > 0;
  const isOverdue =
    dueDateMs !== null &&
    dueDateMs < now &&
    !isPaid;

  const events: JourneyEvent[] = [];

  // ── 1. Invoice Created ──────────────────────────────────────────────────────

  events.push({
    id: `invoice_created_${iid}`,
    type: "invoice_created",
    label: `${label} Created`,
    source: "stripe",
    timestamp: formatUnixDate(invoice.created),
    status: "completed",
    metadata: {
      invoiceId: iid,
      invoiceNumber: invoice.number ?? null,
      amountDue,
      currency: invoice.currency ?? "usd",
    },
  });

  // ── 2. Invoice Sent (only if not still a draft) ─────────────────────────────

  if (!isDraft) {
    events.push({
      id: `invoice_sent_${iid}`,
      type: "invoice_sent",
      label: `${label} Sent`,
      source: "stripe",
      // Stripe doesn't expose a dedicated "sent_at" in most schemas;
      // the invoice is finalised (and sent) very close to created time.
      timestamp: formatUnixDate(invoice.created),
      status: "completed",
      metadata: {
        invoiceId: iid,
        invoicePdf: invoice.invoice_pdf ?? null,
        amountDue,
      },
    });
  }

  // ── 3a. Partial payment ─────────────────────────────────────────────────────

  if (isPartial) {
    events.push({
      id: `invoice_partially_paid_${iid}`,
      type: "invoice_partially_paid",
      label: `${label} Partially Paid`,
      source: "stripe",
      // No reliable timestamp for partial payment in base schema; omit rather
      // than use a wrong one.
      timestamp: undefined,
      status: "warning",
      metadata: {
        invoiceId: iid,
        amountPaid,
        amountRemaining,
      },
    });
  }

  // ── 3b. Fully paid ──────────────────────────────────────────────────────────

  if (isPaid) {
    events.push({
      id: `invoice_paid_${iid}`,
      type: "invoice_paid",
      label: `${label} Paid`,
      source: "stripe",
      timestamp: paidAtMs ? new Date(paidAtMs).toISOString() : undefined,
      status: "completed",
      metadata: {
        invoiceId: iid,
        amountPaid,
      },
    });
  }

  // ── 3c. Overdue ─────────────────────────────────────────────────────────────

  if (isOverdue) {
    const daysLate = daysBetween(dueDateMs!, now);

    events.push({
      id: `invoice_overdue_${iid}`,
      type: "invoice_overdue",
      label: `${label} Overdue`,
      source: "stripe",
      timestamp: formatUnixDate(invoice.due_date),
      status: "ghosted",
      metadata: {
        invoiceId: iid,
        daysLate,
        amountRemaining,
      },
    });
  }

  return events;
}