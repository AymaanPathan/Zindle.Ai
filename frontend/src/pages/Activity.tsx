import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import { loadClients } from "../store/slices/clientSlice";
import { loadRiskAll, loadRiskSummary } from "../store/slices/riskSlice";
import { openCustomer } from "../store/slices/uiSlice";
import type { Client } from "../store/slices/clientSlice";
import type { TopRiskCustomer } from "../types";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap');

  .ac {
    --w:    #ffffff;
    --g50:  #f9fafb;
    --g100: #f3f4f6;
    --g200: #e5e7eb;
    --g300: #d1d5db;
    --g400: #9ca3af;
    --g500: #6b7280;
    --g600: #4b5563;
    --g700: #374151;
    --g900: #111827;
    --serif: 'Instrument Serif', Georgia, serif;
    --sans:  'Geist', -apple-system, system-ui, sans-serif;
    font-family: var(--sans);
    -webkit-font-smoothing: antialiased;
    background: #fafafa;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
  }

  .ac-scroll::-webkit-scrollbar { width: 3px; }
  .ac-scroll::-webkit-scrollbar-track { background: transparent; }
  .ac-scroll::-webkit-scrollbar-thumb { background: var(--g200); border-radius: 99px; }

  .ac-search-wrap {
    display: flex; align-items: center; gap: 7px;
    background: #fff; border: 1px solid var(--g200);
    border-radius: 8px; padding: 0 12px; height: 34px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .ac-search-wrap:focus-within {
    border-color: var(--g400);
    box-shadow: 0 0 0 3px rgba(0,0,0,0.04);
  }
  .ac-search-input {
    border: none; background: transparent; outline: none;
    font-size: 13px; color: var(--g900); width: 180px;
    font-family: var(--sans); letter-spacing: -0.01em;
  }
  .ac-search-input::placeholder { color: var(--g400); }

  .ac-filter-pill {
    display: inline-flex; align-items: center; gap: 5px;
    height: 30px; padding: 0 11px; border-radius: 6px;
    border: 1px solid var(--g200); background: var(--w);
    font-size: 12.5px; font-weight: 400; color: var(--g500);
    cursor: pointer; font-family: var(--sans);
    letter-spacing: -0.01em; transition: all 0.1s;
    white-space: nowrap;
  }
  .ac-filter-pill:hover:not(.active) {
    background: var(--g50); border-color: var(--g300); color: var(--g900);
  }
  .ac-filter-pill.active {
    background: var(--g900); border-color: var(--g900); color: #fff; font-weight: 500;
  }
  .ac-filter-pill .pill-count {
    font-size: 10.5px; font-weight: 500;
    padding: 1px 5px; border-radius: 4px;
  }
  .ac-filter-pill.active .pill-count {
    background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.8);
  }
  .ac-filter-pill:not(.active) .pill-count {
    background: var(--g100); color: var(--g400); border: 1px solid var(--g200);
  }

  .ac-card {
    background: var(--w);
    border: 1px solid var(--g200);
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 14px;
    transition: border-color 0.12s, box-shadow 0.12s, transform 0.12s;
  }
  .ac-card:hover {
    border-color: var(--g300);
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    transform: translateY(-1px);
  }

  @keyframes ac-shimmer {
    0%   { background-position: -500px 0; }
    100% { background-position:  500px 0; }
  }
  .ac-shimmer {
    background: linear-gradient(90deg, var(--g100) 0%, #f8f9fa 50%, var(--g100) 100%) !important;
    background-size: 500px 100% !important;
    animation: ac-shimmer 1.5s ease infinite !important;
    border-radius: 5px;
  }

  @keyframes ac-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ac-in { animation: ac-in 0.2s ease both; }

  .ac-select {
    height: 34px; padding: 0 10px; border-radius: 7px;
    border: 1px solid var(--g200); background: var(--w);
    font-size: 12.5px; color: var(--g600); cursor: pointer;
    font-family: var(--sans); outline: none; letter-spacing: -0.01em;
    transition: border-color 0.1s;
  }
  .ac-select:hover { border-color: var(--g300); }

  .ac-ghost-btn {
    display: inline-flex; align-items: center; gap: 5px;
    height: 34px; padding: 0 12px; border-radius: 7px;
    border: 1px solid var(--g200); background: var(--w);
    font-size: 12.5px; font-weight: 400; color: var(--g600);
    cursor: pointer; font-family: var(--sans); letter-spacing: -0.01em;
    transition: all 0.1s;
  }
  .ac-ghost-btn:hover { background: var(--g50); color: var(--g900); border-color: var(--g300); }

  /* AI Risk Panel — light mode */
  .ai-panel {
    background: #fff;
    border-radius: 12px;
    border: 1px solid var(--g200);
    overflow: hidden;
    margin-bottom: 20px;
  }

  .ai-panel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid var(--g100);
    background: var(--g50);
  }

  .ai-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 6px;
    padding: 3px 9px;
    font-size: 10.5px; font-weight: 600;
    color: #1d4ed8;
    letter-spacing: 0.04em; text-transform: uppercase;
    font-family: var(--sans);
  }

  .ai-toggle {
    display: inline-flex; align-items: center; gap: 7px;
    height: 30px; padding: 0 12px; border-radius: 6px;
    border: 1px solid var(--g200);
    background: #fff;
    font-size: 12px; font-weight: 500; color: var(--g600);
    cursor: pointer; font-family: var(--sans);
    transition: all 0.12s; letter-spacing: -0.01em;
  }
  .ai-toggle:hover { background: var(--g50); border-color: var(--g300); color: var(--g900); }
  .ai-toggle.active {
    background: #eff6ff;
    border-color: #bfdbfe;
    color: #1d4ed8;
  }

  .ai-stat {
    padding: 18px 20px;
    border-right: 1px solid var(--g100);
  }
  .ai-stat:last-child { border-right: none; }

  .ai-stat-label {
    font-size: 10px; font-weight: 600; color: var(--g400);
    text-transform: uppercase; letter-spacing: 0.08em;
    margin-bottom: 8px; font-family: var(--sans);
  }

  .ai-stat-value {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 26px; font-weight: 400; line-height: 1;
    letter-spacing: -0.02em; color: var(--g900);
  }

  .ai-stat-hint {
    font-size: 11px; color: var(--g400);
    font-family: var(--sans); letter-spacing: -0.01em;
    margin-top: 4px;
  }

  .risk-bar-track {
    height: 2px; border-radius: 99px;
    background: var(--g100);
    overflow: hidden; margin-top: 10px;
  }
  .risk-bar-fill {
    height: 100%; border-radius: 99px;
    transition: width 0.6s cubic-bezier(0.16,1,0.3,1);
  }

  .ai-risk-row {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 18px;
    border-bottom: 1px solid var(--g100);
    transition: background 0.08s; cursor: pointer;
  }
  .ai-risk-row:last-child { border-bottom: none; }
  .ai-risk-row:hover { background: var(--g50); }

  .ai-risk-rank {
    width: 18px; text-align: right;
    font-size: 10px; font-weight: 600; color: var(--g300);
    font-family: var(--sans); flex-shrink: 0; font-variant-numeric: tabular-nums;
  }

  .ai-risk-score-bar {
    flex: 1; height: 2px; border-radius: 99px;
    background: var(--g100); overflow: hidden;
  }

  @keyframes ai-shimmer-light {
    0%   { background-position: -300px 0; }
    100% { background-position:  300px 0; }
  }
  .ai-shimmer {
    background: linear-gradient(90deg, var(--g100) 0%, var(--g50) 50%, var(--g100) 100%) !important;
    background-size: 300px 100% !important;
    animation: ai-shimmer-light 1.5s ease infinite !important;
    border-radius: 5px;
  }

  .ai-chip {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 10px; font-weight: 600;
    padding: 2px 6px; border-radius: 4px;
    letter-spacing: 0; font-family: var(--sans);
    flex-shrink: 0;
  }

  @keyframes ai-pulse-light {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }
  .ai-pulse { animation: ai-pulse-light 2s ease infinite; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(cents: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: 0 }).format(cents / 100);
}
function fmtK(cents: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(cents / 100);
}
function inits(name: string, email: string) {
  const n = name?.trim();
  if (n) {
    const p = n.split(" ");
    return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : n.slice(0, 2).toUpperCase();
  }
  return (email ?? "?").slice(0, 2).toUpperCase();
}
function getRisk(client: Client) {
  if (client.isFullyPaid || client.riskLevel === "healthy") return { label: "Settled", dot: "#22c55e", color: "#15803d", bg: "#f0fdf4", border: "#d1fae5" };
  if (client.riskLevel === "critical" || client.riskLevel === "high") return { label: "High risk", dot: "#ef4444", color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" };
  if (client.riskLevel === "medium") return { label: "Review", dot: "#f59e0b", color: "#92400e", bg: "#fffbeb", border: "#fde68a" };
  return { label: "Pending", dot: "#3b82f6", color: "#1e40af", bg: "#eff6ff", border: "#bfdbfe" };
}
function getRiskColor(level: string) {
  if (level === "critical") return "#ef4444";
  if (level === "high" || level === "high_risk") return "#f97316";
  if (level === "medium" || level === "watch") return "#f59e0b";
  return "#22c55e";
}
function getRiskScoreColor(score: number) {
  if (score >= 80) return "#ef4444";
  if (score >= 60) return "#f97316";
  if (score >= 40) return "#f59e0b";
  return "#22c55e";
}

// ─── Types & Filters ──────────────────────────────────────────────────────────
type FilterKey = "all" | "high_risk" | "review" | "pending" | "settled";
const FILTERS: { id: FilterKey; label: string; dot?: string }[] = [
  { id: "all",       label: "All" },
  { id: "high_risk", label: "High risk", dot: "#ef4444" },
  { id: "review",    label: "Review",    dot: "#f59e0b" },
  { id: "pending",   label: "Pending",   dot: "#3b82f6" },
  { id: "settled",   label: "Settled",   dot: "#22c55e" },
];
function matchesFilter(client: Client, filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "settled")   return client.isFullyPaid;
  if (filter === "high_risk") return !client.isFullyPaid && (client.riskLevel === "high" || client.riskLevel === "critical");
  if (filter === "review")    return !client.isFullyPaid && client.riskLevel === "medium";
  if (filter === "pending")   return !client.isFullyPaid && client.riskLevel === "healthy" && client.openInvoiceCount > 0;
  return true;
}

