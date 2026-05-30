// clients.route.ts
import { Router } from "express";
import { coralSql } from "../coral/mcp";

import { queries } from "../coral/queries";

const router = Router();
// Add this helper function at the top of clients.route.ts
function formatLifecycle(stage: string | null | undefined): string | null {
  if (!stage) return null;
  
  const map: Record<string, string> = {
    marketingqualifiedlead: "Marketing Qualified Lead",
    salesqualifiedlead:     "Sales Qualified Lead",
    lead:                   "Lead",
    subscriber:             "Subscriber",
    opportunity:            "Opportunity",
    customer:               "Customer",
    evangelist:             "Evangelist",
    other:                  "Other",
  };

  return map[stage.toLowerCase()] ?? stage
    .replace(/([a-z])([A-Z])/g, "$1 $2")   // camelCase → words
    .replace(/\b\w/g, c => c.toUpperCase()); // Title Case
}
function deriveRiskLevel(c: {
  invoice_count: number;
  paid_invoice_count: number;
  open_invoice_count: number;
  total_due: number;
  total_paid: number;           
  is_fully_paid: boolean;
}): "healthy" | "medium" | "high" | "critical" {
  const { invoice_count, open_invoice_count, total_due, is_fully_paid } = c;

  if (invoice_count === 0) return "healthy";
  if (is_fully_paid) return "healthy";     
  if (open_invoice_count === 0 && total_due <= 0) return "healthy";
  if (c.total_paid === 0 && invoice_count > 0) return "critical";
  if (c.paid_invoice_count === 0) return "high";
  if (open_invoice_count > 0) return "medium";

  return "healthy";
}

router.get("/clients", async (_req, res) => {
  try {
    const raw = await coralSql(queries.getAllClients);
    const clients = Array.isArray(raw) ? raw : raw != null ? [raw] : [];

    const normalized = clients.map((c) => {
      const invoiceCount     = Number(c.invoice_count      ?? 0);
      const totalInvoiced    = Number(c.total_invoiced     ?? 0);
      const totalDue         = Number(c.total_due          ?? 0);
      const paidInvoiceCount = Number(c.paid_invoice_count ?? 0);
      const openInvoiceCount = Number(c.open_invoice_count ?? 0);

      const totalPaid = Math.max(0, totalInvoiced - totalDue);

      const isFullyPaid = invoiceCount > 0 && openInvoiceCount === 0;

      const paymentRate = totalInvoiced > 0
        ? Math.round((totalPaid / totalInvoiced) * 100)
        : (isFullyPaid ? 100 : null);

      return {
        // Identity
        id:        c.hubspot_id,
        name:      [c.firstname, c.lastname].filter(Boolean).join(" ") || c.email,
        email:     c.email,
        company:   c.company     ?? null,
      lifecycle: formatLifecycle(c.lifecyclestage),
        createdAt: c.hubspot_created_at ?? c.createdate,

        // Billing
        invoiceCount,
        totalInvoiced,
        totalPaid,           
        totalDue,
        paidInvoiceCount,
        openInvoiceCount,

        paymentRate,         
        isFullyPaid,
        lastPaymentAt:       c.last_payment_at        ?? null,
        earliestOpenDueDate: c.earliest_open_due_date ?? null,
        currency: (c.currency ?? "INR").toUpperCase(),
        riskLevel: deriveRiskLevel({
          invoice_count:      invoiceCount,
          paid_invoice_count: paidInvoiceCount,
          open_invoice_count: openInvoiceCount,
          total_due:          totalDue,
          total_paid:         totalPaid,
          is_fully_paid:      isFullyPaid,
        }),
      };
    });

    console.log("\n👥 ALL CLIENTS");
    console.table(
      normalized.map((c) => ({
        email:       c.email,
        invoices:    c.invoiceCount,
        paid:        c.paidInvoiceCount,
        open:        c.openInvoiceCount,
        totalDue:    c.totalDue,
        totalPaid:   c.totalPaid,
        paymentRate: c.paymentRate != null ? `${c.paymentRate}%` : "—",
        risk:        c.riskLevel,
      }))
    );

    return res.json(normalized);
  } catch (err) {
    console.error("❌ Clients route error:", err);
    return res.status(500).json({ error: "Failed to fetch clients" });
  }
});


router.get("/clients/:email/invoices", async (req, res) => {
  const email = decodeURIComponent(req.params.email).trim();

  try {
    const raw = await coralSql(queries.getCustomerInvoices(email));

    const rows = Array.isArray(raw) ? raw : raw != null ? [raw] : [];

    const invoices = rows.map((inv) => {
      const amountDue  = Number(inv.amount_due  ?? 0);
      const amountPaid = Number(inv.amount_paid ?? 0);
      // Same fix: remaining = due − paid; effective paid = due − remaining
      const amountRemaining = Number(inv.amount_remaining ?? (amountDue - amountPaid));
      const effectivePaid   = Math.max(0, amountDue - amountRemaining);
      const isPaid          = inv.status === "paid";

      return {
        id:               inv.id,
        number:           inv.number ?? inv.id,
        status:           inv.status,
        isPaid,
        amountDue,
        amountPaid:       effectivePaid,   // corrected
        amountRemaining:  isPaid ? 0 : amountRemaining,
        created:          inv.created,
        dueDate:          inv.due_date     ?? null,
        paidAt:           inv.paid_at      ?? null,
        hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
        invoicePdf:       inv.invoice_pdf        ?? null,
        isOverdue:        !isPaid && inv.due_date
          ? new Date(Number(inv.due_date) > 1e9
              ? Number(inv.due_date) * 1000
              : inv.due_date).getTime() < Date.now()
          : false,
      };
    });

    return res.json({ email, invoices });
  } catch (err: any) {
    console.error("❌ Client invoices error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;