

  import { Router, Request, Response } from "express";
  import { Resend } from "resend";
  import { coralSql } from "../coral/mcp";

  const router = Router();

  // ─── Env ──────────────────────────────────────────────────────────────────────

  const GROQ_API_URL  = "https://api.groq.com/openai/v1/chat/completions";
  const GROQ_MODEL    = "llama-3.3-70b-versatile";
  const FROM_EMAIL =
    process.env.FROM_EMAIL ?? "billing@mail.aymaan.in";
  const FROM_NAME_DEFAULT = process.env.FROM_NAME ?? "Collections Team";

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /** Format paise → INR string */
  function fmt(val: any): string {
    const n = Number(val ?? 0) / 100;
    return n.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  }

  /** Unix-seconds or ISO → readable date */
  function fmtDate(val: any): string {
    if (!val) return "—";
    const n = Number(val);
    const d =
      !isNaN(n) && n > 1_000_000_000
        ? new Date(n * 1000)
        : new Date(val);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  /** How many days overdue (positive = overdue) */
  function daysOverdue(val: any): number {
    if (!val) return 0;
    const n = Number(val);
    const d =
      !isNaN(n) && n > 1_000_000_000
        ? new Date(n * 1000)
        : new Date(val);
    if (isNaN(d.getTime())) return 0;
    return Math.floor((Date.now() - d.getTime()) / 86_400_000);
  }

  /** Safe wrapper around runCoralQuery — always returns an array */
  async function sql<T = any>(label: string, query: string): Promise<T[]> {
    console.log(`\n[SQL:${label}] ${query.trim().slice(0, 120)}…`);
    try {
      const rows = await coralSql(query);
      console.log(`[SQL:${label}] → ${rows.length} rows`);
      return rows as T[];
    } catch (err: any) {
      console.error(`[SQL:${label}] ❌`, err.message);
      throw err;
    }
  }

  /** Groq completion */
  async function groq(
    system: string,
    user: string,
    maxTokens = 800
  ): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY not set");

    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.3,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user",   content: user },
        ],
      }),
    });

    if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? "";
  }

  // ─── Data fetchers ────────────────────────────────────────────────────────────

  async function fetchContact(email: string) {
    const rows = await sql("contact", `
      SELECT
        id, firstname, lastname, email,
        company, lifecyclestage, createdate
      FROM hubspot.contacts
      WHERE LOWER(email) = LOWER('${email.replace(/'/g, "''")}')
      LIMIT 1
    `);
    return rows[0] ?? null;
  }

  /**
   * Fetch all invoices for a customer including real Stripe links.
   *
   * hosted_invoice_url  → the Stripe-hosted payment page (send this to customer)
   * invoice_pdf         → direct PDF download link
   */
  // ─── Replace fetchInvoices() ──────────────────────────────────────────────────
  async function fetchInvoices(email: string) {
    return sql("invoices", `
      SELECT
        s.id,
        s.number,
        s.status,
        s.amount_due,
        s.amount_paid,
        (s.amount_due - s.amount_paid) AS amount_remaining,
        s.created,
        s.due_date,
        s.status_transitions__paid_at,
        s.hosted_invoice_url,
        s.invoice_pdf
      FROM stripe.invoices s
      INNER JOIN hubspot.contacts h
        ON LOWER(h.email) = LOWER(s.customer_email)
      WHERE LOWER(s.customer_email) = LOWER('${email.replace(/'/g, "''")}')
      ORDER BY s.created DESC
    `);
  }
  /**
   * Fetch all email events — tries both hubspot.email_events and the
   * product's own email_events table (Resend webhook data).
   * Returns a unified, chronologically sorted list.
   */
  async function fetchEmailEvents(email: string) {
    // ── HubSpot email events ────────────────────────────────────────────────
    let hubspotEvents: any[] = [];
    try {
      hubspotEvents = await sql("hs_email_events", `
        SELECT
          'hubspot'   AS source,
          type,
          created,
          subject,
          sender,
          NULL        AS link,
          NULL        AS ip_address
        FROM hubspot.email_events
        WHERE LOWER(recipient) = LOWER('${email.replace(/'/g, "''")}')
        ORDER BY created ASC
      `);
    } catch {
      console.warn("[customer] HubSpot email_events not available — skipping");
    }

    // ── Resend / product email events ───────────────────────────────────────
    let resendEvents: any[] = [];
    try {
      resendEvents = await sql("resend_email_events", `
        SELECT
          'resend'    AS source,
          type,
          created,
          NULL        AS subject,
          NULL        AS sender,
          link,
          ip_address
        FROM email_events
        WHERE LOWER(email) = LOWER('${email.replace(/'/g, "''")}')
        ORDER BY created ASC
      `);
    } catch {
      console.warn("[customer] email_events (Resend) table not available — skipping");
    }

    // Merge & sort by created (unix seconds or ISO)
    const all = [...hubspotEvents, ...resendEvents].sort((a, b) => {
      const ta = Number(a.created) > 1e9
        ? Number(a.created) * 1000
        : new Date(a.created).getTime();
      const tb = Number(b.created) > 1e9
        ? Number(b.created) * 1000
        : new Date(b.created).getTime();
      return ta - tb;
    });

    return all;
  }

  // ─── Build a compact account snapshot for the AI prompt ──────────────────────

  // ─── Replace buildAccountContext() ───────────────────────────────────────────
  function buildAccountContext(
    email: string,
    contact: any,
    invoices: any[],
    emailEvents: any[]
  ): string {
    const totalInvoiced = invoices.reduce((s, r) => s + Number(r.amount_due ?? 0), 0);
    const paidCount     = invoices.filter(r => r.status === "paid").length;
    const unpaidCount   = invoices.filter(r => !["paid", "void"].includes(r.status)).length;
    // Use status-based calculation, not amount_paid column
    const totalRemaining = invoices.reduce((s, r) =>
      r.status === "paid" ? s : s + Number(r.amount_remaining ?? r.amount_due ?? 0), 0);
    const totalPaid = Math.max(0, totalInvoiced - totalRemaining);
    const totalDue  = totalRemaining;

    const overdueInvoices = invoices
      .filter(r => !["paid", "void"].includes(r.status) && daysOverdue(r.due_date) > 0)
      .map(r =>
        `  • #${r.number ?? r.id}: ${fmt(r.amount_remaining)} — ${daysOverdue(r.due_date)}d overdue (due ${fmtDate(r.due_date)})`
      )
      .join("\n");

    const recentEmails = emailEvents
      .slice(-10)
      .map(e =>
        `  • [${e.source}] ${fmtDate(e.created)} — ${e.type}${e.subject ? ` "${e.subject}"` : ""}`
      )
      .join("\n");

    return `
  CUSTOMER: ${contact
      ? `${contact.firstname ?? ""} ${contact.lastname ?? ""}`.trim() || contact.email
      : email} (${contact?.email ?? "unknown"})
  COMPANY:  ${contact?.company ?? "—"}
  STAGE:    ${contact?.lifecyclestage ?? "unknown"}
  SINCE:    ${fmtDate(contact?.createdate)}

  BILLING SUMMARY:
    Total invoiced:  ${fmt(totalInvoiced)}
    Total collected: ${fmt(totalPaid)}
    Outstanding:     ${fmt(totalDue)}
    Invoices: ${invoices.length} total — ${paidCount} paid, ${unpaidCount} unpaid

  ${overdueInvoices ? `OVERDUE INVOICES:\n${overdueInvoices}` : "NO OVERDUE INVOICES ✅"}

  RECENT COMMUNICATION (last 10 events):
  ${recentEmails || "  No email history found."}
  `.trim();
  }

  // ─── Routes ───────────────────────────────────────────────────────────────────

  /**
   * GET /api/customers/:email/profile
   *
   * Returns:
   * {
   *   contact: { … } | null,
   *   invoices: [
   *     { id, number, status, amount_due, amount_paid, amount_remaining,
   *       created, due_date, paid_at, hosted_invoice_url, invoice_pdf,
   *       is_overdue, days_overdue }
   *   ],
   *   emailEvents: [
   *     { source, type, created, subject?, sender?, link?, ip_address? }
   *   ],
   *   summary: {
   *     total_invoiced, total_paid, total_due,
   *     paid_count, unpaid_count, overdue_count,
   *     last_payment_date, risk_level
   *   }
   * }
   */
  router.get(
    "/customers/:email/profile",
    async (req: Request, res: Response) => {
      const email = decodeURIComponent(req.params.email).trim();
      console.log(`\n[profile] ${email}`);

      try {
        const [rows, emailEvents] = await Promise.all([
          coralSql(`
            SELECT
              h.id AS hubspot_id, h.firstname, h.lastname, h.email,
              h.company, h.lifecyclestage, h.createdate,
              s.id AS invoice_id, s.number, s.status,
              s.amount_due, s.amount_paid,
              (s.amount_due - s.amount_paid) AS amount_remaining,
              s.created, s.due_date, s.status_transitions__paid_at,
              s.hosted_invoice_url, s.invoice_pdf, s.currency
            FROM hubspot.contacts h
            LEFT JOIN stripe.invoices s
              ON LOWER(s.customer_email) = LOWER(h.email)
            WHERE LOWER(h.email) = LOWER('${email.replace(/'/g, "''")}')
            ORDER BY s.created DESC
          `),
          fetchEmailEvents(email),
        ]);

        const contact = rows.length ? {
          id: rows[0].hubspot_id, firstname: rows[0].firstname,
          lastname: rows[0].lastname, email: rows[0].email,
          company: rows[0].company, lifecyclestage: rows[0].lifecyclestage,
          createdate: rows[0].createdate,
        } : null;

        const invoices = rows
          .filter(r => r.invoice_id != null)
          .map(r => ({
            id: r.invoice_id, number: r.number, status: r.status,
            amount_due: r.amount_due, amount_paid: r.amount_paid,
            amount_remaining: r.amount_remaining, created: r.created,
            due_date: r.due_date, status_transitions__paid_at: r.status_transitions__paid_at,
            hosted_invoice_url: r.hosted_invoice_url, invoice_pdf: r.invoice_pdf, currency: r.currency,
          }));

        if (!contact && !invoices.length) {
          return res.status(404).json({
            success: false,
            error: `No data found for ${email}`,
          });
        }

        const annotatedInvoices = invoices.map(inv => {
          const isPaid = inv.status === "paid";
          const amountDue = Number(inv.amount_due ?? 0);
          const amountRemaining = isPaid ? 0 : Number(inv.amount_remaining ?? amountDue);
          const effectivePaid = Math.max(0, amountDue - amountRemaining);

          return {
            ...inv,
            amount_paid:        effectivePaid,
            amount_remaining:   amountRemaining,
            hosted_invoice_url: inv.hosted_invoice_url ?? null,
            invoice_pdf:        inv.invoice_pdf ?? null,
            currency: (inv.currency ?? "inr").toUpperCase(),
            is_overdue:   !isPaid && !["void"].includes(inv.status) && daysOverdue(inv.due_date) > 0,
            days_overdue: isPaid ? 0 : daysOverdue(inv.due_date),
            created_fmt:  fmtDate(inv.created),
            due_date_fmt: fmtDate(inv.due_date),
            paid_at_fmt:  fmtDate(inv.status_transitions__paid_at),
          };
        });

        const totalDue  = invoices
          .filter(r => r.status !== "paid" && r.status !== "void")
          .reduce((s, r) => s + Number(r.amount_remaining ?? r.amount_due ?? 0), 0);
        const totalInvoiced = invoices.reduce((s, r) => s + Number(r.amount_due ?? 0), 0);
        const totalPaid = Math.max(0, totalInvoiced - totalDue);  
        const paidInvs      = invoices.filter(r => r.status === "paid");
        const unpaidInvs    = invoices.filter(r => !["paid", "void"].includes(r.status) );
        const overdueInvs   = unpaidInvs.filter(r => daysOverdue(r.due_date) > 0);

        const lastPayment = paidInvs
          .map(r => Number(r.status_transitions__paid_at ?? r.created ?? 0))
          .sort((a, b) => b - a)[0] ?? null;

        const isFullyPaid = invoices.length > 0 && unpaidInvs.length === 0;

        const maxOverdueDays = overdueInvs.length
          ? Math.max(...overdueInvs.map(r => daysOverdue(r.due_date)))
          : 0;
        const risk_level = isFullyPaid ? "healthy"
          : maxOverdueDays > 60 || overdueInvs.length >= 3 ? "critical"
          : maxOverdueDays > 30 ? "high"
          : maxOverdueDays > 0  ? "medium"
          : "healthy";

        return res.json({
          success: true,
          contact,
          invoices: annotatedInvoices,
          emailEvents,
          summary: {
            total_invoiced:    totalInvoiced,
            total_paid:        totalPaid,
            total_due:         totalDue,
            paid_count:        paidInvs.length,
            unpaid_count:      unpaidInvs.length,
            overdue_count:     overdueInvs.length,
            is_fully_paid:     isFullyPaid,
            last_payment_date: lastPayment
              ? new Date(lastPayment * 1000).toISOString()
              : null,
            risk_level,
            currency: (invoices[0]?.currency ?? "inr").toUpperCase(),
          },
        });
      } catch (err: any) {
        console.error("[profile] ❌", err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
    }
  );

  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * POST /api/customers/:email/draft-email
   *
   * Body:
   *   {
   *     type: "payment_reminder" | "overdue_followup" | "relationship_checkin" | "custom",
   *     customInstruction?: string   // required when type === "custom"
   *   }
   *
   * Returns:
   *   { success: true, subject: string, body: string, type: string }
   */
 router.post(
  "/customers/:email/draft-email",
  async (req: Request, res: Response) => {
    const email = decodeURIComponent(req.params.email).trim();
    const {
      type = "payment_reminder",
      customInstruction,
    } = req.body as {
      type?: string;
      customInstruction?: string;
    };

    console.log(`\n[draft-email] ${email} — type=${type}`);

    try {
      const [rows, emailEvents] = await Promise.all([
        coralSql(`
          SELECT
            h.id AS hubspot_id, h.firstname, h.lastname, h.email,
            h.company, h.lifecyclestage, h.createdate,
            s.id AS invoice_id, s.number, s.status,
            s.amount_due, s.amount_paid,
            (s.amount_due - s.amount_paid) AS amount_remaining,
            s.created, s.due_date, s.status_transitions__paid_at,
            s.hosted_invoice_url, s.invoice_pdf, s.currency
          FROM hubspot.contacts h
          LEFT JOIN stripe.invoices s
            ON LOWER(s.customer_email) = LOWER(h.email)
          WHERE LOWER(h.email) = LOWER('${email.replace(/'/g, "''")}')
          ORDER BY s.created DESC
        `),
        fetchEmailEvents(email),
      ]);

      const contact = rows.length ? {
        id: rows[0].hubspot_id, firstname: rows[0].firstname,
        lastname: rows[0].lastname, email: rows[0].email,
        company: rows[0].company, lifecyclestage: rows[0].lifecyclestage,
        createdate: rows[0].createdate,
      } : null;

      const invoices = rows
        .filter(r => r.invoice_id != null)
        .map(r => ({
          id: r.invoice_id, number: r.number, status: r.status,
          amount_due: r.amount_due, amount_paid: r.amount_paid,
          amount_remaining: r.amount_remaining, created: r.created,
          due_date: r.due_date, status_transitions__paid_at: r.status_transitions__paid_at,
          hosted_invoice_url: r.hosted_invoice_url, invoice_pdf: r.invoice_pdf,
        }));

      const accountContext = buildAccountContext(email, contact, invoices, emailEvents);

      const typeInstructions: Record<string, string> = {
        payment_reminder:
          "Write a short, warm reminder that there's an outstanding balance on the account. " +
          "Do NOT mention specific amounts, invoice numbers, or any links. " +
          "Just let them know it's pending and ask them to take care of it. 2 paragraphs max.",

        overdue_followup:
          "Write a firm but personal follow-up. The payment is overdue. " +
          "Mention you haven't heard back and need this resolved soon. " +
          "No links, no invoice numbers, no raw amounts. 1–2 short paragraphs only.",

        relationship_checkin:
          "Write a friendly check-in email. Ask how things are going with their business. " +
          "Casually mention there's still an outstanding balance at the end and offer to discuss. " +
          "Sound like a real person, not a collections system.",

        custom: customInstruction
          ? `Write an email with this specific goal: ${customInstruction}. ` +
            "No raw amounts, no invoice numbers, no payment links. Use the account context for tone only."
          : "Write a professional, human email based on the account context.",
      };

      const instruction = typeInstructions[type] ?? typeInstructions["payment_reminder"];

      const raw = await groq(
        `You are ${FROM_NAME_DEFAULT}, writing a short personal email on behalf of the company.
Follow every rule below without exception:
1. Write like a real person talking to someone they know — not a billing system.
2. NEVER include invoice numbers, rupee amounts, payment links, or any URLs.
3. Refer to money only in vague terms: "the outstanding amount", "what's pending", "settle this".
4. Maximum 3 short paragraphs. No bullet points. No tables. No headers.
5. Subject line must be direct and human — avoid "Following up on your account" or similar filler.
6. Sign off naturally as ${FROM_NAME_DEFAULT}. No "Best regards," or stiff closings.
Return ONLY valid JSON with exactly two keys: { "subject": "...", "body": "..." }
No markdown fences. No extra keys. No preamble.`,
        `${instruction}

ACCOUNT CONTEXT (internal use only — do not expose raw data in the email):
${accountContext}

Write the email now. Return JSON only.`,
        700
      );

      let subject = "";
      let body = "";
      try {
        const clean = raw.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        subject = parsed.subject ?? "";
        body    = parsed.body    ?? "";
      } catch {
        const subjectMatch = raw.match(/"subject"\s*:\s*"([^"]+)"/);
        const bodyMatch    = raw.match(/"body"\s*:\s*"([\s\S]+?)"\s*}/);
        subject = subjectMatch?.[1] ?? "Quick note";
        body    = bodyMatch?.[1]?.replace(/\\n/g, "\n") ?? raw;
      }

      return res.json({ success: true, type, subject, body });
    } catch (err: any) {
      console.error("[draft-email] ❌", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/customers/:email/send-email
 *
 * Sends an email via Resend directly from the product.
 *
 * Body:
 *   {
 *     subject:   string,
 *     body:      string,       // plain-text email body
 *     fromName?: string        // override sender name, defaults to FROM_NAME env
 *   }
 *
 * Returns:
 *   { success: true, messageId: string }
 */
router.post(
  "/customers/:email/send-email",
  async (req: Request, res: Response) => {
    const toEmail = decodeURIComponent(req.params.email).trim();
    const {
      subject,
      body,
      fromName = FROM_NAME_DEFAULT,
    } = req.body as {
      subject:   string;
      body:      string;
      fromName?: string;
    };

    if (!subject || !body) {
      return res.status(400).json({
        success: false,
        error: "subject and body are required",
      });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return res.status(500).json({
        success: false,
        error: "RESEND_API_KEY is not configured",
      });
    }

    console.log(`\n[send-email] Sending to ${toEmail}: "${subject}"`);

    try {
      const resend = new Resend(resendApiKey);

      const { data, error } = await resend.emails.send({
        from:    `${fromName} <${FROM_EMAIL}>`,
        to:      [toEmail],
        subject,
        text: body,
        html: `<div style="font-family:sans-serif;max-width:640px;line-height:1.6;color:#1a1a1a;">${
          body
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .split("\n\n")
            .map(p => `<p style="margin:0 0 16px;">${p.replace(/\n/g, "<br>")}</p>`)
            .join("")
        }</div>`,
      });

      if (error) {
        console.error("[send-email] Resend error:", error);
        return res.status(500).json({ success: false, error: error.message });
      }

      console.log(`[send-email] ✅ Sent. messageId=${data?.id}`);
      return res.json({ success: true, messageId: data?.id });
    } catch (err: any) {
      console.error("[send-email] ❌", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

  export default router;