// ─── SVG icon atoms — no emoji, no toy icons ────────────────────────────────
function IconMoney() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="3" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M4 7h.5M9.5 7H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
function IconFlag() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M3 12V2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M3 2.5h7.5l-2 3 2 3H3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <circle cx="5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M1 11c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M10 6.5c1.1 0 2 .9 2 2v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M8 3.5a2 2 0 010 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7.5l3 3 6-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── AI Risk Panel — light mode ───────────────────────────────────────────────
interface AIRiskPanelProps {
  aiEnabled: boolean;
  onToggleAI: () => void;
  loading: boolean;
  loadingAll: boolean;
  summary: {
    totals: { all: number; critical: number; high_risk: number; watch: number; healthy: number } | null;
    totalAmountAtRisk: number;
    topRiskCustomers: TopRiskCustomer[];
  };
  onOpenCustomer: (email: string) => void;
}


// ─── Customer Card ────────────────────────────────────────────────────────────
function CustomerCard({ client, delay, aiEnabled, riskScore }: {
  client: Client; delay: number; aiEnabled: boolean; riskScore?: number;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const risk = getRisk(client);

  return (
    <div className="ac-card ac-in" style={{ animationDelay: `${delay}s` }} onClick={() => dispatch(openCustomer(client.email))}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: "#f3f4f6", border: "1px solid #e5e7eb",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10.5, fontWeight: 600, color: "#374151", letterSpacing: "0.02em",
          }}>
            {inits(client.name, client.email)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#111827", letterSpacing: "-0.015em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
              {client.name || "—"}
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
              {client.email}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 10.5, fontWeight: 500, padding: "2px 7px", borderRadius: 5,
            background: risk.bg, color: risk.color, border: `1px solid ${risk.border}`,
            letterSpacing: "-0.01em", whiteSpace: "nowrap" as const,
          }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: risk.dot }} />
            {risk.label}
          </span>
          {aiEnabled && riskScore != null && (
            <div className="ai-chip" style={{
              background: `${getRiskScoreColor(riskScore)}0f`,
              border: `1px solid ${getRiskScoreColor(riskScore)}20`,
              color: getRiskScoreColor(riskScore),
            }}>
              <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: "0.06em" }}>AI</span>
              {riskScore}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#f3f4f6", margin: "0 -16px" }} />

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>
            Outstanding
          </div>
          <div style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 20, fontWeight: 400, color: client.isFullyPaid ? "#16a34a" : "#111827", letterSpacing: "-0.02em", lineHeight: 1 }}>
            {fmt(client.totalDue, (client as any).currency ?? "INR")}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>
            Invoices
          </div>
          <div style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 20, fontWeight: 400, color: "#111827", letterSpacing: "-0.02em", lineHeight: 1 }}>
            {client.invoiceCount}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11.5, color: "#9ca3af", textTransform: "capitalize" as const, letterSpacing: "-0.01em" }}>
          {client.lifecycle ?? "—"}
        </span>
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ color: "#d1d5db", transition: "color 0.12s" }}>
          <path d="M3 11L11 3M11 3H6M11 3v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div className="ac-shimmer" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
          <div className="ac-shimmer" style={{ height: 11, width: "50%" }} />
          <div className="ac-shimmer" style={{ height: 9, width: "70%" }} />
        </div>
      </div>
      <div style={{ height: 1, background: "#f3f4f6" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="ac-shimmer" style={{ height: 28 }} />
        <div className="ac-shimmer" style={{ height: 28 }} />
      </div>
      <div className="ac-shimmer" style={{ height: 10, width: "35%" }} />
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, hint, icon }: { label: string; value: string; hint: string; icon: React.ReactNode }) {
  return (
    <div style={{
      border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 18px", background: "#fff",
      transition: "border-color 0.12s",
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "#d1d5db")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.08em", fontFamily: "var(--sans)" }}>
          {label}
        </span>
        <div style={{ width: 22, height: 22, borderRadius: 5, border: "1px solid #e5e7eb", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
          {icon}
        </div>
      </div>
      <div style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 28, fontWeight: 400, color: "#111827", lineHeight: 1, letterSpacing: "-0.02em" }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, fontFamily: "var(--sans)" }}>{hint}</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Activity() {
  const dispatch = useDispatch<AppDispatch>();
  const { list: clients, loading, error } = useSelector((s: RootState) => s.clients);
  const { all: riskAll, summary, loadingAll, loadingSummary } = useSelector((s: RootState) => s.risk);

  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState<FilterKey>("all");
  const [sort, setSort]           = useState<"due_desc" | "due_asc" | "name" | "invoices">("due_desc");
  const [aiEnabled, setAIEnabled] = useState(false);

  const riskScoreMap = React.useMemo(() => {
    const m: Record<string, number> = {};
    riskAll.forEach(r => { if (r.email && r.riskScore != null) m[r.email] = r.riskScore; });
    return m;
  }, [riskAll]);

  useEffect(() => {
    dispatch(loadClients());
    dispatch(loadRiskSummary());
    dispatch(loadRiskAll(false));
  }, [dispatch]);

  const handleToggleAI = useCallback(() => {
    const next = !aiEnabled;
    setAIEnabled(next);
    if (next) dispatch(loadRiskAll(true));
  }, [aiEnabled, dispatch]);

  const handleOpenCustomer = useCallback((email: string) => {
    dispatch(openCustomer(email));
  }, [dispatch]);

  const filtered = clients
    .filter(c => matchesFilter(c, filter))
    .filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "due_desc")  return b.totalDue - a.totalDue;
      if (sort === "due_asc")   return a.totalDue - b.totalDue;
      if (sort === "name")      return (a.name || a.email).localeCompare(b.name || b.email);
      if (sort === "invoices")  return b.invoiceCount - a.invoiceCount;
      return 0;
    });

  const totalDue      = clients.reduce((s, c) => s + c.totalDue, 0);
  const highRiskCount = clients.filter(c => c.riskLevel === "high" || c.riskLevel === "critical").length;
  const settledCount  = clients.reduce((s, c) => s + c.paidInvoiceCount, 0);

  return (
    <div className="ac">
      <style>{css}</style>

      {/* Page header */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e5e7eb",
        padding: "20px 28px 0", flexShrink: 0,
      }}>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{
            fontFamily: "'Instrument Serif',Georgia,serif",
            fontSize: 26, fontWeight: 400, color: "#111827",
            letterSpacing: "-0.025em", margin: "0 0 4px", lineHeight: 1.2,
          }}>
            Clients
          </h1>
          <p style={{ fontSize: 13, color: "#9ca3af", margin: 0, fontFamily: "var(--sans)", letterSpacing: "-0.01em" }}>
            {clients.length > 0 ? `${clients.length} accounts · every signal tracked` : "Loading accounts…"}
          </p>
        </div>
      </div>

      <div className="ac-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px 28px 64px" }}>


        {/* Stat cards */}
        {!loading && clients.length > 0 && (
          <div className="ac-in" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20, animationDelay: "0.05s" }}>
            <StatCard label="Outstanding"    value={fmtK(totalDue, "INR")}        hint={`${clients.length} clients`}    icon={<IconMoney />} />
            <StatCard label="High risk"      value={String(highRiskCount)}         hint="need attention"                 icon={<IconFlag />} />
            <StatCard label="Total clients"  value={String(clients.length)}        hint="tracked accounts"               icon={<IconUsers />} />
            <StatCard label="Paid invoices"  value={String(settledCount)}          hint="across all clients"             icon={<IconCheck />} />
          </div>
        )}

        {/* Toolbar */}
        {!loading && clients.length > 0 && (
          <div className="ac-in" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 8, marginBottom: 16, animationDelay: "0.08s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
              <div className="ac-search-wrap">
                <svg width="12" height="12" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, color: "#9ca3af" }}>
                  <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M9 9L11.5 11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <input className="ac-search-input" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
                {search && (
                  <button onClick={() => setSearch("")} style={{ border: "none", background: "none", cursor: "pointer", color: "#9ca3af", padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
                )}
              </div>
              {FILTERS.map(f => {
                const count = f.id === "all" ? clients.length : clients.filter(c => matchesFilter(c, f.id)).length;
                return (
                  <button key={f.id} className={`ac-filter-pill${filter === f.id ? " active" : ""}`} onClick={() => setFilter(f.id)}>
                    {f.dot && (
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: filter === f.id ? "rgba(255,255,255,0.6)" : f.dot, flexShrink: 0 }} />
                    )}
                    {f.label}
                    <span className="pill-count">{count}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <select className="ac-select" value={sort} onChange={e => setSort(e.target.value as typeof sort)}>
                <option value="due_desc">Highest due</option>
                <option value="due_asc">Lowest due</option>
                <option value="name">Name A–Z</option>
                <option value="invoices">Most invoices</option>
              </select>
              <button className="ac-ghost-btn" onClick={() => { dispatch(loadClients()); dispatch(loadRiskSummary()); dispatch(loadRiskAll(aiEnabled)); }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M1 6C1 3.24 3.24 1 6 1c1.5 0 2.85.6 3.84 1.57M11 6c0 2.76-2.24 5-5 5-1.5 0-2.85-.6-3.84-1.57" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M9.5 2l.84-.57.93.57" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* Card grid */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          {!loading && clients.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#111827", letterSpacing: "-0.02em" }}>Client accounts</span>
                <span style={{ fontSize: 10.5, fontWeight: 500, color: "#6b7280", background: "#f3f4f6", border: "1px solid #e5e7eb", padding: "1px 7px", borderRadius: 4 }}>
                  {filtered.length}
                </span>
                {aiEnabled && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#1d4ed8", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "1px 7px", borderRadius: 4, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
                    AI scored
                  </span>
                )}
              </div>
              <span style={{ fontSize: 11.5, color: "#9ca3af", letterSpacing: "-0.01em" }}>
                Click any card to open profile
              </span>
            </div>
          )}

          {loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10, padding: 16 }}>
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {error && !loading && (
            <div style={{ margin: "12px 16px", padding: "10px 14px", borderRadius: 7, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, color: "#b91c1c" }}>
              {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div style={{ padding: "60px 16px", textAlign: "center", fontSize: 13, color: "#9ca3af" }}>
              {search ? `No clients matching "${search}"` : "No clients yet"}
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10, padding: 16 }}>
              {filtered.map((client, i) => (
                <CustomerCard
                  key={client.id}
                  client={client}
                  delay={Math.min(i * 0.025, 0.25)}
                  aiEnabled={aiEnabled}
                  riskScore={riskScoreMap[client.email]}
                />
              ))}
            </div>
          )}
        </div>

        {!loading && filtered.length > 0 && filtered.length < clients.length && (
          <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", marginTop: 14 }}>
            Showing {filtered.length} of {clients.length} clients
          </p>
        )}
      </div>
    </div>
  );
}