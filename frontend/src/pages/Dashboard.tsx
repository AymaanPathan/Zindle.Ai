// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import { loadClients } from "../store/slices/clientSlice";
import { openJourney } from "../store/slices/uiSlice";
import type { Client } from "../store/slices/clientSlice";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap');

  .d {
    --w:    #ffffff;
    --g50:  #fafafa;
    --g100: #f5f5f7;
    --g200: #e8e8ed;
    --g300: #d1d1d6;
    --g400: #9ca3af;
    --g500: #6b7280;
    --g600: #4b5563;
    --g700: #374151;
    --g900: #111827;
    --serif: 'Instrument Serif', Georgia, serif;
    --sans:  'Geist', -apple-system, system-ui, sans-serif;
    font-family: var(--sans);
    background: var(--w);
    color: var(--g900);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  /* ── top bar ── */
  .d-bar {
    position: sticky; top: 0; z-index: 50;
    border-bottom: 1px solid var(--g200);
    background: rgba(255,255,255,0.94);
    backdrop-filter: blur(20px);
  }
  .d-bar-inner {
    padding: 0 32px; height: 52px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .d-logo {
    font-size: 14.5px; font-weight: 600; color: var(--g900); letter-spacing: -0.03em;
  }
  .d-bar-right { display: flex; align-items: center; gap: 8px; }

  .d-search {
    display: flex; align-items: center; gap: 7px;
    border: 1px solid var(--g200); border-radius: 9px;
    padding: 6px 12px; background: var(--w); transition: all 0.15s;
    width: 220px;
  }
  .d-search:focus-within {
    border-color: var(--g400);
    box-shadow: 0 0 0 3px rgba(0,0,0,0.04);
  }
  .d-search input {
    border: none; background: transparent; outline: none;
    font-size: 13px; color: var(--g900); flex: 1;
    font-family: var(--sans); letter-spacing: -0.01em;
  }
  .d-search input::placeholder { color: var(--g400); }

  .d-btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 6px 12px; border-radius: 7px;
    border: 1px solid var(--g200); background: var(--w);
    font-size: 12.5px; font-weight: 400; color: var(--g600);
    cursor: pointer; font-family: var(--sans); letter-spacing: -0.01em;
    transition: all 0.12s;
  }
  .d-btn:hover { background: var(--g50); color: var(--g900); border-color: var(--g300); }

  /* ── page body ── */
  .d-body { padding: 36px 32px 64px; }

  /* ── heading ── */
  .d-eyebrow {
    font-size: 10.5px; font-weight: 600; letter-spacing: 0.1em;
    color: var(--g400); text-transform: uppercase; margin-bottom: 8px;
  }
  .d-title {
    font-family: var(--serif);
    font-size: clamp(28px, 3vw, 40px);
    font-weight: 400; line-height: 1.1;
    letter-spacing: -0.025em; color: var(--g900);
    margin: 0 0 6px;
  }
  .d-title em { font-style: italic; }
  .d-sub {
    font-size: 13.5px; color: var(--g500); letter-spacing: -0.01em;
    margin: 0 0 28px;
  }

  /* ── stat grid ── */
  .d-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 24px;
  }
  .d-stat {
    border: 1px solid var(--g200); border-radius: 14px;
    padding: 20px 22px; background: var(--w);
    transition: border-color 0.15s, box-shadow 0.15s; cursor: default;
  }
  .d-stat:hover {
    border-color: var(--g300);
    box-shadow: 0 2px 16px rgba(0,0,0,0.05);
  }
  .d-stat-row {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
  }
  .d-stat-label {
    font-size: 10px; font-weight: 600; color: var(--g400);
    text-transform: uppercase; letter-spacing: 0.1em;
  }
  .d-stat-icon {
    width: 26px; height: 26px; border-radius: 7px;
    border: 1px solid var(--g200); background: var(--w);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: var(--g500);
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .d-stat-val {
    font-family: var(--serif);
    font-size: 32px; font-weight: 400; color: var(--g900);
    margin: 0; line-height: 1; letter-spacing: -0.02em;
  }
  .d-stat-hint { font-size: 11px; color: var(--g400); margin: 6px 0 0; }

  /* ── table card ── */
  .d-card {
    border: 1px solid var(--g200); border-radius: 16px;
    overflow: hidden; background: var(--w);
    box-shadow: 0 1px 4px rgba(0,0,0,0.03), 0 4px 20px rgba(0,0,0,0.03);
  }
  .d-card-top {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 22px; border-bottom: 1px solid var(--g200);
    background: var(--w);
  }
  .d-card-top-l { display: flex; align-items: center; gap: 8px; }
  .d-card-title { font-size: 13px; font-weight: 600; color: var(--g900); letter-spacing: -0.02em; }
  .d-count {
    font-size: 11px; font-weight: 500; color: var(--g500);
    background: var(--w); border: 1px solid var(--g200);
    padding: 1px 9px; border-radius: 100px;
  }
  .d-card-hint { font-size: 11.5px; color: var(--g400); letter-spacing: -0.01em; }

  /* ── table ── */
  .d-tbl { width: 100%; border-collapse: collapse; }

  .d-tbl thead tr {
    background: var(--w);
    border-bottom: 1px solid var(--g200);
  }
  .d-tbl thead th {
    padding: 10px 20px; text-align: left;
    font-size: 10px; font-weight: 600; color: var(--g400);
    text-transform: uppercase; letter-spacing: 0.1em;
    white-space: nowrap;
  }
  .d-tbl thead th:last-child { text-align: right; }

  .d-tbl tbody tr {
    border-bottom: 1px solid var(--g200);
    cursor: pointer; transition: background 0.08s;
  }
  .d-tbl tbody tr:last-child { border-bottom: none; }
  .d-tbl tbody tr:hover { background: var(--g50); }

  .d-tbl tbody td {
    padding: 14px 20px;
    font-size: 13px;
    vertical-align: middle;
  }

  /* ── avatar ── */
  .d-av {
    width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
    background: var(--w); border: 1px solid var(--g200);
    display: flex; align-items: center; justify-content: center;
    font-size: 10.5px; font-weight: 600; color: var(--g700);
    letter-spacing: 0.02em; font-family: var(--sans);
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }

  /* ── cell styles ── */
  .d-cname  { font-size: 13px; font-weight: 500; color: var(--g900); margin: 0; letter-spacing: -0.015em; }
  .d-cemail { font-size: 11px; color: var(--g400); margin: 2px 0 0; letter-spacing: -0.01em; }
  .d-clc    { font-size: 12.5px; color: var(--g500); text-transform: capitalize; letter-spacing: -0.01em; }
  .d-cinv   { font-size: 13px; color: var(--g600); font-variant-numeric: tabular-nums; }
  .d-camt   { font-size: 13px; font-weight: 600; color: var(--g900); font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }

  /* ── risk ── */
  .d-risk { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; letter-spacing: -0.01em; }
  .d-rdot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

  /* ── open btn ── */
  .d-open {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 12px; border-radius: 7px;
    border: 1px solid var(--g200); background: var(--w);
    font-size: 12px; font-weight: 500; color: var(--g600);
    cursor: pointer; font-family: var(--sans); letter-spacing: -0.01em;
    transition: all 0.12s; opacity: 0; white-space: nowrap;
  }
  .d-tbl tbody tr:hover .d-open {
    opacity: 1;
    border-color: var(--g900); background: var(--g900); color: var(--w);
  }

  /* ── states ── */
  .d-empty {
    padding: 60px 20px; text-align: center;
    font-size: 13px; color: var(--g400); letter-spacing: -0.01em;
  }
  @keyframes dspin { to { transform: rotate(360deg); } }
  .d-spin { animation: dspin 0.8s linear infinite; display: inline-block; vertical-align: middle; margin-right: 6px; }
`;

function inits(n: string, e: string) {
  return (n || e || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
}
function fmt(c: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: 0 }).format(c / 100);
}
function fmtK(c: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(c / 100);
}

function Risk({ client }: { client: Client }) {
  if (client.isFullyPaid || client.riskLevel === "healthy") {
    return (
      <span className="d-risk" style={{ color: "#16a34a" }}>
        <span className="d-rdot" style={{ background: "#22c55e" }} />
        On track
      </span>
    );
  }
  if (client.riskLevel === "critical" || client.riskLevel === "high") {
    return (
      <span className="d-risk" style={{ color: "var(--g900)" }}>
        <span className="d-rdot" style={{ background: "var(--g900)" }} />
        High risk
      </span>
    );
  }
  if (client.riskLevel === "medium") {
    return (
      <span className="d-risk" style={{ color: "var(--g500)" }}>
        <span className="d-rdot" style={{ background: "var(--g400)" }} />
        Review
      </span>
    );
  }
  return (
    <span className="d-risk" style={{ color: "var(--g400)" }}>
      <span className="d-rdot" style={{ background: "var(--g300)" }} />
      Pending
    </span>
  );
}

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { list: clients, loading, error } = useSelector((s: RootState) => s.clients);
  const [search, setSearch] = useState("");

  useEffect(() => { dispatch(loadClients()); }, [dispatch]);

  const totalDue  = clients.reduce((s, c) => s + c.totalDue, 0);
  const highRisk  = clients.filter(c => c.riskLevel === "high" || c.riskLevel === "critical").length;
  const paid      = clients.reduce((s, c) => s + c.paidInvoiceCount, 0);

  const filtered = clients.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="d">
      <style>{css}</style>

      <div className="d-body">

        {/* Heading */}
        <div className="d-eyebrow">Collections</div>
        <h1 className="d-title">
          {clients.length} accounts. <em>Every payment tracked.</em>
        </h1>
        <p className="d-sub">Real-time risk signals and journey intelligence across your portfolio.</p>

        {/* Stats */}
        <div className="d-stats">
          {[
            { label: "Outstanding",   val: fmtK(totalDue, "INR"),        hint: `${clients.length} clients`,   icon: "₹" },
            { label: "High Risk",     val: String(highRisk),              hint: "need attention",              icon: "⚠" },
            { label: "Total Clients", val: String(clients.length),        hint: "tracked accounts",            icon: "◫" },
            { label: "Paid Invoices", val: String(paid),                  hint: "across all clients",          icon: "✓" },
          ].map(({ label, val, hint, icon }) => (
            <div className="d-stat" key={label}>
              <div className="d-stat-row">
                <span className="d-stat-label">{label}</span>
                <div className="d-stat-icon">{icon}</div>
              </div>
              <p className="d-stat-val">{val}</p>
              <p className="d-stat-hint">{hint}</p>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="d-card">
          <div className="d-card-top">
            <div className="d-card-top-l">
              <span className="d-card-title">Client Accounts</span>
              <span className="d-count">{filtered.length}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* inline search in header */}
              <div className="d-search" style={{ width: 200 }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="6" r="4.5" stroke="#9ca3af" strokeWidth="1.3"/>
                  <path d="M9.5 9.5L12 12" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <input
                  placeholder="Search clients…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <span className="d-card-hint">Click any row to open journey →</span>
            </div>
          </div>

          {loading && (
            <div className="d-empty">
              <svg className="d-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="#e5e7eb" strokeWidth="1.5"/>
                <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Loading clients…
            </div>
          )}

          {error && (
            <div style={{ margin: "12px 20px", padding: "10px 14px", borderRadius: 8, background: "#fff8f8", border: "1px solid #fee2e2", fontSize: 13, color: "#b91c1c" }}>
              {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="d-empty">
              {search ? `No clients matching "${search}"` : "No clients yet"}
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <table className="d-tbl">
              <thead>
                <tr>
                  <th style={{ width: "32%", paddingLeft: 20 }}>Client</th>
                  <th style={{ width: "12%" }}>Lifecycle</th>
                  <th style={{ width: "10%" }}>Invoices</th>
                  <th style={{ width: "18%" }}>Amount due</th>
                  <th style={{ width: "14%" }}>Risk</th>
                  <th style={{ width: "14%", textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client: Client) => (
                  <tr key={client.id} onClick={() => dispatch(openJourney(client.email))}>

                    {/* Client */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="d-av">{inits(client.name, client.email)}</div>
                        <div>
                          <p className="d-cname">{client.name || "—"}</p>
                          <p className="d-cemail">{client.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Lifecycle */}
                    <td><span className="d-clc">{client.lifecycle ?? "—"}</span></td>

                    {/* Invoices */}
                    <td><span className="d-cinv">{client.invoiceCount}</span></td>

                    {/* Amount — fixed: now properly wrapped in <td> */}
                    <td><span className="d-camt">{fmt(client.totalDue, (client as any).currency ?? "INR")}</span></td>

                    {/* Risk */}
                    <td><Risk client={client} /></td>

                    {/* Action */}
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="d-open"
                        onClick={(e) => { e.stopPropagation(); dispatch(openJourney(client.email)); }}
                      >
                        Open journey
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                          <path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}