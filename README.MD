# Zindle.AI — Collections Intelligence Platform

<img width="2868" height="1298" alt="Zindle.AI hero" src="https://github.com/user-attachments/assets/2ad5fafc-cc0c-4894-a04a-1404c9ed816d" />

## Team

| | Name | GitHub |
|---|---|---|
| 👤 | Aymaan Pathan | [@AymaanPathan](https://github.com/AymaanPathan) |
| 👤 | Pratyakshya | [@Pratyakshya10](https://github.com/Pratyakshya10) |

---

> Most businesses don't have a collections problem. They have a visibility problem.

Customer information lives in HubSpot. Invoices live in Stripe. Conversations live in email. Every time a payment gets delayed, teams jump between systems trying to understand what happened, what changed, and what to do next.

**Zindle.AI** reconstructs the complete customer journey across CRM, invoicing, and communication systems — helping teams understand customer behavior, identify revenue risk, and take action before payments are lost.

---

## The Problem We Solve

```
Customer information  →  HubSpot
Invoices             →  Stripe
Email delivery       →  Resend  (events stored in Supabase)
```

Instead of isolated invoices and disconnected records, Zindle gives your team a **living customer intelligence layer** powered by [Coral](https://withcoral.com/docs) — joining CRM and invoicing data in real time, while email delivery and tracking are handled end-to-end by Resend.

---

## Product Story

| Step | Question | Answer |
|------|----------|--------|
| **1. Visibility** | What's happening across my portfolio? | Dashboard with revenue at risk, high-risk customers, outstanding invoices |
| **2. Context** | Why is this customer behaving this way? | Invoice Journey Graph reconstructing every interaction |
| **3. Intelligence** | What does this mean? | AI-generated insights per customer |
| **4. Reasoning** | What should I do? | Natural language AI chat with SQL-backed answers |
| **5. Execution** | Take action. | Generate email → send via Resend → track events → timeline updates |

---

## Features

### 1. Dashboard — Visibility

<img width="2868" height="1298" alt="Dashboard overview" src="https://github.com/user-attachments/assets/e932c7e2-c6f9-4b80-8553-d69da53f05f9" />

> *What's happening across my customer portfolio?*

Real-time portfolio health at a glance:

- **Revenue at risk** — outstanding balances across all clients
- **High-risk customers** — accounts flagged by behavior signals
- **Invoice health** — paid vs unpaid split
- **Customer lifecycle** — HubSpot stage synced live

Every metric is computed from live Coral SQL joins across Stripe and HubSpot — no stale cache, no manual sync.

---

### 2. Invoice Journey Graph — Context

<img width="2868" height="1298" alt="Invoice Journey Graph" src="https://github.com/user-attachments/assets/c115d3e5-b554-4fd1-b1fc-2788a32d19b2" />

> *Why is this customer behaving this way?*

Click any customer to open a full relationship timeline powered by Coral joins across CRM and invoice systems, enriched with email engagement events from Resend.

The timeline reconstructs the complete customer payment journey:

```
Deal Closed
     ↓
Contract Signed
     ↓
Invoice Sent
     ↓
Email Sent (Resend)
     ↓
Email Opened
     ↓
Link Clicked 3×
     ↓
Follow-up Sent
     ↓
Payment Received  /  Ghosted
```

Every interaction becomes a node:

- Invoice creation, send, open, click, payment
- Email engagement events (sent, delivered, opened, clicked, bounced) — sourced from Resend webhooks stored in Supabase
- Payment behavior and history
- Follow-ups and internal mentions
- Risk spikes with timestamps

Each node includes AI-generated insights, quick actions, and contextual recommendations:

> *"Customer repeatedly opens invoices late at night."*
> *"Historically responds better to direct calls."*
> *"Engagement dropped after invoice amount increased."*

Two views available: **Flow** (ReactFlow graph) and **Timeline** (chronological list), both filterable by source — Stripe, Resend, HubSpot.

---

### 3. Ask AI — Reasoning

<img width="2868" height="1298" alt="AI Chat assistant" src="https://github.com/user-attachments/assets/3b321466-9939-415d-b9d7-f33f36075e2a" />

> *What should I do?*

The AI Collections Assistant answers operational questions in natural language. Ask it anything:

```
"Who should I call today?"
"Which customers are most likely to churn?"
"Show highest revenue at risk."
"Which invoices were reopened multiple times?"
"Who usually pays late but eventually converts?"
```

Internally, the agent runs Coral SQL joins across Stripe and HubSpot in real time, then combines that with email engagement history from Supabase to respond with prioritized recommendations:

> *"Call Acme Corp first. $12,000 overdue, 18 days late. Last email opened but not replied 6 days ago. Historically responds best to direct calls."*

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

<img width="2868" height="1298" alt="Activity view" src="https://github.com/user-attachments/assets/a3a64e4c-3155-416d-ae99-1a2aa2268d50" />

The Activity view lists all clients as cards with real-time risk signals, outstanding balances, and lifecycle stage. Filter by risk level, search by name, sort by amount due.

Click any client to open their full profile:

- Complete invoice history with status, amounts, due dates
- Payment rate and collection metrics
- Email communication history (Resend events from Supabase)
- Risk level: `healthy` / `medium` / `high` / `critical`

**AI Email Generator** — generate and send follow-up emails without leaving the app:

| Email Type | Description |
|------------|-------------|
| Payment reminder | Warm, short — flags pending balance |
| Overdue follow-up | Firm but personal — escalates urgency |
| Relationship check-in | Friendly tone — asks how things are going |
| Custom | Any goal you define |

Emails are generated by LLM with account context (balance, history, engagement) but **never expose raw amounts or invoice numbers** — they read like a real person wrote them. Sent via Resend directly from the UI.

**Email event tracking** — Resend fires webhooks back to `/webhooks/resend` on every delivery event. The backend maps and stores each event into a Supabase `email_events` table in real time:

| Resend Event | Stored As |
|---|---|
| `email.sent` | `sent` |
| `email.delivered` | `delivered` |
| `email.opened` | `opened` |
| `email.clicked` | `clicked` |
| `email.bounced` | `bounced` |
| `email.complained` | `complained` |

These events flow back into the customer journey timeline, so every open and click appears as a node alongside invoice and payment history.

---

## How Coral Powers This

Zindle's data layer for CRM and invoicing runs through [Coral](https://withcoral.com/docs) — a single SQL interface that turns APIs into queryable tables. Instead of writing separate API clients for Stripe and HubSpot, we write one SQL query and Coral handles the rest. Email delivery and tracking are handled separately by Resend, with events persisted in Supabase.

### The problem Coral solves here

Without Coral, answering "who should I call today?" requires:

1. Fetch all contacts from HubSpot API (paginated)
2. Fetch all invoices from Stripe API (paginated, filtered)
3. Join everything in application code
4. Sort, filter, and rank the result

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

> **Note:** Email delivery and tracking are handled by **Resend**, not Coral. Resend fires webhook events (`sent`, `delivered`, `opened`, `clicked`, `bounced`, `complained`) to `/webhooks/resend`, which are persisted in a **Supabase** `email_events` table and queried directly from there.

### HubSpot — custom source spec

HubSpot is not bundled in Coral by default. We connect it using a **[custom source spec](https://withcoral.com/docs/guides/write-a-custom-source)** — a YAML file that tells Coral how to authenticate against the HubSpot API and which tables to expose.


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

Coral exposes its query engine [over MCP](https://withcoral.com/docs/guides/use-coral-over-mcp) (Model Context Protocol) via stdio. The backend runs `coral mcp-stdio` as a child process and communicates through JSON-RPC:

```
Backend (Node.js)
      │
      │  JSON-RPC over stdin/stdout
      ▼
coral mcp-stdio  (local process)
      │
      ├── stripe.invoices    → Stripe API
      └── hubspot.contacts   → HubSpot API  (custom source spec)
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

Every meaningful Coral query joins Stripe and HubSpot. Email engagement data is fetched separately from Supabase and merged in application code:

```sql
-- 2-source join: Stripe + HubSpot
-- "Which overdue customers haven't been emailed recently?"
-- (email recency is enriched from Supabase email_events in app code)
SELECT
  h.firstname, h.lastname, h.email, h.company,
  SUM(CASE WHEN s.status NOT IN ('paid','void') THEN s.amount_due ELSE 0 END) AS balance_due
FROM hubspot.contacts h
LEFT JOIN stripe.invoices s ON LOWER(s.customer_email) = LOWER(h.email)
WHERE h.email IS NOT NULL
GROUP BY h.firstname, h.lastname, h.email, h.company
HAVING COUNT(DISTINCT s.id) > 0
ORDER BY balance_due DESC
```

### Why this matters for AI

The AI assistant receives **structured query results**, not raw API responses. This means:

- The LLM never sees pagination tokens, rate limit headers, or API error shapes
- Every number in the AI's response came from a SQL aggregate — not hallucinated
- The LLM prompt contains clean tabular data: `name | balance | last_contact | days_overdue`
- Email engagement context (last opened, click count) is sourced from Supabase and injected alongside the Coral results before being sent to the LLM

```
User: "Who should I call today?"
         ↓
Intent classifier → call_priority handler
         ↓
Coral SQL (Stripe JOIN HubSpot) → ranked rows
         ↓
Supabase query → email engagement per customer
         ↓
LLM (Groq) → narrates the combined data, adds call openers
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
│  /webhooks/resend      → email events   │
└────────┬─────────────────────┬──────────┘
         │ JSON-RPC / stdio    │ Supabase client
┌────────▼──────────┐ ┌────────▼──────────┐
│  coral mcp-stdio  │ │     Supabase       │
│   (local)         │ │  email_events      │
│                   │ │  (Resend webhooks) │
│  stripe.invoices  │ └────────▲──────────┘
│  hubspot.contacts │          │ webhooks
│  hubspot.email_   │        Resend
│  events           │          │
└───┬───────┘       │     (email delivery
    │               │      & tracking)
Stripe   HubSpot
 API      API
```

**AI layer:**

- **Groq (LLaMA 3.3 70B)** — SQL generation, insight synthesis, email drafting
- **Intent classifier** — regex-based routing before any LLM call
- **Data-first approach** — SQL runs first (Coral for Stripe/HubSpot, Supabase for email events), results passed to LLM; model never invents numbers

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Redux Toolkit, ReactFlow, TypeScript |
| Backend | Express, TypeScript, Node.js |
| Database joins | [Coral MCP](https://withcoral.com/docs/guides/use-coral-over-mcp) (DuckDB SQL) — Stripe & HubSpot |
| Email delivery | Resend |
| Email event storage | Supabase (`email_events` table, populated via Resend webhooks) |
| AI | Groq API — LLaMA 3.3 70B Versatile |
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
│   │   │   └── webhooks.routes.ts    # Resend webhook → Supabase
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
- [Coral CLI](https://withcoral.com/docs) installed and configured
- Stripe Private App token, HubSpot Private App token
- Resend account + verified sender domain
- Supabase project

### 1. Install Coral

```bash
brew install withcoral/tap/coral
```

See the [full installation guide](https://withcoral.com/docs).

### 2. Connect data sources

Stripe is a bundled Coral source. HubSpot connects via a [custom source spec](https://withcoral.com/docs/guides/write-a-custom-source) included in this repo.

```bash
# Bundled source
coral source add stripe

# HubSpot — custom source spec (requires a HubSpot Private App token)
coral source add --file ./hubspot-source.yaml --interactive
```

Verify the sources are working:

```bash
coral source list
coral sql "SELECT email, lifecyclestage FROM hubspot.contacts LIMIT 5"
coral sql "SELECT customer_email, status, amount_due FROM stripe.invoices LIMIT 5"
```

### 3. Set up Supabase

Create an `email_events` table in your Supabase project to store Resend webhook events:

```sql
CREATE TABLE email_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  type text NOT NULL,
  created timestamptz NOT NULL,
  raw jsonb
);
```

Then configure your Resend webhook to point at `https://your-backend/webhooks/resend`.

### 4. Backend

```bash
cd backend
cp .env.example .env
# Fill in all values from the Environment Variables section below
npm install
npm run dev
```

### 5. Frontend

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

# AI
GROQ_API_KEY=                  # Groq API key (LLaMA 3.3 70B)

# Email
RESEND_API_KEY=                # Resend API key for email delivery
FROM_EMAIL=                    # Sender email (must be verified in Resend)
FROM_NAME=                     # Sender display name

# Data sources
HubSpotAccessToken=            # HubSpot Private App token (for custom Coral source)

# Supabase — email event storage
SUPABASE_URL=                  # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=     # Supabase service role key (server-side only)
DATABASE_URL=                  # Postgres connection string (direct DB access)
SUPABASE_HOST=
SUPABASE_PORT=
SUPABASE_DB=
SUPABASE_USER=
SubaBase_DB_PASSWORD=

# Server
CORAL_PATH=                    # Path to coral binary (auto-detected if in PATH)
PORT=5000
```

---

## Key Design Decisions

**Coral MCP as a persistent singleton** — The backend spawns a single `coral mcp-stdio` process on startup and reuses it for all queries. This eliminates the cold-start cost of spawning a new process per request. See [Use Coral over MCP](https://withcoral.com/docs/guides/use-coral-over-mcp).

**Resend for email, not Coral** — Email delivery and tracking are handled entirely by Resend. Resend webhooks fire events (`sent`, `delivered`, `opened`, `clicked`, `bounced`, `complained`) to `/webhooks/resend`, which are stored in Supabase and queried from there. Coral is used only for Stripe and HubSpot data.

**Data-first, LLM-second** — Every AI response starts with a SQL query (Coral) or a Supabase lookup (email events). The LLM only receives structured data and is asked to synthesize, rank, or narrate it. It never generates numbers or customer details from memory.

**Intent classification before LLM** — A regex-based classifier routes queries to typed handlers before any LLM call. This makes common queries fast, deterministic, and cheap.

**Risk scoring in TypeScript, not SQL** — Financial calculations (payment rate, overdue days, risk tier) happen in application code after data is fetched, not inside SQL. This keeps queries simple and math auditable.

**HubSpot via custom source spec** — Since HubSpot isn't a bundled Coral source, we define it using a [custom source spec](https://withcoral.com/docs/guides/write-a-custom-source) in YAML. This keeps credentials local and makes `hubspot.contacts` a first-class SQL table.

**Supabase for email event storage** — Resend webhook events (`sent`, `delivered`, `opened`, `clicked`, `bounced`, `complained`) are stored in a Supabase `email_events` table via `/webhooks/resend`. This keeps email engagement history queryable and decoupled from the Coral data layer, which is read-only and covers only Stripe and HubSpot.

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
