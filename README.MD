# Zindle.AI — Collections Intelligence Platform

> Most businesses don't have a collections problem. They have a visibility problem.

Customer information lives in HubSpot. Invoices live in Stripe. Conversations live in email. Every time a payment gets delayed, teams jump between systems trying to understand what happened, what changed, and what to do next.

**Zindle.AI** reconstructs the complete customer journey across CRM, invoicing, and communication systems — helping teams understand customer behavior, identify revenue risk, and take action before payments are lost.

---

## The Problem We Solve

```
Customer information  →  HubSpot
Invoices             →  Stripe
Conversations        →  Gmail / Slack
```

Instead of isolated invoices and disconnected records, Zindle gives your team a **living customer intelligence layer** powered by [Coral](https://github.com/coraldb) — joining all three data sources in real time.

---

## Product Story

| Step | Question | Answer |
|------|----------|--------|
| **1. Visibility** | What's happening across my portfolio? | Dashboard with revenue at risk, high-risk customers, outstanding invoices |
| **2. Context** | Why is this customer behaving this way? | Invoice Journey Graph reconstructing every interaction |
| **3. Intelligence** | What does this mean? | AI-generated insights per customer |
| **4. Reasoning** | What should I do? | Natural language AI chat with SQL-backed answers |
| **5. Execution** | Take action. | Generate email → send → track → timeline updates |

---

## Features

### 1. Dashboard — Visibility

> _What's happening across my customer portfolio?_

<!-- IMAGE PLACEHOLDER: Dashboard overview screenshot -->
<!-- Place your dashboard screenshot here -->
<!-- Example: ![Dashboard](./docs/images/dashboard.png) -->

Real-time portfolio health at a glance:

- **Revenue at risk** — outstanding balances across all clients
- **High-risk customers** — accounts flagged by behavior signals
- **Invoice health** — paid vs unpaid split
- **Customer lifecycle** — HubSpot stage synced live

Every metric is computed from live Coral SQL joins across Stripe and HubSpot — no stale cache, no manual sync.

---

### 2. Invoice Journey Graph — Context

> _Why is this customer behaving this way?_

<!-- IMAGE PLACEHOLDER: Journey graph / flow view screenshot -->
<!-- Place your Journey Flow screenshot here -->
<!-- Example: ![Journey Flow](./docs/images/journey-flow.png) -->

Click any customer to open a full relationship timeline powered by Coral joins across CRM, email, and invoice systems.

The timeline reconstructs the complete customer payment journey:

```
Deal Closed
     ↓
Contract Signed
     ↓
Invoice Sent
     ↓
Email Opened
     ↓
Link Clicked 3×
     ↓
Follow-up Sent
     ↓
Payment Received  /  Ghosted
```

<!-- IMAGE PLACEHOLDER: Journey timeline view screenshot -->
<!-- Place your Timeline screenshot here -->
<!-- Example: ![Journey Timeline](./docs/images/journey-timeline.png) -->

Every interaction becomes a node:

- Invoice creation, send, open, click, payment
- Email engagement (opened, clicked, bounced)
- Payment behavior and history
- Follow-ups and internal Slack mentions
- Risk spikes with timestamps

Each node includes AI-generated insights, quick actions, and contextual recommendations:

> _"Customer repeatedly opens invoices late at night."_
> _"Historically responds better to direct calls."_
> _"Engagement dropped after invoice amount increased."_

Two views available: **Flow** (ReactFlow graph) and **Timeline** (chronological list), both filterable by source — Stripe, Gmail, HubSpot.

---

### 3. Ask AI — Reasoning

> _What should I do?_

<!-- IMAGE PLACEHOLDER: AI Chat screenshot -->
<!-- Place your AI chat screenshot here -->
<!-- Example: ![AI Chat](./docs/images/ai-chat.png) -->

The AI Collections Assistant answers operational questions in natural language. Ask it anything:

```
"Who should I call today?"
"Which customers are most likely to churn?"
"Show highest revenue at risk."
"Which invoices were reopened multiple times?"
"Who usually pays late but eventually converts?"
```

Internally, the agent runs Coral SQL joins across Stripe + HubSpot + Gmail in real time, then responds with prioritized recommendations:

> _"Call Acme Corp first. $12,000 overdue, 18 days late. Last email opened but not replied 6 days ago. Historically responds best to direct calls."_

Intent classification routes each query to the right handler — no hallucinated data, every answer is grounded in live database results.

**Supported intents:**

| Intent | Example |
|--------|---------|
| Call priority | "Who should I call today?" |
| Overdue list | "Show all overdue invoices" |
| Revenue summary | "How much have we collected this month?" |
| Top customers | "Who are our best paying clients?" |
| Churn risk | "Which customers might leave?" |
| Customer lookup | "Tell me about Acme Corp" |
| Email history | "When did we last contact them?" |
| Contact timeline | "Full 360° view of john@acme.com" |
| Team pulse | "Which overdue accounts aren't being discussed?" |

---

### 4. Activity — Execution

> _Take action._

<!-- IMAGE PLACEHOLDER: Activity / client cards screenshot -->
<!-- Place your Activity view screenshot here -->
<!-- Example: ![Activity View](./docs/images/activity.png) -->

The Activity view lists all clients as cards with real-time risk signals, outstanding balances, and lifecycle stage. Filter by risk level, search by name, sort by amount due.

<!-- IMAGE PLACEHOLDER: Customer profile / invoice list screenshot -->
<!-- Place your Customer Profile screenshot here -->
<!-- Example: ![Customer Profile](./docs/images/customer-profile.png) -->

Click any client to open their full profile:

- Complete invoice history with status, amounts, due dates
- Payment rate and collection metrics
- Email communication history (HubSpot + Resend)
- Risk level: `healthy` / `medium` / `high` / `critical`

<!-- IMAGE PLACEHOLDER: Email draft / send screenshot -->
<!-- Place your Email Generator screenshot here -->
<!-- Example: ![Email Generator](./docs/images/email-draft.png) -->

**AI Email Generator** — generate and send follow-up emails without leaving the app:

| Email Type | Description |
|------------|-------------|
| Payment reminder | Warm, short — flags pending balance |
| Overdue follow-up | Firm but personal — escalates urgency |
| Relationship check-in | Friendly tone — asks how things are going |
| Custom | Any goal you define |

Emails are generated by LLM with account context (balance, history, engagement) but **never expose raw amounts or invoice numbers** — they read like a real person wrote them. Send via Resend directly from the UI, track opens and clicks back to the customer timeline.

---

## How Coral Powers This

Zindle's entire data layer runs through [Coral](https://withcoral.com) — a single SQL interface that turns APIs and files into queryable tables. Instead of writing separate API clients for Stripe, HubSpot, and Gmail, we write one SQL query and Coral handles the rest.

### The problem Coral solves here

Without Coral, answering "who should I call today?" requires:

1. Fetch all contacts from HubSpot API (paginated)
2. Fetch all invoices from Stripe API (paginated, filtered)
3. Fetch email threads from Gmail API
4. Join everything in application code
5. Sort, filter, and rank the result

With Coral, it's one query:

```sql
SELECT
  h.firstname, h.lastname, h.email,
  COUNT(s.id)                       AS invoice_count,
  SUM(s.amount_due - s.amount_paid) AS total_due,
  MIN(s.due_date)                   AS earliest_due_date
FROM stripe.invoices s
INNER JOIN hubspot.contacts h ON LOWER(h.email) = LOWER(s.customer_email)
WHERE s.status NOT IN ('paid', 'void')
GROUP BY s.customer_email, h.firstname, h.lastname
ORDER BY total_due DESC
LIMIT 15
```

Coral executes this locally on your machine — no data leaves, no external service is called, no glue code required.

### Sources used

| Source | Schema | Tables | How it's used |
|--------|--------|--------|---------------|
| **Stripe** | `stripe` | `invoices` | Invoice status, amounts, due dates, payment timestamps |
| **HubSpot** | `hubspot` | `contacts`, `email_events` | Contact identity, lifecycle stage, CRM communication history |
| **Gmail** | `gmail` | `messages` | Email threads, subjects, open/click engagement |
| **Slack** | `slack` | `messages` | Internal team mentions, discussion context per customer |

### HubSpot — custom source spec

HubSpot is not bundled in Coral by default. We connect it using a **custom source spec** — a YAML file that tells Coral how to authenticate against the HubSpot API and which tables to expose.

```bash
# Add HubSpot as a custom Coral source
coral source add --file ./hubspot-source.yaml --interactive
```

The source spec defines:

- **Authentication** — HubSpot Private App token stored locally by Coral, never hardcoded
- **Tables** — `hubspot.contacts` and `hubspot.email_events` mapped from HubSpot REST endpoints
- **Columns** — `id`, `firstname`, `lastname`, `email`, `company`, `lifecyclestage`, `createdate`

Once added, `hubspot.contacts` becomes a first-class SQL table, joinable against `stripe.invoices` on `email` with no extra code:

```sql
-- HubSpot is truth — always join from here
FROM hubspot.contacts h
LEFT JOIN stripe.invoices s ON LOWER(s.customer_email) = LOWER(h.email)
WHERE h.email IS NOT NULL
```

This join rule — **HubSpot is truth** — is enforced across every query in the codebase. If a contact was deleted from HubSpot, they don't appear in results, even if their invoices still exist in Stripe.

### Coral MCP — persistent stdio connection

Coral exposes its query engine over MCP (Model Context Protocol) via stdio. The backend runs `coral mcp-stdio` as a child process and communicates through JSON-RPC:

```
Backend (Node.js)
      │
      │  JSON-RPC over stdin/stdout
      ▼
coral mcp-stdio  (local process)
      │
      ├── stripe.invoices    → Stripe API
      ├── hubspot.contacts   → HubSpot API  (custom source spec)
      ├── gmail.messages     → Gmail API
      └── slack.messages     → Slack API
```

Rather than spawning a new `coral` process per query (which had cold-start overhead), we maintain a **persistent singleton** — initialized once on server startup, reused for every query:

```typescript
// coral/mcp.ts — one process, lifetime of the server
class CoralMcpClient {
  private proc: ChildProcessWithoutNullStreams | null = null;

  async sql(query: string): Promise<any[]> {
    await this.getClient(); // reuses existing process
    // sends JSON-RPC, reads response, parses rows
  }
}

const coral = new CoralMcpClient(); // singleton
```

If the process crashes, `getClient()` automatically reboots it before the next query.

### Cross-source joins in practice

Every meaningful query in Zindle joins at least two sources. Coral makes this feel like a single database:

```sql
-- 3-source join: Stripe + HubSpot + Gmail
-- "Which overdue customers haven't been emailed recently?"
SELECT
  h.firstname, h.lastname, h.email, h.company,
  SUM(CASE WHEN s.status NOT IN ('paid','void') THEN s.amount_due ELSE 0 END) AS balance_due,
  MAX(g.date)                AS last_email_date,
  COUNT(DISTINCT g.id)       AS email_count
FROM hubspot.contacts h
LEFT JOIN stripe.invoices s  ON LOWER(s.customer_email) = LOWER(h.email)
LEFT JOIN gmail.messages g   ON LOWER(g.to) = LOWER(h.email)
                             OR LOWER(g.from) = LOWER(h.email)
WHERE h.email IS NOT NULL
GROUP BY h.firstname, h.lastname, h.email, h.company
HAVING COUNT(DISTINCT s.id) > 0
ORDER BY balance_due DESC
```

Without Coral, this would require three separate API clients, three pagination loops, and manual in-memory joining — hundreds of lines of glue code. With Coral, it's one query.

### Why this matters for AI

The AI assistant receives **structured query results**, not raw API responses. This means:

- The LLM never sees pagination tokens, rate limit headers, or API error shapes
- Every number in the AI's response came from a SQL aggregate — not hallucinated
- The LLM prompt contains clean tabular data: `name | balance | last_contact | days_overdue`
- Cross-source reasoning (email engagement + payment behavior) happens in SQL, not in the model

```
User: "Who should I call today?"
         ↓
Intent classifier → call_priority handler
         ↓
Coral SQL (Stripe JOIN HubSpot) → ranked rows
         ↓
LLM (Groq) → narrates the data, adds call openers
         ↓
"Call Acme Corp first. ₹84,000 overdue, 23 days late..."
```

---

## Architecture

```
┌─────────────────────────────────────────┐
│              Frontend (React)            │
│  Dashboard · Journey · Chat · Activity  │
└──────────────────┬──────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────┐
│           Backend (Express + TS)         │
│                                         │
│  /api/clients          → client list    │
│  /api/clients/journey  → journey graph  │
│  /api/chat             → AI assistant   │
│  /api/customers/:email → profile        │
│  /api/risk/all         → risk scores    │
└──────────────────┬──────────────────────┘
                   │ JSON-RPC / stdio
┌──────────────────▼──────────────────────┐
│         coral mcp-stdio (local)          │
│                                         │
│  stripe.invoices     hubspot.contacts   │
│  gmail.messages      slack.messages     │
│  hubspot.email_events                   │
└───────┬──────────┬──────────┬───────────┘
        │          │          │
   Stripe API  HubSpot API  Gmail API
  (bundled)   (custom spec) (bundled)
```

**AI layer:**

- **Groq (LLaMA 3.3 70B)** — SQL generation, insight synthesis, email drafting
- **Intent classifier** — regex-based routing before any LLM call
- **Data-first approach** — SQL runs first, results passed to LLM; model never invents numbers

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Redux Toolkit, ReactFlow, TypeScript |
| Backend | Express, TypeScript, Node.js |
| Database joins | Coral MCP (DuckDB SQL) |
| AI | Groq API — LLaMA 3.3 70B Versatile |
| Email delivery | Resend |
| CRM | HubSpot |
| Payments | Stripe |
| Styling | CSS-in-JS (component-level) |

---

## Project Structure

```
Zindle.AI/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── clients.routes.ts     # GET /api/clients
│   │   │   ├── chat.route.ts         # POST /api/chat
│   │   │   ├── customer.route.ts     # GET /api/customers/:email/*
│   │   │   ├── journey.route.ts      # GET /api/clients/journey
│   │   │   ├── risk.routes.ts        # GET /api/risk/*
│   │   │   └── webhooks.routes.ts    # Resend webhook
│   │   ├── coral/
│   │   │   ├── mcp.ts                # Coral MCP singleton client
│   │   │   ├── client.ts             # runCoralQuery helper
│   │   │   └── queries.ts            # All SQL query templates
│   │   ├── lib/journey/
│   │   │   └── buildJourney.ts       # Journey graph builder
│   │   ├── risk/
│   │   │   ├── collector.ts          # Signal collection
│   │   │   └── scorer.ts             # Risk score calculation
│   │   ├── ai/
│   │   │   └── ai.ts                 # Risk insight generation
│   │   └── index.ts                  # Express app entry point
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.tsx          # Portfolio overview
    │   │   └── Activity.tsx           # Client cards grid
    │   ├── components/
    │   │   ├── Chat.tsx               # AI assistant UI
    │   │   └── JourneyView.tsx        # Flow + timeline graph
    │   ├── store/
    │   │   └── slices/                # Redux slices
    │   └── main.tsx
    ├── package.json
    └── vite.config.ts
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- [Coral CLI](https://withcoral.com) installed and configured
- Stripe Private App token, HubSpot Private App token, Gmail configured

### 1. Install Coral

```bash
brew install withcoral/tap/coral
```

See [all installation options](https://withcoral.com/docs/installation).

### 2. Connect data sources

Stripe and Gmail are bundled sources. HubSpot connects via a custom source spec included in this repo.

```bash
# Bundled sources
coral source add stripe
coral source add gmail       # optional — enables email history
coral source add slack       # optional — enables team pulse

# HubSpot — custom source spec (requires a HubSpot Private App token)
coral source add --file ./hubspot-source.yaml --interactive
```

Verify the sources are working:

```bash
coral source list
coral sql "SELECT email, lifecyclestage FROM hubspot.contacts LIMIT 5"
coral sql "SELECT customer_email, status, amount_due FROM stripe.invoices LIMIT 5"
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in: GROQ_API_KEY, RESEND_API_KEY, FROM_EMAIL, FROM_NAME
npm install
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:5000`.

---

## Environment Variables

```env
# backend/.env

GROQ_API_KEY=          # Groq API key (LLaMA 3.3 70B)
RESEND_API_KEY=        # Resend API key for email delivery
FROM_EMAIL=            # Sender email (must be verified in Resend)
FROM_NAME=             # Sender display name
CORAL_PATH=            # Path to coral binary (auto-detected if in PATH)
PORT=5000
```

---

## Key Design Decisions

**Coral MCP as a persistent singleton** — The backend spawns a single `coral mcp-stdio` process on startup and reuses it for all queries. This eliminates the cold-start cost of spawning a new process per request, which was the previous approach.

**Data-first, LLM-second** — Every AI response starts with a SQL query. The LLM only receives structured data and is asked to synthesize, rank, or narrate it. It never generates numbers or customer details from memory.

**Intent classification before LLM** — A regex-based classifier routes queries to typed handlers before any LLM call. This makes common queries fast, deterministic, and cheap.

**Risk scoring in TypeScript, not SQL** — Financial calculations (payment rate, overdue days, risk tier) happen in application code after data is fetched, not inside SQL. This keeps queries simple and math auditable.

---

## Risk Levels

| Level | Criteria |
|-------|----------|
| `healthy` | All invoices paid, or no open invoices |
| `medium` | Has open invoices, but has paid before |
| `high` | Has never paid any invoice |
| `critical` | Has invoices, total paid is zero |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/clients` | All clients with billing summary |
| `GET` | `/api/clients/:email/invoices` | Invoices for a specific client |
| `GET` | `/api/clients/journey?email=` | Full journey graph + AI insights |
| `POST` | `/api/chat` | AI assistant (send `{ message, history }`) |
| `GET` | `/api/customers/:email/profile` | Full customer profile |
| `POST` | `/api/customers/:email/draft-email` | Generate follow-up email |
| `POST` | `/api/customers/:email/send-email` | Send email via Resend |
| `GET` | `/api/risk/all` | Risk scores for all customers |
| `GET` | `/api/risk/summary` | Portfolio risk summary |
| `GET` | `/api/risk/:email` | Risk profile for one customer |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

---

## License

MIT — see [LICENSE](./LICENSE) for details.

---

<p align="center">Built with <a href="https://www.anthropic.com">Coral</a> · <a href="https://groq.com">Groq</a> · <a href="https://stripe.com">Stripe</a> · <a href="https://hubspot.com">HubSpot</a> · <a href="https://resend.com">Resend</a></p>