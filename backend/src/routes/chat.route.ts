import { Router, Request, Response } from "express";
import { coralSql, coralMultiSql } from "../coral/mcp";

const router = Router();

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL   = "llama-3.3-70b-versatile";

interface ChatRequestBody {
  message: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

// ─── DB schema (for LLM SQL generation) ──────────────────────────────────────

const DB_SCHEMA = `
You have access to these tables via SQL (DuckDB syntax):

stripe.invoices:
  id, customer_email, customer_name, status ('paid','open','uncollectible','void')
  amount_due, amount_paid, amount_remaining  — integers in paise (÷100 = rupees)
  created (unix seconds), due_date (unix seconds)
  currency, number, hosted_invoice_url, invoice_pdf

hubspot.contacts:
  id, firstname, lastname, email, company
  lifecyclestage ('lead','customer','opportunity')
  createdate (ISO string)

gmail.messages (add with: coral source add gmail):
  id, subject, snippet, from, to, date (ISO string)
  labels (array), thread_id

slack.messages (add with: coral source add slack):
  id, text, channel, username, ts (unix timestamp)
  thread_ts, reactions

CRITICAL JOIN RULES:
- ALWAYS join stripe.invoices with hubspot.contacts on LOWER(h.email) = LOWER(s.customer_email)
- HubSpot is truth — never show contacts deleted from HubSpot
- Amounts are in PAISE — divide by 100 for rupees or use fmt() helper
- UNIX timestamps: use epoch_ms(col * 1000) to convert to date
- GROUP BY all non-aggregated SELECT columns
- No semicolons. DuckDB-compatible SQL only.
`.trim();

// ─── Groq LLM caller ─────────────────────────────────────────────────────────

async function callGroq(
  system: string,
  user: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
  maxTokens = 800
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.1,
      max_tokens: maxTokens,
      messages: [{ role: "system", content: system }, ...history, { role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq ${res.status}: ${err}`);
  }

  const data  = await res.json();
  const reply = data.choices?.[0]?.message?.content?.trim() ?? "";
  console.log(`[Groq] ${reply.length} chars | ${reply.slice(0, 100)}`);
  return reply;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt = (val: any): string =>
  (Number(val ?? 0) / 100).toLocaleString("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  });

const fmtDate = (val: any): string => {
  if (!val) return "—";
  const n = Number(val);
  const d = (!isNaN(n) && n > 1_000_000_000) ? new Date(n * 1000) : new Date(val);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
};

const daysOverdue = (val: any): string => {
  if (!val) return "?";
  const n = Number(val);
  const d = (!isNaN(n) && n > 1_000_000_000) ? new Date(n * 1000) : new Date(val);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  return days > 0 ? `${days}d overdue` : "not yet due";
};

const extractEmail = (msg: string): string | null =>
  msg.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] ?? null;

const customerName = (r: any): string =>
  `${r.firstname ?? ""} ${r.lastname ?? ""}`.trim() || r.customer_email || r.email || "Unknown";

function extractSearchName(message: string): string {
  const m = message.match(
    /(?:give me info(?:rmation)?|show me|tell me about|details?|info(?:rmation)?|look\s?up|find|check\s?on|account|status|update)\s+(?:of|about|on|for|for)?\s+(.+)/i
  );
  if (m) {
    return m[1]
      .replace(/\b(customer|client|account|user|contact|please|thanks)\b/gi, "")
      .replace(/\s+/g, " ").trim();
  }
  return message
    .toLowerCase()
    .replace(/\b(give|me|info|information|of|the|customer|client|tell|about|show|details|for|account|lookup|find|who|is|named|what|update|on|how|doing|please|status|get|fetch|pull|check)\b/g, " ")
    .replace(/\s+/g, " ").trim();
}

// ─── Safe SQL runner ──────────────────────────────────────────────────────────

async function runSql(label: string, sql: string): Promise<any[]> {
  console.log(`\n[SQL:${label}]\n${sql.slice(0, 300)}`);
  const rows = await coralSql(sql);
  console.log(`[SQL:${label}] ✅ ${rows.length} rows`);
  if (rows[0]) console.log(`[SQL:${label}] sample:`, JSON.stringify(rows[0]).slice(0, 200));
  return rows;
}

// ─── System prompt ────────────────────────────────────────────────────────────

const buildSystemPrompt = (role: string) => `You are an AI Collections Assistant for a B2B SaaS company in India.
The DATA BLOCK below was fetched LIVE from the database moments ago. It is 100% real.

RULES:
- Only reference names, emails, numbers that appear in the data block.
- Amounts are already in INR (₹). Display as-is.
- Be direct. Lead with numbers. No filler phrases.
- Never say "I don't have access" or "I would need to check".
- Show ALL customers listed — do not truncate.

Role: ${role}`;

// ─── Intent classification ────────────────────────────────────────────────────

type Intent =
  | "call_priority" | "overdue_list" | "revenue_summary" | "top_customers"
  | "churn_risk" | "recent_invoices" | "all_clients" | "customer_lookup"
  | "email_history" | "contact_timeline" | "team_pulse" | "dynamic";

function classifyIntent(msg: string): Intent | null {
  const m = msg.toLowerCase();
  if (/who.*(should|to|shall).*call|call.*(today|first|priority|next)|priority.*call/i.test(m)) return "call_priority";
  if (/overdue|past.?due|late.*(invoice|payment)|unpaid.*invoice/i.test(m)) return "overdue_list";
  if (/revenue.*(summary|overview|breakdown)|total.*revenue|how.*revenue|money.*collect/i.test(m)) return "revenue_summary";
  if (/top.*(customer|client|payer)|best.*(customer|client)|highest.*paid|biggest.*customer/i.test(m)) return "top_customers";
  if (/churn|at.?risk|losing.*customer|might.*leave/i.test(m)) return "churn_risk";
  if (/recent.*invoice|latest.*invoice|new.*invoice|last.*invoice/i.test(m)) return "recent_invoices";
  if (/all.*(client|customer)|client.*(list|all)|list.*customer|how many (client|customer)|show.*every/i.test(m)) return "all_clients";

  // ── 3-source cross-join intents ──────────────────────────────────────────
  if (/email.*(history|thread|sent|receiv)|last.*email|contact.*email|when.*email/i.test(m)) return "email_history";
  if (/timeline|full.*(history|picture|context|account)|everything.*about|360/i.test(m)) return "contact_timeline";
  if (/slack|team.*discuss|internal.*talk|who.*mentioned|channel/i.test(m)) return "team_pulse";

  // ── Customer lookup ───────────────────────────────────────────────────────
  if (extractEmail(msg)) return "customer_lookup";
  if (
    /give me (info|information|details|account)/i.test(m) ||
    /show me (info|information|details|account|status)/i.test(m) ||
    /tell me (about|more about)/i.test(m) ||
    /info(?:rmation)? (?:of|about|on|for)\s+\w/i.test(m) ||
    /details? (?:of|about|for|on)\s+\w/i.test(m) ||
    /(?:look\s?up|lookup)\s+\w/i.test(m) ||
    /\bfind\b.*(customer|client|contact|account)/i.test(m) ||
    /status (?:of|for)\s+\w/i.test(m) ||
    /check (?:on|up on)\s+\w/i.test(m) ||
    /who is\s+\w/i.test(m) ||
    /how is\s+\w/i.test(m) ||
    /account (?:of|for)\s+\w/i.test(m) ||
    /\b(about|for|of|on)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/i.test(msg)
  ) return "customer_lookup";

  return null;
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleAllClients(history: any[]): Promise<string> {
  const rows = await runSql("all_clients", `
    SELECT
      h.email AS customer_email, h.firstname, h.lastname, h.company, h.lifecyclestage,
      COUNT(s.id)                                                                      AS invoice_count,
      COALESCE(SUM(s.amount_due), 0)                                                  AS total_invoiced,
      COALESCE(SUM(CASE WHEN s.status = 'paid'               THEN 1 ELSE 0 END), 0)  AS paid_count,
      COALESCE(SUM(CASE WHEN s.status NOT IN ('paid','void') THEN 1 ELSE 0 END), 0)  AS unpaid_count,
      COALESCE(SUM(CASE WHEN s.status NOT IN ('paid','void') THEN s.amount_due ELSE 0 END), 0) AS balance_due
    FROM hubspot.contacts h
    LEFT JOIN stripe.invoices s ON LOWER(s.customer_email) = LOWER(h.email)
    WHERE h.email IS NOT NULL
    GROUP BY h.email, h.firstname, h.lastname, h.company, h.lifecyclestage
    ORDER BY balance_due DESC
  `);

  if (!rows.length) return "No client data found in HubSpot.";

  const totalDebt     = rows.reduce((a, r) => a + Number(r.balance_due ?? 0), 0);
  const totalInvoiced = rows.reduce((a, r) => a + Number(r.total_invoiced ?? 0), 0);

  const dataBlock = rows.slice(0, 100).map((r, i) =>
    `${i + 1}. ${customerName(r)} | ${r.company ?? "—"} | ${r.customer_email} | Stage: ${r.lifecyclestage ?? "—"} | Balance: ${fmt(r.balance_due)} | Invoices: ${r.invoice_count} (${r.paid_count} paid, ${r.unpaid_count} unpaid)`
  ).join("\n");

  return callGroq(
    buildSystemPrompt("B2B account manager giving a full client overview."),
    `LIVE DATA — ${rows.length} clients | Outstanding: ${fmt(totalDebt)} | Collected: ${fmt(totalInvoiced - totalDebt)}

${dataBlock}${rows.length > 100 ? `\n...and ${rows.length - 100} more.` : ""}

List ALL clients with key details. Summarize portfolio health. Flag top 3 accounts needing attention.`,
    history, 1200
  );
}

async function handleCallPriority(history: any[]): Promise<string> {
  const rows = await runSql("call_priority", `
    SELECT
      s.customer_email, h.firstname, h.lastname,
      COUNT(s.id)                         AS invoice_count,
      SUM(s.amount_due - s.amount_paid)   AS total_due,
      MIN(s.due_date)                     AS earliest_due_date
    FROM stripe.invoices s
    INNER JOIN hubspot.contacts h ON LOWER(h.email) = LOWER(s.customer_email)
    WHERE s.status NOT IN ('paid', 'void')
    GROUP BY s.customer_email, h.firstname, h.lastname
    ORDER BY total_due DESC
    LIMIT 15
  `);

  if (!rows.length) return "No overdue clients right now. Everyone is paid up. ✅";

  const dataBlock = rows.map((r, i) =>
    `${i + 1}. ${customerName(r)} (${r.customer_email}) | Owed: ${fmt(r.total_due)} | ${r.invoice_count} invoices | Earliest due: ${fmtDate(r.earliest_due_date)} (${daysOverdue(r.earliest_due_date)})`
  ).join("\n");

  return callGroq(
    buildSystemPrompt("B2B collections advisor — who to call today."),
    `LIVE DATA — Clients with unpaid invoices, ranked by amount owed:\n\n${dataBlock}

For each: rank, name, exact amount, days overdue, one-line call opener.`, history
  );
}

async function handleOverdueList(history: any[]): Promise<string> {
  const rows = await runSql("overdue_list", `
    SELECT
      s.customer_email, h.firstname, h.lastname,
      COUNT(s.id) AS invoice_count,
      SUM(s.amount_due - s.amount_paid) AS total_due,
      MIN(s.due_date) AS earliest_due
    FROM stripe.invoices s
    INNER JOIN hubspot.contacts h ON LOWER(h.email) = LOWER(s.customer_email)
    WHERE s.status NOT IN ('paid', 'void')
    GROUP BY s.customer_email, h.firstname, h.lastname
    ORDER BY total_due DESC
  `);

  if (!rows.length) return "No overdue invoices at the moment. ✅";

  const totalDue  = rows.reduce((a, r) => a + Number(r.total_due ?? 0), 0);
  const dataBlock = rows.map((r, i) =>
    `${i + 1}. ${customerName(r)} (${r.customer_email}): ${fmt(r.total_due)} (${r.invoice_count} invoices) — ${daysOverdue(r.earliest_due)}`
  ).join("\n");

  return callGroq(
    buildSystemPrompt("Collections assistant summarizing overdue invoices."),
    `LIVE DATA — ${rows.length} clients overdue | Total: ${fmt(totalDue)}\n\n${dataBlock}

Summarize with key stats and concrete next steps.`, history
  );
}

async function handleRevenueSummary(history: any[]): Promise<string> {
  const rows = await runSql("revenue_summary", `
    SELECT s.status, COUNT(s.id) AS count, SUM(s.amount_due) AS total_invoiced
    FROM stripe.invoices s
    INNER JOIN hubspot.contacts h ON LOWER(h.email) = LOWER(s.customer_email)
    GROUP BY s.status
  `);

  if (!rows.length) return "No invoice data found.";

  const totalInvoiced   = rows.reduce((a, r) => a + Number(r.total_invoiced ?? 0), 0);
  const totalCollected  = Number(rows.find(r => r.status === "paid")?.total_invoiced ?? 0);
  const totalOutstanding = rows.filter(r => !["paid","void"].includes(r.status)).reduce((a, r) => a + Number(r.total_invoiced ?? 0), 0);
  const rate = totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : "0";

  const dataBlock = rows.map(r => `${String(r.status).toUpperCase()}: ${r.count} invoices | ${fmt(r.total_invoiced)}`).join("\n");

  return callGroq(
    buildSystemPrompt("Financial analyst summarizing invoice revenue."),
    `LIVE DATA:\n${dataBlock}\n\nTotal invoiced: ${fmt(totalInvoiced)} | Collected: ${fmt(totalCollected)} | Outstanding: ${fmt(totalOutstanding)} | Rate: ${rate}%

Give a revenue summary with key insights.`, history
  );
}

async function handleTopCustomers(history: any[]): Promise<string> {
  const rows = await runSql("top_customers", `
    SELECT s.customer_email, h.firstname, h.lastname, h.company,
      COUNT(s.id) AS total_invoices, SUM(s.amount_due) AS total_paid
    FROM stripe.invoices s
    INNER JOIN hubspot.contacts h ON LOWER(h.email) = LOWER(s.customer_email)
    WHERE s.status = 'paid'
    GROUP BY s.customer_email, h.firstname, h.lastname, h.company
    ORDER BY total_paid DESC LIMIT 10
  `);

  if (!rows.length) return "No paid invoice data yet.";

  const dataBlock = rows.map((r, i) =>
    `${i + 1}. ${customerName(r)} (${r.company ?? "—"}) — ${fmt(r.total_paid)} across ${r.total_invoices} invoice(s)`
  ).join("\n");

  return callGroq(
    buildSystemPrompt("Revenue analyst presenting top paying customers."),
    `LIVE DATA — Top 10 by total paid:\n\n${dataBlock}\n\nRank with insights and a recommendation for each.`,
    history
  );
}

async function handleChurnRisk(history: any[]): Promise<string> {
  const rows = await runSql("churn_risk", `
    SELECT s.customer_email, h.firstname, h.lastname, h.company, h.lifecyclestage,
      COUNT(s.id) AS invoice_count,
      SUM(s.amount_due - s.amount_paid) AS total_due,
      MIN(s.due_date) AS earliest_due
    FROM stripe.invoices s
    INNER JOIN hubspot.contacts h ON LOWER(h.email) = LOWER(s.customer_email)
    WHERE s.status NOT IN ('paid', 'void')
    GROUP BY s.customer_email, h.firstname, h.lastname, h.company, h.lifecyclestage
    ORDER BY total_due DESC LIMIT 10
  `);

  if (!rows.length) return "No churn risk signals. All accounts appear healthy. ✅";

  const dataBlock = rows.map((r, i) =>
    `${i + 1}. ${customerName(r)} @ ${r.company ?? "—"} — ${fmt(r.total_due)} overdue, ${daysOverdue(r.earliest_due)}, stage: ${r.lifecyclestage ?? "—"}`
  ).join("\n");

  return callGroq(
    buildSystemPrompt("Customer success expert — churn prevention."),
    `LIVE DATA — At-risk customers:\n\n${dataBlock}\n\nFor each: the risk signal and ONE concrete retention action this week.`,
    history, 700
  );
}

async function handleRecentInvoices(history: any[]): Promise<string> {
  const rows = await runSql("recent_invoices", `
    SELECT s.id, s.customer_email, h.firstname, h.lastname,
      s.amount_due, s.status, s.created, s.due_date, s.number
    FROM stripe.invoices s
    INNER JOIN hubspot.contacts h ON LOWER(h.email) = LOWER(s.customer_email)
    ORDER BY s.created DESC LIMIT 20
  `);

  if (!rows.length) return "No recent invoices found.";

  const dataBlock = rows.map((r, i) =>
    `${i + 1}. ${customerName(r)} — ${fmt(r.amount_due)} (${r.status}) | #${r.number ?? r.id} | Created: ${fmtDate(r.created)} | Due: ${fmtDate(r.due_date)}`
  ).join("\n");

  return callGroq(
    buildSystemPrompt("Billing assistant summarizing recent invoice activity."),
    `LIVE DATA — 20 most recent invoices:\n\n${dataBlock}\n\nFlag unpaid/overdue ones and highlight anything needing immediate attention.`,
    history
  );
}

// ─── 🆕 Email history — Stripe + HubSpot + Gmail (3-source JOIN) ─────────────

async function handleEmailHistory(message: string, history: any[]): Promise<string> {
  console.log("[handleEmailHistory] 3-source query: Stripe + HubSpot + Gmail");

  const rows = await runSql("email_history", `
    SELECT
      h.firstname,
      h.lastname,
      h.email,
      h.company,
      SUM(CASE WHEN s.status NOT IN ('paid','void') THEN s.amount_due ELSE 0 END) AS balance_due,
      COUNT(DISTINCT s.id)          AS total_invoices,
      MAX(g.date)                   AS last_email_date,
      COUNT(DISTINCT g.id)          AS email_count,
      MAX(g.subject)                AS last_subject
    FROM hubspot.contacts h
    LEFT JOIN stripe.invoices s
      ON LOWER(s.customer_email) = LOWER(h.email)
    LEFT JOIN gmail.messages g
      ON LOWER(g.to) = LOWER(h.email)
      OR LOWER(g.from) = LOWER(h.email)
    WHERE h.email IS NOT NULL
    GROUP BY h.firstname, h.lastname, h.email, h.company
    HAVING COUNT(DISTINCT s.id) > 0
    ORDER BY balance_due DESC
    LIMIT 20
  `);

  if (!rows.length) {
    return "No email history data found. Make sure the Gmail source is added: `coral source add gmail`";
  }

  const dataBlock = rows.map((r, i) => {
    const lastContacted = r.last_email_date ? fmtDate(r.last_email_date) : "never emailed";
    const daysSince = r.last_email_date
      ? Math.floor((Date.now() - new Date(r.last_email_date).getTime()) / 86_400_000)
      : "∞";
    return `${i + 1}. ${customerName(r)} (${r.email}) | Balance: ${fmt(r.balance_due)} | Last emailed: ${lastContacted} (${daysSince} days ago) | Emails exchanged: ${r.email_count ?? 0} | Last subject: "${r.last_subject ?? "—"}"`;
  }).join("\n");

  return callGroq(
    buildSystemPrompt("Collections analyst reviewing customer email engagement vs payment status."),
    `LIVE DATA — Customer balances cross-referenced with email history (Stripe + HubSpot + Gmail):

${dataBlock}

Flag customers with high balances who haven't been contacted recently. Recommend who needs an email TODAY and suggest subject lines.`,
    history, 900
  );
}

// ─── 🆕 Contact timeline — full 360° view (Stripe + HubSpot + Gmail + Slack) ──

async function handleContactTimeline(message: string, history: any[]): Promise<string> {
  const email = extractEmail(message);
  const searchName = extractSearchName(message);

  // First resolve the email if not given directly
  let resolvedEmail = email;
  if (!resolvedEmail && searchName.length >= 2) {
    const safe  = searchName.replace(/'/g, "''");
    const words = searchName.split(/\s+/).filter(w => w.length >= 2).map(w => w.replace(/'/g, "''"));
    const wordConditions = words.map(w =>
      `(LOWER(h.firstname) LIKE '%${w}%' OR LOWER(h.lastname) LIKE '%${w}%' OR LOWER(h.email) LIKE '%${w}%')`
    ).join(" AND ");

    const matches = await runSql("timeline_lookup", `
      SELECT email FROM hubspot.contacts h
      WHERE (LOWER(firstname) || ' ' || LOWER(lastname) LIKE '%${safe.toLowerCase()}%')
         OR (${wordConditions})
      LIMIT 1
    `);
    resolvedEmail = matches[0]?.email ?? null;
  }

  if (!resolvedEmail) return `Couldn't find a customer matching "${searchName}". Try their email address.`;

  const safeEmail = resolvedEmail.replace(/'/g, "''");

  // Run all 4 sources in one coralMultiSql call (one process, sequential queries)
  const { contact, invoices, emails, slack } = await coralMultiSql({
    contact: `
      SELECT firstname, lastname, email, company, lifecyclestage, createdate
      FROM hubspot.contacts
      WHERE LOWER(email) = LOWER('${safeEmail}') LIMIT 1
    `,
    invoices: `
      SELECT s.id, s.status, s.amount_due, s.amount_paid,
        (s.amount_due - s.amount_paid) AS amount_remaining,
        s.created, s.due_date, s.number
      FROM stripe.invoices s
      INNER JOIN hubspot.contacts h ON LOWER(h.email) = LOWER(s.customer_email)
      WHERE LOWER(s.customer_email) = LOWER('${safeEmail}')
      ORDER BY s.created DESC LIMIT 20
    `,
    emails: `
      SELECT id, subject, snippet, date, "from", "to"
      FROM gmail.messages
      WHERE LOWER("to") = LOWER('${safeEmail}')
         OR LOWER("from") = LOWER('${safeEmail}')
      ORDER BY date DESC LIMIT 10
    `,
    slack: `
      SELECT text, channel, username, ts
      FROM slack.messages
      WHERE LOWER(text) LIKE '%${safeEmail.toLowerCase()}%'
      ORDER BY ts DESC LIMIT 5
    `,
  });

  if (!contact.length) return `No HubSpot contact found for ${resolvedEmail}.`;

  const c = contact[0];
  const name = customerName(c);

  // Compute financials in TypeScript — never trust LLM math
  const paidInvoices   = invoices.filter((r: any) => r.status === "paid");
  const unpaidInvoices = invoices.filter((r: any) => !["paid","void"].includes(r.status));
  const totalInvoiced  = invoices.reduce((a: number, r: any) => a + Number(r.amount_due ?? 0), 0);
  const totalCollected = paidInvoices.reduce((a: number, r: any) => a + Number(r.amount_due ?? 0), 0);
  const totalDue       = unpaidInvoices.reduce((a: number, r: any) => a + Number(r.amount_remaining ?? r.amount_due ?? 0), 0);

  const invoiceLines = invoices.length
    ? invoices.map((r: any, i: number) => {
        const isPaid = r.status === "paid";
        return `  ${i + 1}. #${r.number ?? r.id?.slice(0,12)} | ${r.status.toUpperCase().padEnd(14)} | ${fmt(r.amount_due)} | ${isPaid ? "Collected" : "Remaining"}: ${fmt(isPaid ? r.amount_due : r.amount_remaining ?? r.amount_due)} | Due: ${fmtDate(r.due_date)} (${daysOverdue(r.due_date)})`;
      }).join("\n")
    : "  No Stripe invoices.";

  const emailLines = emails.length
    ? emails.map((e: any, i: number) =>
        `  ${i + 1}. [${fmtDate(e.date)}] "${e.subject ?? "—"}" — ${e.snippet?.slice(0, 80) ?? ""}`
      ).join("\n")
    : "  No Gmail history found.";

  const slackLines = slack.length
    ? slack.map((s: any, i: number) =>
        `  ${i + 1}. [${s.channel}] ${s.username}: ${s.text?.slice(0, 100)}`
      ).join("\n")
    : "  No Slack mentions found.";

  const dataBlock = `
━━ CUSTOMER PROFILE ━━━━━━━━━━━━━━━━━━━━━━━━━
Name:            ${name}
Email:           ${resolvedEmail}
Company:         ${c.company ?? "—"}
Lifecycle stage: ${c.lifecyclestage ?? "—"}
HubSpot since:   ${fmtDate(c.createdate)}

━━ PAYMENT SUMMARY (Stripe) ━━━━━━━━━━━━━━━━━
${invoices.length} invoices | ${paidInvoices.length} paid | ${unpaidInvoices.length} unpaid
Total invoiced:  ${fmt(totalInvoiced)}
Total collected: ${fmt(totalCollected)}
Outstanding:     ${fmt(totalDue)}
Collection rate: ${totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(0) : 0}%

━━ INVOICE HISTORY ━━━━━━━━━━━━━━━━━━━━━━━━━━
${invoiceLines}

━━ EMAIL HISTORY (Gmail) ━━━━━━━━━━━━━━━━━━━━
${emailLines}

━━ INTERNAL SLACK MENTIONS ━━━━━━━━━━━━━━━━━━
${slackLines}
`.trim();

  return callGroq(
    buildSystemPrompt("B2B collections specialist reviewing a 360° customer account view."),
    `LIVE DATA — Full 360° account for ${name} (${resolvedEmail}):

${dataBlock}

Summarize: payment health, email engagement, internal team context. Assign risk level (Low/Medium/High). Give the #1 recommended action and an exact email subject line if needed.`,
    history, 700
  );
}

// ─── 🆕 Team pulse — Stripe + HubSpot + Slack ────────────────────────────────

async function handleTeamPulse(history: any[]): Promise<string> {
  console.log("[handleTeamPulse] 3-source query: Stripe + HubSpot + Slack");

  const rows = await runSql("team_pulse", `
    SELECT
      h.firstname,
      h.lastname,
      h.email,
      h.company,
      SUM(CASE WHEN s.status NOT IN ('paid','void') THEN s.amount_due ELSE 0 END) AS balance_due,
      COUNT(DISTINCT sl.id) AS slack_mentions,
      MAX(sl.ts)            AS last_mention_ts
    FROM hubspot.contacts h
    LEFT JOIN stripe.invoices s
      ON LOWER(s.customer_email) = LOWER(h.email)
    LEFT JOIN slack.messages sl
      ON LOWER(sl.text) LIKE '%' || LOWER(h.email) || '%'
      OR LOWER(sl.text) LIKE '%' || LOWER(COALESCE(h.company,'XXXXXXXXX')) || '%'
    WHERE h.email IS NOT NULL
    GROUP BY h.firstname, h.lastname, h.email, h.company
    HAVING SUM(CASE WHEN s.status NOT IN ('paid','void') THEN s.amount_due ELSE 0 END) > 0
    ORDER BY balance_due DESC
    LIMIT 15
  `);

  if (!rows.length) return "No data found. Ensure the Slack source is added: `coral source add slack`";

  const dataBlock = rows.map((r, i) => {
    const lastMention = r.last_mention_ts
      ? fmtDate(Number(r.last_mention_ts) > 1e9 ? new Date(Number(r.last_mention_ts) * 1000) : r.last_mention_ts)
      : "never";
    return `${i + 1}. ${customerName(r)} (${r.company ?? "—"}) | Balance: ${fmt(r.balance_due)} | Slack mentions: ${r.slack_mentions ?? 0} | Last mentioned: ${lastMention}`;
  }).join("\n");

  return callGroq(
    buildSystemPrompt("Collections team lead reviewing internal communication coverage."),
    `LIVE DATA — Overdue customers cross-referenced with Slack activity (Stripe + HubSpot + Slack):

${dataBlock}

Identify gaps: who has a high balance but zero internal discussion? Flag accounts where the team might not be aware of the overdue situation.`,
    history, 700
  );
}

// ─── Customer lookup ──────────────────────────────────────────────────────────

async function handleCustomerLookup(message: string, history: any[]): Promise<string> {
  const email = extractEmail(message);
  if (email) return fetchCustomerByEmail(email, history);

  const searchTerm = extractSearchName(message);
  if (!searchTerm || searchTerm.length < 2) return "Please provide a customer name or email.";

  const safeTerm = searchTerm.replace(/'/g, "''");
  const words    = searchTerm.split(/\s+/).filter(w => w.length >= 2).map(w => w.replace(/'/g, "''"));

  const wordConditions = words
    .map(w => `(LOWER(h.firstname) LIKE '%${w}%' OR LOWER(h.lastname) LIKE '%${w}%' OR LOWER(h.company) LIKE '%${w}%' OR LOWER(h.email) LIKE '%${w}%')`)
    .join(" AND ");

  const [hubspotMatches, stripeMatches] = await Promise.all([
    runSql("lookup_hs", `
      SELECT h.firstname, h.lastname, h.email, h.company
      FROM hubspot.contacts h
      WHERE (LOWER(h.firstname) || ' ' || LOWER(h.lastname) LIKE '%${safeTerm.toLowerCase()}%')
         OR (${wordConditions})
         OR LOWER(h.email) LIKE '%${safeTerm.toLowerCase()}%'
      LIMIT 5
    `),
    runSql("lookup_stripe", `
      SELECT DISTINCT s.customer_email AS email, h.firstname, h.lastname
      FROM stripe.invoices s
      INNER JOIN hubspot.contacts h ON LOWER(h.email) = LOWER(s.customer_email)
      WHERE LOWER(s.customer_name) LIKE '%${safeTerm.toLowerCase()}%'
         OR LOWER(s.customer_email) LIKE '%${safeTerm.toLowerCase()}%'
      LIMIT 5
    `),
  ]);

  const seen     = new Set<string>();
  const combined: { email: string; name: string }[] = [];
  for (const h of [...hubspotMatches, ...stripeMatches]) {
    const e = (h.email ?? "").toLowerCase();
    if (e && !seen.has(e)) {
      seen.add(e);
      combined.push({ email: h.email, name: `${h.firstname ?? ""} ${h.lastname ?? ""}`.trim() || h.email });
    }
  }

  if (!combined.length) return `No customer matching "${searchTerm}" found. Try their exact email.`;
  if (combined.length === 1) return fetchCustomerByEmail(combined[0].email, history);

  return `Found ${combined.length} matches:\n\n${combined.map((c, i) => `${i + 1}. ${c.name} (${c.email})`).join("\n")}\n\nReply with their email for full account details.`;
}

async function fetchCustomerByEmail(email: string, history: any[]): Promise<string> {
  const safe = email.replace(/'/g, "''");

  const { contact, invoices, emails } = await coralMultiSql({
    contact: `
      SELECT firstname, lastname, email, company, lifecyclestage, createdate
      FROM hubspot.contacts WHERE LOWER(email) = LOWER('${safe}') LIMIT 1
    `,
    invoices: `
      SELECT s.id, s.status, s.amount_due, s.amount_paid,
        (s.amount_due - s.amount_paid) AS amount_remaining,
        s.created, s.due_date, s.number
      FROM stripe.invoices s
      INNER JOIN hubspot.contacts h ON LOWER(h.email) = LOWER(s.customer_email)
      WHERE LOWER(s.customer_email) = LOWER('${safe}')
      ORDER BY s.created DESC LIMIT 20
    `,
    emails: `
      SELECT subject, date FROM gmail.messages
      WHERE LOWER("to") = LOWER('${safe}') OR LOWER("from") = LOWER('${safe}')
      ORDER BY date DESC LIMIT 3
    `,
  });

  if (!contact.length) return `No HubSpot contact found for **${email}**. They may have been deleted.`;

  const c = contact[0];
  const paidInvoices   = invoices.filter((r: any) => r.status === "paid");
  const unpaidInvoices = invoices.filter((r: any) => !["paid","void"].includes(r.status));
  const totalInvoiced  = invoices.reduce((a: number, r: any) => a + Number(r.amount_due ?? 0), 0);
  const totalCollected = paidInvoices.reduce((a: number, r: any) => a + Number(r.amount_due ?? 0), 0);
  const totalDue       = unpaidInvoices.reduce((a: number, r: any) => a + Number(r.amount_remaining ?? r.amount_due ?? 0), 0);

  const invoiceLines = invoices.map((r: any, i: number) => {
    const isPaid = r.status === "paid";
    return `  ${i + 1}. #${r.number ?? r.id?.slice(0,12)} | ${r.status.toUpperCase().padEnd(14)} | ${fmt(r.amount_due)} | ${isPaid ? "✅" : "⏳"} Due: ${fmtDate(r.due_date)} (${daysOverdue(r.due_date)})`;
  }).join("\n") || "  No invoices.";

  const emailLines = emails.length
    ? emails.map((e: any) => `  • [${fmtDate(e.date)}] "${e.subject ?? "—"}"`).join("\n")
    : "  No email history.";

  const dataBlock = `
━━ PROFILE ━━━━━━━━━━━━━
${customerName(c)} | ${c.company ?? "—"} | Stage: ${c.lifecyclestage ?? "—"} | Since: ${fmtDate(c.createdate)}

━━ FINANCIALS ━━━━━━━━━━
${invoices.length} invoices | ${paidInvoices.length} paid | ${unpaidInvoices.length} unpaid
Invoiced: ${fmt(totalInvoiced)} | Collected: ${fmt(totalCollected)} | Outstanding: ${fmt(totalDue)}
Rate: ${totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(0) : 0}%

━━ INVOICES ━━━━━━━━━━━━
${invoiceLines}

━━ RECENT EMAILS ━━━━━━━
${emailLines}
`.trim();

  return callGroq(
    buildSystemPrompt("Collections assistant reviewing a specific customer account."),
    `LIVE DATA (Stripe + HubSpot + Gmail) for ${customerName(c)} (${email}):

${dataBlock}

Summarize: payment health, email engagement, risk level (Low/Medium/High), #1 next action.`,
    history, 600
  );
}

// ─── Dynamic handler ──────────────────────────────────────────────────────────

async function handleDynamic(message: string, history: any[]): Promise<string> {
  const queries = await (async () => {
    const raw = await callGroq(
      `You are a SQL expert for DuckDB. Return ONLY a raw JSON array of SQL strings. No markdown, no backticks.
${DB_SCHEMA}`,
      `Generate 1-3 SQL queries to answer: "${message}"`,
      [], 500
    );
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
    } catch {
      const matches = [...raw.matchAll(/"(SELECT[^"]+)"/gi)];
      return matches.map(m => m[1]);
    }
  })();

  if (!queries.length) return handleGeneralSnapshot(message, history);

  const resultBlocks: string[] = [];
  for (const sql of queries.slice(0, 3)) {
    try {
      const rows = await runSql("dynamic", sql);
      if (rows.length) {
        const formatted = rows.slice(0, 30).map((r, i) => {
          const pairs = Object.entries(r).map(([k, v]) => {
            if (/amount|due|paid|revenue|balance/i.test(k) && typeof v === "number") return `${k}: ${fmt(v)}`;
            if (/created|date|paid_at/i.test(k)) return `${k}: ${fmtDate(v)}`;
            return `${k}: ${v ?? "—"}`;
          }).join(" | ");
          return `  ${i + 1}. ${pairs}`;
        }).join("\n");
        resultBlocks.push(`Results (${rows.length} rows):\n${formatted}`);
      } else {
        resultBlocks.push("Query returned 0 rows.");
      }
    } catch (e: any) {
      resultBlocks.push(`Query error: ${e.message}`);
    }
  }

  if (resultBlocks.every(b => b.includes("0 rows") || b.includes("error"))) {
    return handleGeneralSnapshot(message, history);
  }

  return callGroq(
    buildSystemPrompt("Expert Collections Assistant."),
    `User: "${message}"\n\nLIVE DATA:\n${resultBlocks.join("\n\n")}\n\nAnswer directly using this data. Be specific.`,
    history, 700
  );
}

async function handleGeneralSnapshot(message: string, history: any[]): Promise<string> {
  const rows = await runSql("snapshot", `
    SELECT
      COUNT(DISTINCT h.email)                                                                     AS total_clients,
      COUNT(s.id)                                                                                 AS total_invoices,
      COALESCE(SUM(CASE WHEN s.status = 'paid'               THEN 1   ELSE 0 END), 0)           AS paid_invoices,
      COALESCE(SUM(CASE WHEN s.status NOT IN ('paid','void') THEN 1   ELSE 0 END), 0)           AS unpaid_invoices,
      COALESCE(SUM(CASE WHEN s.status = 'paid'               THEN s.amount_due ELSE 0 END), 0)  AS total_collected,
      COALESCE(SUM(CASE WHEN s.status NOT IN ('paid','void') THEN s.amount_due ELSE 0 END), 0)  AS total_outstanding
    FROM hubspot.contacts h
    LEFT JOIN stripe.invoices s ON LOWER(s.customer_email) = LOWER(h.email)
    WHERE h.email IS NOT NULL
  `);

  const snap = rows[0] ?? {};
  const snapshot = `LIVE SNAPSHOT:
- Clients: ${snap.total_clients ?? "?"}
- Invoices: ${snap.total_invoices ?? "?"} (${snap.paid_invoices ?? "?"} paid, ${snap.unpaid_invoices ?? "?"} unpaid)
- Collected: ${fmt(snap.total_collected)} | Outstanding: ${fmt(snap.total_outstanding)}`;

  return callGroq(
    buildSystemPrompt("Expert Collections Assistant."),
    `${snapshot}\n\nQuestion: "${message}"\n\nAnswer using the snapshot above.`,
    history
  );
}

// ─── Main route ───────────────────────────────────────────────────────────────

router.post("/chat", async (req: Request<{}, {}, ChatRequestBody>, res: Response) => {
  const { message, history = [] } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ success: false, error: "message is required" });
  }

  console.log(`\n${"=".repeat(60)}\n[CHAT] "${message}" | ${new Date().toISOString()}`);

  try {
    const intent: Intent = classifyIntent(message) ?? "dynamic";
    console.log(`[CHAT] Intent: ${intent}`);

    let reply = "";
    switch (intent) {
      case "call_priority":     reply = await handleCallPriority(history);                break;
      case "overdue_list":      reply = await handleOverdueList(history);                 break;
      case "revenue_summary":   reply = await handleRevenueSummary(history);              break;
      case "top_customers":     reply = await handleTopCustomers(history);                break;
      case "churn_risk":        reply = await handleChurnRisk(history);                   break;
      case "recent_invoices":   reply = await handleRecentInvoices(history);              break;
      case "all_clients":       reply = await handleAllClients(history);                  break;
      case "email_history":     reply = await handleEmailHistory(message, history);       break;
      case "contact_timeline":  reply = await handleContactTimeline(message, history);    break;
      case "team_pulse":        reply = await handleTeamPulse(history);                   break;
      case "customer_lookup":   reply = await handleCustomerLookup(message, history);     break;
      case "dynamic":           reply = await handleDynamic(message, history);            break;
    }

    console.log(`[CHAT] ✅ ${reply.length} chars`);
    return res.json({ success: true, reply, intent });

  } catch (err: any) {
    console.error("[CHAT] ❌", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;