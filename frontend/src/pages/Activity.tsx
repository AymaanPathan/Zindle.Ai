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
    --ai-bg: #0d1117;
    --ai-border: #1e293b;
    --ai-text: #e2e8f0;
    --ai-muted: #64748b;
    --ai-accent: #38bdf8;
    --ai-amber: #fbbf24;
    --ai-red: #f87171;
    --ai-green: #34d399;
    font-family: var(--sans);
    -webkit-font-smoothing: antialiased;
    background: var(--w);
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
  }

  .ac-scroll::-webkit-scrollbar { width: 3px; }
  .ac-scroll::-webkit-scrollbar-track { background: transparent; }
  .ac-scroll::-webkit-scrollbar-thumb { background: var(--g200); border-radius: 99px; }

  .ac-search-input {
    border: none; background: transparent; outline: none;
    font-size: 13px; color: var(--g900); width: 180px;
    font-family: var(--sans); letter-spacing: -0.01em;
  }
  .ac-search-input::placeholder { color: var(--g400); }

  .ac-filter {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 12px; border-radius: 99px;
    border: 1px solid var(--g200); background: var(--w);
    font-size: 12.5px; font-weight: 400; color: var(--g500);
    cursor: pointer; font-family: var(--sans);
    letter-spacing: -0.01em; transition: all 0.1s;
  }
  .ac-filter:hover:not(.active) {
    background: var(--g50); border-color: var(--g300); color: var(--g900);
  }
  .ac-filter.active {
    background: var(--g900); border-color: var(--g900); color: #fff; font-weight: 500;
  }

  .ac-card {
    background: var(--w);
    border: 1px solid var(--g200);
    border-radius: 14px;
    padding: 20px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 16px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .ac-card:hover {
    border-color: var(--g300);
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  }
  .ac-card:hover .ac-card-arrow {
    background: var(--g900); border-color: var(--g900);
  }
  .ac-card:hover .ac-card-arrow svg path { stroke: #fff; }

  @keyframes ac-shimmer {
    0%   { background-position: -500px 0; }
    100% { background-position:  500px 0; }
  }
  .ac-shimmer {
    background: linear-gradient(90deg, var(--g100) 0%, var(--g50) 50%, var(--g100) 100%) !important;
    background-size: 500px 100% !important;
    animation: ac-shimmer 1.5s ease infinite !important;
    border-radius: 6px;
  }

  @keyframes ac-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ac-in { animation: ac-in 0.25s ease both; }

  .ac-select {
    padding: 6px 10px; border-radius: 7px;
    border: 1px solid var(--g200); background: var(--w);
    font-size: 12.5px; color: var(--g600); cursor: pointer;
    font-family: var(--sans); outline: none; letter-spacing: -0.01em;
    transition: border-color 0.1s;
  }
  .ac-select:hover { border-color: var(--g300); }

  .ac-refresh {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 6px 12px; border-radius: 7px;
    border: 1px solid var(--g200); background: var(--w);
    font-size: 12.5px; font-weight: 400; color: var(--g600);
    cursor: pointer; font-family: var(--sans); letter-spacing: -0.01em;
    transition: all 0.12s;
  }
  .ac-refresh:hover { background: var(--g50); color: var(--g900); border-color: var(--g300); }

  /* ── AI Panel ── */
  .ai-panel {
    background: var(--ai-bg);
    border-radius: 16px;
    border: 1px solid var(--ai-border);
    overflow: hidden;
    margin-bottom: 24px;
  }

  .ai-panel-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--ai-border);
  }

  .ai-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(56,189,248,0.12);
    border: 1px solid rgba(56,189,248,0.25);
    border-radius: 99px;
    padding: 3px 10px;
    font-size: 11px; font-weight: 600;
    color: var(--ai-accent);
    letter-spacing: 0.06em; text-transform: uppercase;
    font-family: var(--sans);
  }

  .ai-toggle {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 7px 14px; border-radius: 8px;
    border: 1px solid var(--ai-border);
    background: rgba(255,255,255,0.04);
    font-size: 12px; font-weight: 500; color: var(--ai-text);
    cursor: pointer; font-family: var(--sans);
    transition: all 0.15s; letter-spacing: -0.01em;
  }
  .ai-toggle:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); }
  .ai-toggle.active {
    background: rgba(56,189,248,0.1);
    border-color: rgba(56,189,248,0.3);
    color: var(--ai-accent);
  }

  .ai-toggle-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--ai-muted); transition: background 0.15s;
    flex-shrink: 0;
  }
  .ai-toggle.active .ai-toggle-dot { background: var(--ai-accent); }

  @keyframes ai-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .ai-pulse { animation: ai-pulse 1.5s ease infinite; }

  .ai-stat {
    padding: 20px;
    border-right: 1px solid var(--ai-border);
    display: flex; flex-direction: column; gap: 6px;
  }
  .ai-stat:last-child { border-right: none; }

  .ai-stat-label {
    font-size: 10px; font-weight: 600; color: var(--ai-muted);
    text-transform: uppercase; letter-spacing: 0.1em;
    font-family: var(--sans);
  }

  .ai-stat-value {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 28px; font-weight: 400; line-height: 1;
    letter-spacing: -0.02em;
  }

  .ai-stat-hint {
    font-size: 11px; color: var(--ai-muted);
    font-family: var(--sans); letter-spacing: -0.01em;
  }

  /* risk bar */
  .risk-bar-track {
    height: 4px; border-radius: 99px;
    background: rgba(255,255,255,0.06);
    overflow: hidden; margin-top: 8px;
  }
  .risk-bar-fill {
    height: 100%; border-radius: 99px;
    transition: width 0.6s cubic-bezier(0.16,1,0.3,1);
  }

  /* top risk list */
  .ai-risk-row {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 20px;
    border-bottom: 1px solid var(--ai-border);
    transition: background 0.1s; cursor: pointer;
  }
  .ai-risk-row:last-child { border-bottom: none; }
  .ai-risk-row:hover { background: rgba(255,255,255,0.03); }

  .ai-risk-rank {
    width: 18px; text-align: center;
    font-size: 10px; font-weight: 600; color: var(--ai-muted);
    font-family: var(--sans); flex-shrink: 0;
  }

  .ai-risk-score-bar {
    flex: 1; height: 3px; border-radius: 99px;
    background: rgba(255,255,255,0.06); overflow: hidden;
  }

  @keyframes ai-shimmer {
    0%   { background-position: -300px 0; }
    100% { background-position:  300px 0; }
  }
  .ai-shimmer {
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%) !important;
    background-size: 300px 100% !important;
    animation: ai-shimmer 1.5s ease infinite !important;
    border-radius: 5px;
  }

  /* AI insight chip on cards */
  .ai-chip {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 10px; font-weight: 500;
    padding: 2px 7px; border-radius: 5px;
    letter-spacing: -0.01em; font-family: var(--sans);
    flex-shrink: 0;
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(cents: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}
function fmtK(cents: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency,
    notation: "compact", maximumFractionDigits: 1,
  }).format(cents / 100);
}

function inits(name: string, email: string) {
  const n = name?.trim();
  if (n) {
    const parts = n.split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : n.slice(0, 2).toUpperCase();
  }
  return (email ?? "?").slice(0, 2).toUpperCase();
}

function getRisk(client: Client) {
  if (client.isFullyPaid || client.riskLevel === "healthy") {
    return { label: "Settled", dot: "#22c55e", color: "#14532d", bg: "#f0fdf4", border: "#d1fae5" };
  }
  if (client.riskLevel === "critical" || client.riskLevel === "high") {
    return { label: "High risk", dot: "#ef4444", color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" };
  }
  if (client.riskLevel === "medium") {
    return { label: "Review", dot: "#f59e0b", color: "#92400e", bg: "#fffbeb", border: "#fde68a" };
  }
  return { label: "Pending", dot: "#3b82f6", color: "#1e40af", bg: "#eff6ff", border: "#bfdbfe" };
}

function getRiskColor(level: string): string {
  if (level === "critical") return "#f87171";
  if (level === "high" || level === "high_risk") return "#fb923c";
  if (level === "medium" || level === "watch") return "#fbbf24";
  return "#34d399";
}

function getRiskScoreColor(score: number): string {
  if (score >= 80) return "#f87171";
  if (score >= 60) return "#fb923c";
  if (score >= 40) return "#fbbf24";
  return "#34d399";
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

// ─── AI Risk Panel ────────────────────────────────────────────────────────────

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

function AIRiskPanel({ aiEnabled, onToggleAI, loading, loadingAll, summary, onOpenCustomer }: AIRiskPanelProps) {
  const { totals, totalAmountAtRisk, topRiskCustomers } = summary;
  const total = totals?.all ?? 0;

  const riskBreakdown = [
    { label: "Critical", count: totals?.critical ?? 0, color: "#f87171", pct: total > 0 ? ((totals?.critical ?? 0) / total) * 100 : 0 },
    { label: "High risk", count: totals?.high_risk ?? 0, color: "#fb923c", pct: total > 0 ? ((totals?.high_risk ?? 0) / total) * 100 : 0 },
    { label: "Watch",    count: totals?.watch ?? 0,    color: "#fbbf24", pct: total > 0 ? ((totals?.watch ?? 0) / total) * 100 : 0 },
    { label: "Healthy",  count: totals?.healthy ?? 0,  color: "#34d399", pct: total > 0 ? ((totals?.healthy ?? 0) / total) * 100 : 0 },
  ];

  return (
    <div className="ai-panel ac-in" style={{ animationDelay: "0.04s" }}>
      {/* Header */}
      <div className="ai-panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="ai-badge">
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#38bdf8", flexShrink: 0 }}
              className={loadingAll ? "ai-pulse" : ""} />
            AI Risk Intelligence
          </div>
          <span style={{ fontSize: 12, color: "#475569", fontFamily: "var(--sans)", letterSpacing: "-0.01em" }}>
            {loadingAll ? "Analysing accounts…" : `${topRiskCustomers.length} customers flagged`}
          </span>
        </div>
        <button className={`ai-toggle${aiEnabled ? " active" : ""}`} onClick={onToggleAI}>
          <span className="ai-toggle-dot" />
          {aiEnabled ? "AI Analysis on" : "Enable AI Analysis"}
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
        {/* Amount at risk */}
        <div className="ai-stat">
          <div className="ai-stat-label">Amount at risk</div>
          {loading ? (
            <div className="ai-shimmer" style={{ height: 28, width: "75%", marginTop: 4 }} />
          ) : (
            <div className="ai-stat-value" style={{ color: totalAmountAtRisk > 0 ? "#f87171" : "#34d399" }}>
             {fmtK(totalAmountAtRisk, "INR")}
            </div>
          )}
          <div className="ai-stat-hint">open exposure</div>
        </div>

        {/* Critical */}
        <div className="ai-stat">
          <div className="ai-stat-label">Critical accounts</div>
          {loading ? (
            <div className="ai-shimmer" style={{ height: 28, width: "40%", marginTop: 4 }} />
          ) : (
            <div className="ai-stat-value" style={{ color: (totals?.critical ?? 0) > 0 ? "#f87171" : "#64748b" }}>
              {totals?.critical ?? 0}
            </div>
          )}
          <div className="ai-stat-hint">immediate action</div>
          <div className="risk-bar-track">
            <div className="risk-bar-fill" style={{
              width: `${riskBreakdown[0].pct}%`,
              background: "#f87171",
            }} />
          </div>
        </div>

        {/* High risk */}
        <div className="ai-stat">
          <div className="ai-stat-label">High risk</div>
          {loading ? (
            <div className="ai-shimmer" style={{ height: 28, width: "40%", marginTop: 4 }} />
          ) : (
            <div className="ai-stat-value" style={{ color: (totals?.high_risk ?? 0) > 0 ? "#fb923c" : "#64748b" }}>
              {totals?.high_risk ?? 0}
            </div>
          )}
          <div className="ai-stat-hint">needs review</div>
          <div className="risk-bar-track">
            <div className="risk-bar-fill" style={{
              width: `${riskBreakdown[1].pct}%`,
              background: "#fb923c",
            }} />
          </div>
        </div>

        {/* Healthy */}
        <div className="ai-stat">
          <div className="ai-stat-label">Healthy</div>
          {loading ? (
            <div className="ai-shimmer" style={{ height: 28, width: "40%", marginTop: 4 }} />
          ) : (
            <div className="ai-stat-value" style={{ color: "#34d399" }}>
              {totals?.healthy ?? 0}
            </div>
          )}
          <div className="ai-stat-hint">in good standing</div>
          <div className="risk-bar-track">
            <div className="risk-bar-fill" style={{
              width: `${riskBreakdown[3].pct}%`,
              background: "#34d399",
            }} />
          </div>
        </div>
      </div>

      {/* Risk distribution bar */}
      {!loading && total > 0 && (
        <div style={{ padding: "12px 20px", borderTop: "1px solid #1e293b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--sans)" }}>
              Risk distribution
            </span>
          </div>
          <div style={{ display: "flex", gap: 2, height: 6, borderRadius: 99, overflow: "hidden" }}>
            {riskBreakdown.filter(r => r.count > 0).map(r => (
              <div key={r.label} title={`${r.label}: ${r.count}`} style={{
                flex: r.count, background: r.color, transition: "flex 0.5s ease",
              }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            {riskBreakdown.map(r => (
              <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "#475569", fontFamily: "var(--sans)", letterSpacing: "-0.01em" }}>
                  {r.label} <span style={{ color: r.color, fontWeight: 500 }}>{r.count}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top risk customers */}
      {topRiskCustomers.length > 0 && (
        <div style={{ borderTop: "1px solid #1e293b" }}>
          <div style={{ padding: "12px 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--sans)" }}>
              Top risk accounts
            </span>
            {aiEnabled && (
              <span style={{
                fontSize: 10, fontWeight: 600, color: "#38bdf8",
                background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)",
                padding: "2px 8px", borderRadius: 99, letterSpacing: "0.05em",
                textTransform: "uppercase", fontFamily: "var(--sans)",
              }}>
                AI scored
              </span>
            )}
          </div>
          {topRiskCustomers.slice(0, 5).map((c, i) => {
            const scoreColor = getRiskScoreColor(c.riskScore ?? 0);
            return (
              <div key={c.email} className="ai-risk-row" onClick={() => onOpenCustomer(c.email)}>
                <div className="ai-risk-rank">#{i + 1}</div>

                {/* Avatar */}
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 600, color: "#94a3b8",
                  letterSpacing: "0.02em", fontFamily: "var(--sans)",
                }}>
                  {inits(c.name ?? "", c.email)}
                </div>

                {/* Name / email */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12.5, fontWeight: 500, color: "#e2e8f0",
                    letterSpacing: "-0.015em", lineHeight: 1.2,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {c.name || c.email}
                  </div>
                  <div style={{
                    fontSize: 10.5, color: "#475569", marginTop: 1,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {c.name ? c.email : ""}
                  </div>
                </div>

                {/* Amount due */}
                {c.totalDue != null && (
                  <div style={{
                    fontSize: 12, fontWeight: 500, color: "#94a3b8",
                    fontFamily: "var(--sans)", letterSpacing: "-0.01em", flexShrink: 0,
                  }}>
                   {fmtK(c.totalDue, "INR")}
                  </div>
                )}

                {/* Risk level badge */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "3px 8px", borderRadius: 5,
                  background: `${getRiskColor(c.riskLevel ?? "")}14`,
                  border: `1px solid ${getRiskColor(c.riskLevel ?? "")}30`,
                  flexShrink: 0,
                }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: getRiskColor(c.riskLevel ?? ""), flexShrink: 0 }} />
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: getRiskColor(c.riskLevel ?? ""),
                    textTransform: "capitalize", letterSpacing: "-0.01em", fontFamily: "var(--sans)",
                  }}>
                    {c.riskLevel?.replace("_", " ") ?? "—"}
                  </span>
                </div>

                {/* Score bar (shown if AI enabled and score available) */}
                {aiEnabled && c.riskScore != null && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, width: 80 }}>
                    <div className="ai-risk-score-bar">
                      <div style={{
                        height: "100%", borderRadius: 99,
                        width: `${c.riskScore}%`,
                        background: scoreColor,
                        transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
                      }} />
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: scoreColor, minWidth: 24, textAlign: "right", fontFamily: "var(--sans)" }}>
                      {c.riskScore}
                    </span>
                  </div>
                )}

                {/* Arrow */}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, opacity: 0.3 }}>
                  <path d="M2 8L8 2M8 2H4M8 2V6" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            );
          })}
        </div>
      )}

      {/* Loading skeleton for top risk */}
      {loadingAll && topRiskCustomers.length === 0 && (
        <div style={{ borderTop: "1px solid #1e293b", padding: "12px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="ai-shimmer" style={{ height: 10, width: "30%" }} />
          {[0, 1, 2].map(i => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="ai-shimmer" style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                <div className="ai-shimmer" style={{ height: 10, width: "45%" }} />
                <div className="ai-shimmer" style={{ height: 8, width: "65%" }} />
              </div>
              <div className="ai-shimmer" style={{ height: 20, width: 60, borderRadius: 5 }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Customer Card ────────────────────────────────────────────────────────────

function CustomerCard({ client, delay, aiEnabled, riskScore }: {
  client: Client;
  delay: number;
  aiEnabled: boolean;
  riskScore?: number;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const risk = getRisk(client);
  const initials = inits(client.name, client.email);

  return (
    <div
      className="ac-card ac-in"
      style={{ animationDelay: `${delay}s` }}
      onClick={() => dispatch(openCustomer(client.email))}
    >
      {/* Top: avatar + name + risk badge */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: "#f3f4f6", border: "1px solid #e5e7eb",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 600, color: "#374151",
            letterSpacing: "0.02em", fontFamily: "var(--sans)",
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 13.5, fontWeight: 500, color: "#111827",
              letterSpacing: "-0.015em", lineHeight: 1.2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {client.name || "—"}
            </div>
            <div style={{
              fontSize: 11, color: "#9ca3af", marginTop: 2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              letterSpacing: "-0.01em",
            }}>
              {client.email}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 500, flexShrink: 0,
            padding: "3px 8px", borderRadius: 99,
            background: risk.bg, color: risk.color, border: `1px solid ${risk.border}`,
            letterSpacing: "-0.01em",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: risk.dot, flexShrink: 0 }} />
            {risk.label}
          </span>

          {/* AI score chip */}
          {aiEnabled && riskScore != null && (
            <div className="ai-chip" style={{
              background: `${getRiskScoreColor(riskScore)}12`,
              border: `1px solid ${getRiskScoreColor(riskScore)}25`,
              color: getRiskScoreColor(riskScore),
            }}>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.05em" }}>AI</span>
              {riskScore}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "#f3f4f6", margin: "0 -20px" }} />

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <div style={{
            fontSize: 10, fontWeight: 600, color: "#9ca3af",
            textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 5,
          }}>
            Outstanding
          </div>
          <div style={{
            fontFamily: "var(--serif)",
            fontSize: 22, fontWeight: 400, color: client.isFullyPaid ? "#16a34a" : "#111827",
            letterSpacing: "-0.02em", lineHeight: 1,
          }}>
          {fmt(client.totalDue, (client as any).currency ?? "INR")}
          </div>
        </div>
        <div>
          <div style={{
            fontSize: 10, fontWeight: 600, color: "#9ca3af",
            textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 5,
          }}>
            Invoices
          </div>
          <div style={{
            fontFamily: "var(--serif)",
            fontSize: 22, fontWeight: 400, color: "#111827",
            letterSpacing: "-0.02em", lineHeight: 1,
          }}>
            {client.invoiceCount}
          </div>
        </div>
      </div>

      {/* Lifecycle + CTA row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: 12, color: "#6b7280",
          textTransform: "capitalize" as const, letterSpacing: "-0.01em",
        }}>
          {client.lifecycle ?? "—"}
        </span>
        <div
          className="ac-card-arrow"
          style={{
            width: 26, height: 26, borderRadius: 7,
            background: "#f3f4f6", border: "1px solid #e5e7eb",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.12s", flexShrink: 0,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 8L8 2M8 2H4M8 2V6" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14,
      padding: 20, display: "flex", flexDirection: "column", gap: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="ac-shimmer" style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="ac-shimmer" style={{ height: 12, width: "55%" }} />
          <div className="ac-shimmer" style={{ height: 10, width: "75%" }} />
        </div>
      </div>
      <div style={{ height: 1, background: "#f3f4f6" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="ac-shimmer" style={{ height: 32 }} />
        <div className="ac-shimmer" style={{ height: 32 }} />
      </div>
      <div className="ac-shimmer" style={{ height: 12, width: "40%" }} />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Activity() {
  const dispatch = useDispatch<AppDispatch>();

  const { list: clients, loading, error } = useSelector((s: RootState) => s.clients);
  const { all: riskAll, summary, loadingAll, loadingSummary } = useSelector((s: RootState) => s.risk);

  const [search, setSearch]     = useState("");
  const [focused, setFocused]   = useState(false);
  const [filter, setFilter]     = useState<FilterKey>("all");
  const [sort, setSort]         = useState<"due_desc" | "due_asc" | "name" | "invoices">("due_desc");
  const [aiEnabled, setAIEnabled] = useState(false);

  // Build a map of email → riskScore for quick lookup on cards
  const riskScoreMap = React.useMemo(() => {
    const m: Record<string, number> = {};
    riskAll.forEach(r => {
      if (r.email && r.riskScore != null) m[r.email] = r.riskScore;
    });
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
    .filter(c =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
    )
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

      <div className="ac-scroll" style={{ flex: 1, overflowY: "auto", padding: "36px 32px 64px" }}>

        {/* Heading */}
        <div className="ac-in" style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.1em",
            color: "#9ca3af", textTransform: "uppercase" as const, marginBottom: 8,
            fontFamily: "var(--sans)",
          }}>
            Customers
          </div>
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: "clamp(28px, 3vw, 40px)",
            fontWeight: 400, lineHeight: 1.1,
            letterSpacing: "-0.025em", color: "#111827",
            margin: "0 0 6px",
          }}>
            {clients.length} accounts. <em style={{ fontStyle: "italic" }}>Every signal tracked.</em>
          </h1>
          <p style={{
            fontSize: 13.5, color: "#6b7280", letterSpacing: "-0.01em",
            margin: 0, fontFamily: "var(--sans)",
          }}>
            Filter, sort, and drill into any customer's full profile.
          </p>
        </div>

        {/* ── AI Risk Intelligence Panel ── */}
        <AIRiskPanel
          aiEnabled={aiEnabled}
          onToggleAI={handleToggleAI}
          loading={loadingSummary}
          loadingAll={loadingAll}
          summary={summary}
          onOpenCustomer={handleOpenCustomer}
        />

        {/* Stat cards */}
        {!loading && clients.length > 0 && (
          <div className="ac-in" style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10, marginBottom: 24,
            animationDelay: "0.05s",
          }}>
            {[
              { label: "Outstanding",  val: fmtK(totalDue, "INR"),         hint: `${clients.length} clients`,  icon: "$" },
              { label: "High Risk",     val: String(highRiskCount),   hint: "need attention",             icon: "⚠" },
              { label: "Total Clients", val: String(clients.length),  hint: "tracked accounts",           icon: "◫" },
              { label: "Paid Invoices", val: String(settledCount),    hint: "across all clients",         icon: "✓" },
            ].map(({ label, val, hint, icon }) => (
              <div key={label} style={{
                border: "1px solid #e5e7eb", borderRadius: 12,
                padding: "18px 20px", background: "#fff",
                transition: "border-color 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#d1d5db")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: "#9ca3af",
                    textTransform: "uppercase" as const, letterSpacing: "0.1em",
                    fontFamily: "var(--sans)",
                  }}>{label}</span>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    border: "1px solid #e5e7eb", background: "#f9fafb",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, color: "#6b7280",
                  }}>{icon}</div>
                </div>
                <div style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontSize: 32, fontWeight: 400, color: "#111827",
                  margin: 0, lineHeight: 1, letterSpacing: "-0.02em",
                }}>{val}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 5, fontFamily: "var(--sans)" }}>{hint}</div>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        {!loading && clients.length > 0 && (
          <div className="ac-in" style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", flexWrap: "wrap" as const,
            gap: 10, marginBottom: 20, animationDelay: "0.1s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
              {/* Search */}
              <div style={{
                display: "flex", alignItems: "center", gap: 7,
                border: `1px solid ${focused ? "#9ca3af" : "#e5e7eb"}`,
                borderRadius: 8, padding: "6px 12px", background: "#fff",
                transition: "all 0.15s",
                boxShadow: focused ? "0 0 0 3px rgba(0,0,0,0.04)" : "none",
              }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <circle cx="5.5" cy="5.5" r="4" stroke="#9ca3af" strokeWidth="1.2" />
                  <path d="M9 9L11.5 11.5" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <input
                  className="ac-search-input"
                  placeholder="Search clients…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                />
                {search && (
                  <button onClick={() => setSearch("")} style={{
                    border: "none", background: "none", cursor: "pointer",
                    color: "#9ca3af", padding: 0, fontSize: 14, lineHeight: 1,
                  }}>×</button>
                )}
              </div>

              {/* Filter pills */}
              {FILTERS.map(f => {
                const count = f.id === "all"
                  ? clients.length
                  : clients.filter(c => matchesFilter(c, f.id)).length;
                const isActive = filter === f.id;
                return (
                  <button
                    key={f.id}
                    className={`ac-filter${isActive ? " active" : ""}`}
                    onClick={() => setFilter(f.id)}
                  >
                    {f.dot && (
                      <span style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: isActive ? "rgba(255,255,255,0.6)" : f.dot,
                        flexShrink: 0,
                      }} />
                    )}
                    {f.label}
                    <span style={{
                      fontSize: 10.5, fontWeight: 500,
                      padding: "1px 6px", borderRadius: 99,
                      background: isActive ? "rgba(255,255,255,0.15)" : "#f3f4f6",
                      border: `1px solid ${isActive ? "rgba(255,255,255,0.2)" : "#e5e7eb"}`,
                      color: isActive ? "#fff" : "#9ca3af",
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <select
                className="ac-select"
                value={sort}
                onChange={e => setSort(e.target.value as typeof sort)}
              >
                <option value="due_desc">Highest due</option>
                <option value="due_asc">Lowest due</option>
                <option value="name">Name A–Z</option>
                <option value="invoices">Most invoices</option>
              </select>

              <button className="ac-refresh" onClick={() => {
                dispatch(loadClients());
                dispatch(loadRiskSummary());
                dispatch(loadRiskAll(aiEnabled));
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 6C1 3.24 3.24 1 6 1c1.5 0 2.85.6 3.84 1.57M11 6c0 2.76-2.24 5-5 5-1.5 0-2.85-.6-3.84-1.57"
                    stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  <path d="M9.5 2l.84-.57.93.57" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* Card wrapper */}
        <div style={{
          border: "1px solid #e5e7eb", borderRadius: 14,
          overflow: "hidden", background: "#fff",
        }}>
          {!loading && clients.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "13px 20px", borderBottom: "1px solid #e5e7eb",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontSize: 13, fontWeight: 600, color: "#111827",
                  letterSpacing: "-0.02em", fontFamily: "var(--sans)",
                }}>
                  Client Accounts
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 500, color: "#6b7280",
                  background: "#f3f4f6", border: "1px solid #e5e7eb",
                  padding: "1px 8px", borderRadius: 100,
                }}>
                  {filtered.length}
                </span>
                {aiEnabled && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: "#38bdf8",
                    background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.18)",
                    padding: "2px 8px", borderRadius: 99, letterSpacing: "0.04em",
                    textTransform: "uppercase" as const, fontFamily: "var(--sans)",
                  }}>
                    AI scored
                  </span>
                )}
              </div>
              <span style={{
                fontSize: 11.5, color: "#9ca3af", letterSpacing: "-0.01em",
                fontFamily: "var(--sans)",
              }}>
                Click any card to open profile →
              </span>
            </div>
          )}

          {loading && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 12, padding: 20,
            }}>
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {error && !loading && (
            <div style={{
              margin: "12px 20px", padding: "10px 14px", borderRadius: 8,
              background: "#fff8f8", border: "1px solid #fee2e2",
              fontSize: 13, color: "#b91c1c", fontFamily: "var(--sans)",
            }}>
              {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div style={{
              padding: "60px 20px", textAlign: "center",
              fontSize: 13, color: "#9ca3af", fontFamily: "var(--sans)",
            }}>
              {search ? `No clients matching "${search}"` : "No clients yet"}
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 12, padding: 20,
            }}>
              {filtered.map((client, i) => (
                <CustomerCard
                  key={client.id}
                  client={client}
                  delay={Math.min(i * 0.03, 0.3)}
                  aiEnabled={aiEnabled}
                  riskScore={riskScoreMap[client.email]}
                />
              ))}
            </div>
          )}
        </div>

        {!loading && filtered.length > 0 && filtered.length < clients.length && (
          <p style={{
            fontSize: 12, color: "#9ca3af", textAlign: "center",
            marginTop: 16, fontFamily: "var(--sans)",
          }}>
            Showing {filtered.length} of {clients.length} clients
          </p>
        )}
      </div>
    </div>
  );
}