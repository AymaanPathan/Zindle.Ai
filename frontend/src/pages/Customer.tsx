import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import {
  loadCustomerProfile,
  draftCustomerEmail,
  sendCustomerEmail,
  clearCustomer,
  clearSendStatus,
} from "../store/slices/customerSlice";
import { loadRiskDetail, clearDetail } from "../store/slices/riskSlice";
import { closeCustomer } from "../store/slices/uiSlice";
import type { CustomerInvoice, CustomerEmailEvent } from "../store/slices/customerSlice";
import type { RiskSignalBreakdown } from "../types";

// ─── CSS ──────────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap');

  .cp {
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
    background: var(--w);
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .cp-scroll::-webkit-scrollbar { width: 3px; }
  .cp-scroll::-webkit-scrollbar-track { background: transparent; }
  .cp-scroll::-webkit-scrollbar-thumb { background: var(--g200); border-radius: 99px; }

  @keyframes cp-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes cp-spin { to { transform: rotate(360deg); } }
  .cp-in { animation: cp-in 0.25s ease both; }

  .cp-back {
    display: flex; align-items: center; gap: 5px;
    background: none; border: none; cursor: pointer;
    font-size: 12.5px; font-weight: 400; color: var(--g400);
    font-family: var(--sans); padding: 0; letter-spacing: -0.01em;
    transition: color 0.1s;
  }
  .cp-back:hover { color: var(--g900); }

  .cp-tab {
    padding: 6px 14px; border: none; background: transparent; cursor: pointer;
    font-size: 13px; font-weight: 400; color: var(--g500);
    font-family: var(--sans); letter-spacing: -0.01em;
    border-bottom: 2px solid transparent; transition: all 0.1s;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .cp-tab:hover:not(.active) { color: var(--g900); }
  .cp-tab.active { color: var(--g900); font-weight: 500; border-bottom-color: var(--g900); }

  .cp-tbl { width: 100%; border-collapse: collapse; }
  .cp-tbl thead tr { background: var(--g50); border-bottom: 1px solid var(--g200); }
  .cp-tbl thead th {
    padding: 10px 20px; text-align: left;
    font-size: 10px; font-weight: 600; color: var(--g400);
    text-transform: uppercase; letter-spacing: 0.1em; white-space: nowrap;
  }
  .cp-tbl tbody tr { border-bottom: 1px solid var(--g100); transition: background 0.08s; }
  .cp-tbl tbody tr:last-child { border-bottom: none; }
  .cp-tbl tbody tr:hover { background: var(--g50); }
  .cp-tbl tbody td { padding: 13px 20px; font-size: 13px; vertical-align: middle; }

  .cp-inv-btn {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 11px; border-radius: 6px;
    font-size: 11.5px; font-weight: 500; cursor: pointer;
    font-family: var(--sans); letter-spacing: -0.01em;
    text-decoration: none; transition: all 0.12s; white-space: nowrap;
  }

  .cp-ev {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 12px 0; border-bottom: 1px solid var(--g100);
  }
  .cp-ev:last-child { border-bottom: none; }

  .cp-compose {
    position: fixed; bottom: 0; right: 32px;
    width: 520px; background: var(--w);
    border-radius: 12px 12px 0 0;
    border: 1px solid var(--g200);
    box-shadow: 0 8px 40px rgba(0,0,0,0.14);
    display: flex; flex-direction: column;
    z-index: 100;
    animation: cp-in 0.2s ease both;
    overflow: hidden;
  }
  .cp-compose-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px;
    background: var(--g900); color: #fff;
    cursor: move; user-select: none;
    border-radius: 12px 12px 0 0;
  }
  .cp-compose-field {
    display: flex; align-items: center; gap: 0;
    border-bottom: 1px solid var(--g100);
  }
  .cp-compose-label {
    font-size: 12px; color: var(--g400); width: 60px; flex-shrink: 0;
    padding: 10px 14px; letter-spacing: -0.01em;
  }
  .cp-compose-input {
    flex: 1; border: none; outline: none; background: transparent;
    font-size: 13px; color: var(--g900); padding: 10px 14px 10px 0;
    font-family: var(--sans); letter-spacing: -0.01em;
  }
  .cp-compose-input::placeholder { color: var(--g300); }
  .cp-compose-body {
    flex: 1; border: none; outline: none; background: transparent;
    font-size: 13px; color: var(--g900); padding: 14px;
    font-family: var(--sans); letter-spacing: -0.01em;
    resize: none; line-height: 1.7; min-height: 200px;
  }
  .cp-compose-body::placeholder { color: var(--g300); }

  .cp-dtype {
    padding: 6px 13px; border-radius: 99px; cursor: pointer;
    font-size: 12px; font-weight: 400; letter-spacing: -0.01em;
    border: 1px solid var(--g200); background: var(--w); color: var(--g500);
    font-family: var(--sans); transition: all 0.1s;
  }
  .cp-dtype:hover:not(.active) { background: var(--g50); color: var(--g900); border-color: var(--g300); }
  .cp-dtype.active { background: var(--g900); border-color: var(--g900); color: #fff; font-weight: 500; }

  /* ── Risk tab styles ── */
  @keyframes cp-shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
  .cp-shimmer {
    background: linear-gradient(90deg, #f3f4f6 0%, #fafafa 50%, #f3f4f6 100%) !important;
    background-size: 600px 100% !important;
    animation: cp-shimmer 1.6s ease infinite !important;
    border-radius: 6px;
  }

  .cp-risk-card {
    background: #fff; border: 1px solid #e5e7eb;
    border-radius: 14px; overflow: hidden;
  }

  .cp-risk-card-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 13px 20px; border-bottom: 1px solid #f3f4f6;
  }

  .cp-signal-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 20px; border-bottom: 1px solid #f3f4f6; gap: 12px;
  }
  .cp-signal-row:last-child { border-bottom: none; }
  .cp-signal-row:hover { background: #f9fafb; }

  .cp-source {
    display: inline-flex; align-items: center;
    font-size: 10px; font-weight: 600; padding: 2px 7px;
    border-radius: 5px; letter-spacing: 0.02em;
    text-transform: uppercase; font-family: var(--sans); flex-shrink: 0;
  }
  .cp-source.stripe  { background: #eef2ff; color: #4f46e5; border: 1px solid #e0e7ff; }
  .cp-source.hubspot { background: #fff1f0; color: #e6390a; border: 1px solid #ffd4c9; }

  .cp-breakdown-row {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 20px; border-bottom: 1px solid #f3f4f6;
    transition: background 0.1s;
  }
  .cp-breakdown-row:last-child { border-bottom: none; }
  .cp-breakdown-row:hover { background: #f9fafb; }

  .cp-pts-bar {
    height: 3px; border-radius: 99px;
    background: #f3f4f6; overflow: hidden; flex: 1; min-width: 40px;
  }
  .cp-pts-fill {
    height: 100%; border-radius: 99px;
    transition: width 0.7s cubic-bezier(0.16,1,0.3,1);
  }

  .cp-score-ring {
    position: relative; width: 72px; height: 72px; flex-shrink: 0;
  }

  .cp-kpi-tile {
    padding: 18px 22px;
    position: relative;
    transition: background 0.1s;
  }
  .cp-kpi-tile:hover { background: #fafafa; }

  .cp-action-row {
    display: flex; align-items: flex-start; gap: 12px;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px; padding: 12px 14px;
    transition: background 0.1s;
  }
  .cp-action-row:hover { background: rgba(255,255,255,0.05); }
`;

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(cents / 100);
}
function fmtK(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(cents / 100);
}
function fmtDate(val: any): string {
  if (!val) return "—";
  const n = Number(val);
  const d = !isNaN(n) && n > 1_000_000_000 ? new Date(n * 1000) : new Date(val);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(val: any): string {
  if (!val) return "—";
  const n = Number(val);
  const d = !isNaN(n) && n > 1_000_000_000 ? new Date(n * 1000) : new Date(val);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
function fmtRel(val: any): string {
  if (!val) return "";
  const n = Number(val);
  const d = !isNaN(n) && n > 1_000_000_000 ? new Date(n * 1000) : new Date(val);
  if (isNaN(d.getTime())) return "";
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// ── FIX: daysSinceLastReply / daysSinceLastActive are plain integers, NOT timestamps ──
function fmtDaysAgo(days: number | undefined | null): string {
  if (days === undefined || days === null) return "—";
  if (days === 999) return "No history"; // sentinel value from collector
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function inits(name: string, email: string) {
  const n = name?.trim();
  if (n) {
    const p = n.split(" ");
    return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : n.slice(0, 2).toUpperCase();
  }
  return (email ?? "?").slice(0, 2).toUpperCase();
}

// ─── Style Helpers ────────────────────────────────────────────────────────────

function getRisk(level: string) {
  if (level === "high" || level === "critical") return { label: "High risk", dot: "#ef4444", color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" };
  if (level === "medium") return { label: "Review", dot: "#f59e0b", color: "#92400e", bg: "#fffbeb", border: "#fde68a" };
  return { label: "Healthy", dot: "#22c55e", color: "#14532d", bg: "#f0fdf4", border: "#d1fae5" };
}
function getStatusStyle(status: string) {
  if (status === "paid")          return { bg: "#f0fdf4", color: "#14532d", border: "#d1fae5" };
  if (status === "open")          return { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" };
  if (status === "uncollectible") return { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" };
  return { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };
}
function getCategoryStyle(cat: string) {
  if (cat === "critical")  return { label: "Critical",  dot: "#ef4444", color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" };
  if (cat === "high_risk") return { label: "High risk", dot: "#f97316", color: "#9a3412", bg: "#fff7ed", border: "#fed7aa" };
  if (cat === "watch")     return { label: "Watch",     dot: "#f59e0b", color: "#92400e", bg: "#fffbeb", border: "#fde68a" };
  return                          { label: "Healthy",   dot: "#22c55e", color: "#14532d", bg: "#f0fdf4", border: "#d1fae5" };
}
function getUrgencyStyle(urgency: string) {
  if (urgency === "immediate") return { label: "Immediate action", dot: "#ef4444" };
  if (urgency === "high")      return { label: "High urgency",     dot: "#f97316" };
  if (urgency === "medium")    return { label: "Medium urgency",   dot: "#f59e0b" };
  return                              { label: "Low urgency",      dot: "#22c55e" };
}
function getScoreColor(score: number) {
  if (score >= 75) return "#ef4444";
  if (score >= 50) return "#f97316";
  if (score >= 25) return "#f59e0b";
  return "#22c55e";
}
function fmtBool(v: boolean) {
  return v
    ? <span style={{ color: "#ef4444", fontWeight: 600 }}>Yes</span>
    : <span style={{ color: "#22c55e", fontWeight: 600 }}>No</span>;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size,
      border: `1.5px solid #e5e7eb`, borderTopColor: "#6b7280",
      borderRadius: "50%", flexShrink: 0,
      animation: "cp-spin 0.6s linear infinite",
    }} />
  );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 28, circ = 2 * Math.PI * r;
  const color = getScoreColor(score);
  return (
    <div className="cp-score-ring">
      <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="#f3f4f6" strokeWidth="5" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${(score / 100) * circ} ${circ - (score / 100) * circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 19, fontWeight: 400, color, lineHeight: 1, letterSpacing: "-0.02em" }}>
          {score}
        </span>
        <span style={{ fontSize: 8, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
          score
        </span>
      </div>
    </div>
  );
}

// ─── Event icons ──────────────────────────────────────────────────────────────

const EV_ICON: Record<string, React.ReactNode> = {
  OPEN:            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="#3b82f6" strokeWidth="1.3"/><circle cx="7" cy="7" r="1.5" fill="#3b82f6"/></svg>,
  CLICK:           <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M5 2v6l2-2 2 4" stroke="#8b5cf6" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  SENT:            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1.5 7L12.5 2.5 8 12.5 7 7.5 1.5 7z" stroke="#6b7280" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  DELIVERED:       <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 7.5l3 3 7-7" stroke="#22c55e" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  email_opened:    <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="#3b82f6" strokeWidth="1.3"/><circle cx="7" cy="7" r="1.5" fill="#3b82f6"/></svg>,
  email_clicked:   <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M5 2v6l2-2 2 4" stroke="#8b5cf6" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  email_sent:      <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1.5 7L12.5 2.5 8 12.5 7 7.5 1.5 7z" stroke="#6b7280" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  email_delivered: <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 7.5l3 3 7-7" stroke="#22c55e" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

// ─── Signal Section ───────────────────────────────────────────────────────────

function SignalSection({ title, source, rows }: {
  title: string;
  source: "stripe" | "hubspot";
  rows: { key: string; value: React.ReactNode; flag?: boolean }[];
}) {
  return (
    <div className="cp-risk-card">
      <div className="cp-risk-card-header">
        <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", letterSpacing: "-0.02em", fontFamily: "var(--sans)" }}>
          {title}
        </span>
        <span className={`cp-source ${source}`}>{source}</span>
      </div>
      <div>
        {rows.map((row, i) => (
          <div className="cp-signal-row" key={i}>
            <span style={{ fontSize: 12, color: "#6b7280", fontFamily: "var(--sans)", letterSpacing: "-0.01em" }}>
              {row.key}
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: row.flag ? "#ef4444" : "#111827", fontFamily: "var(--sans)", letterSpacing: "-0.015em", textAlign: "right" as const }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Risk Tab Skeleton ────────────────────────────────────────────────────────

function RiskSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "20px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16 }}>
        <div className="cp-shimmer" style={{ width: 72, height: 72, borderRadius: "50%" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="cp-shimmer" style={{ height: 16, width: "30%" }} />
          <div className="cp-shimmer" style={{ height: 11, width: "20%" }} />
          <div className="cp-shimmer" style={{ height: 11, width: "25%" }} />
        </div>
        <div className="cp-shimmer" style={{ height: 32, width: 90, borderRadius: 99 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ padding: "20px", borderRight: i < 3 ? "1px solid #f3f4f6" : "none" }}>
            <div className="cp-shimmer" style={{ height: 9, width: "55%", marginBottom: 10 }} />
            <div className="cp-shimmer" style={{ height: 26, width: "60%", marginBottom: 8 }} />
            <div className="cp-shimmer" style={{ height: 9, width: "40%" }} />
          </div>
        ))}
      </div>
      <div style={{ background: "#fafafa", borderRadius: 16, overflow: "hidden", border: "1px solid #e5e7eb" }}>
        <div className="cp-shimmer" style={{ height: 12, width: "18%", marginBottom: 20, opacity: 0.3 }} />
        <div className="cp-shimmer" style={{ height: 12, width: "100%", marginBottom: 8, opacity: 0.2 }} />
        <div className="cp-shimmer" style={{ height: 12, width: "82%", marginBottom: 8, opacity: 0.2 }} />
        <div className="cp-shimmer" style={{ height: 12, width: "67%", opacity: 0.2 }} />
      </div>
    </div>
  );
}

// ─── Gmail-style Compose Window ───────────────────────────────────────────────

const DRAFT_TYPES = [
  { id: "payment_reminder",     label: "Reminder" },
  { id: "overdue_followup",     label: "Follow-up" },
  { id: "relationship_checkin", label: "Check-in" },
  { id: "custom",               label: "Custom" },
] as const;

function ComposeWindow({ email, onClose }: { email: string; onClose: () => void }) {
  const dispatch = useDispatch<AppDispatch>();
  const { draft, draftLoading, draftError, sendLoading, sendError, sendSuccess, sentMessageId } =
    useSelector((s: RootState) => s.customer);

  const [selectedType, setSelectedType]           = useState<string>("payment_reminder");
  const [customInstruction, setCustomInstruction] = useState("");
  const [editSubject, setEditSubject]             = useState("");
  const [editBody, setEditBody]                   = useState("");
  const [minimized, setMinimized]                 = useState(false);
  const [confirmSend, setConfirmSend]             = useState(false);

  useEffect(() => {
    if (draft) { setEditSubject(draft.subject ?? ""); setEditBody(draft.body ?? ""); }
  }, [draft]);

  useEffect(() => {
    if (sendSuccess) {
      const t = setTimeout(() => { dispatch(clearSendStatus()); onClose(); }, 2500);
      return () => clearTimeout(t);
    }
  }, [sendSuccess, dispatch, onClose]);

  const handleGenerate = () => {
    dispatch(draftCustomerEmail({ email, type: selectedType, customInstruction: selectedType === "custom" ? customInstruction : undefined }));
    setConfirmSend(false);
  };
  const handleSend = () => {
    dispatch(sendCustomerEmail({ email, subject: editSubject, body: editBody }));
    setConfirmSend(false);
  };
  const recipientName = email.split("@")[0];

  return (
    <div className="cp-compose" style={{ height: minimized ? "auto" : 600 }}>
      <div className="cp-compose-header" onClick={() => setMinimized(m => !m)}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M7 1C7 1 7.6 4.4 9 5.8C10.4 7.2 13 7 13 7C13 7 10.4 6.8 9 8.2C7.6 9.6 7 13 7 13C7 13 6.4 9.6 5 8.2C3.6 6.8 1 7 1 7C1 7 3.6 7.2 5 5.8C6.4 4.4 7 1 7 1Z" fill="white" opacity="0.7"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 500, fontFamily: "var(--sans)" }}>
            {draft ? `Re: ${editSubject || "Draft"}` : "New Message"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {[
            { icon: minimized ? "M2 8L8 2" : "M2 8h6", extra: !minimized ? "M8 8V2" : null, action: () => setMinimized(m => !m) },
            { icon: "M2 2l6 6M8 2L2 8", extra: null, action: onClose },
          ].map((btn, bi) => (
            <button key={bi} onClick={e => { e.stopPropagation(); btn.action(); }} style={{
              width: 24, height: 24, border: "none", background: "transparent", cursor: "pointer",
              color: "rgba(255,255,255,0.7)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d={btn.icon} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                {btn.extra && <path d={btn.extra} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>}
              </svg>
            </button>
          ))}
        </div>
      </div>

      {!minimized && (
        <>
          <div style={{ borderBottom: "1px solid #e5e7eb" }}>
            <div className="cp-compose-field">
              <span className="cp-compose-label">To</span>
              <span style={{ fontSize: 13, color: "#111827", padding: "10px 14px 10px 0", fontFamily: "var(--sans)", flex: 1 }}>{email}</span>
            </div>
            <div className="cp-compose-field">
              <span className="cp-compose-label">Subject</span>
              <input className="cp-compose-input" placeholder="Subject" value={editSubject} onChange={e => setEditSubject(e.target.value)} />
            </div>
          </div>

          <textarea className="cp-compose-body"
            placeholder={draft ? "" : "Write your message here, or use AI to generate a draft below…"}
            value={editBody} onChange={e => setEditBody(e.target.value)} style={{ flexShrink: 0 }}
          />

          <div style={{ borderTop: "1px solid #e5e7eb", padding: "10px 14px", background: "#f9fafb", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
              <span style={{ fontSize: 11, color: "#9ca3af", fontFamily: "var(--sans)", letterSpacing: "-0.01em", marginRight: 2 }}>AI draft:</span>
              {DRAFT_TYPES.map(t => (
                <button key={t.id} className={`cp-dtype${selectedType === t.id ? " active" : ""}`} onClick={() => setSelectedType(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>

            {selectedType === "custom" && (
              <input className="cp-compose-input"
                style={{ border: "1px solid #e5e7eb", borderRadius: 7, padding: "7px 10px", fontSize: 12 }}
                placeholder="Describe what you want the AI to write…"
                value={customInstruction} onChange={e => setCustomInstruction(e.target.value)}
              />
            )}

            {draftError && <div style={{ fontSize: 11.5, color: "#b91c1c", padding: "6px 10px", background: "#fef2f2", borderRadius: 6, border: "1px solid #fecaca" }}>{draftError}</div>}
            {sendError  && <div style={{ fontSize: 11.5, color: "#b91c1c", padding: "6px 10px", background: "#fef2f2", borderRadius: 6, border: "1px solid #fecaca" }}>{sendError}</div>}
            {sendSuccess && (
              <div style={{ fontSize: 12, color: "#14532d", padding: "8px 10px", background: "#f0fdf4", borderRadius: 6, border: "1px solid #d1fae5", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.5L5.5 10.5L11.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Sent successfully{sentMessageId ? ` · ${sentMessageId.slice(0, 16)}…` : ""}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ display: "flex", gap: 7 }}>
                <button onClick={handleGenerate} disabled={draftLoading} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 7, border: "none",
                  background: draftLoading ? "#f3f4f6" : "#111827",
                  color: draftLoading ? "#9ca3af" : "#fff",
                  fontSize: 12.5, fontWeight: 500, cursor: draftLoading ? "not-allowed" : "pointer",
                  fontFamily: "var(--sans)", letterSpacing: "-0.01em", transition: "all 0.12s",
                }}>
                  {draftLoading ? <><Spinner size={12} /> Generating…</> : <>
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M7 1C7 1 7.6 4.4 9 5.8C10.4 7.2 13 7 13 7C13 7 10.4 6.8 9 8.2C7.6 9.6 7 13 7 13C7 13 6.4 9.6 5 8.2C3.6 6.8 1 7 1 7C1 7 3.6 7.2 5 5.8C6.4 4.4 7 1 7 1Z" fill="currentColor"/></svg>
                    Generate
                  </>}
                </button>
                {(editSubject || editBody) && (
                  <button onClick={() => navigator.clipboard.writeText(`Subject: ${editSubject}\n\n${editBody}`)} style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "7px 12px", borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff",
                    fontSize: 12.5, color: "#6b7280", cursor: "pointer", fontFamily: "var(--sans)", letterSpacing: "-0.01em",
                  }}>Copy</button>
                )}
              </div>
              {!confirmSend ? (
                <button onClick={() => setConfirmSend(true)} disabled={!editSubject || !editBody || sendLoading} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 18px", borderRadius: 7, border: "none",
                  background: (!editSubject || !editBody) ? "#e5e7eb" : "#1a73e8",
                  color: (!editSubject || !editBody) ? "#9ca3af" : "#fff",
                  fontSize: 13, fontWeight: 600, cursor: (!editSubject || !editBody) ? "not-allowed" : "pointer",
                  fontFamily: "var(--sans)", letterSpacing: "-0.01em", transition: "all 0.12s",
                }}>
                  {sendLoading ? <><Spinner size={12} /> Sending…</> : <>Send <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1.5 7L12.5 2.5 8 12.5 7 7.5 1.5 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg></>}
                </button>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 12, color: "#374151" }}>Send to <strong>{recipientName}</strong>?</span>
                  <button onClick={() => setConfirmSend(false)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", fontSize: 12, color: "#6b7280", cursor: "pointer", fontFamily: "var(--sans)" }}>Cancel</button>
                  <button onClick={handleSend} disabled={sendLoading} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "#1a73e8", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--sans)", display: "flex", alignItems: "center", gap: 5 }}>
                    {sendLoading ? <><Spinner size={11} /> Sending…</> : "Confirm"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Invoice Table ────────────────────────────────────────────────────────────

function InvoiceTable({ invoices }: { invoices: CustomerInvoice[] }) {
  if (!invoices.length) return (
    <div style={{ padding: "48px 20px", textAlign: "center", fontSize: 13, color: "#9ca3af", fontFamily: "var(--sans)" }}>No invoices found.</div>
  );
  return (
    <div style={{ overflowX: "auto" as const }}>
      <table className="cp-tbl">
        <thead>
          <tr>{["Invoice","Status","Amount due","Paid","Remaining","Due date",""].map(h => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {invoices.map(inv => {
            const s = getStatusStyle(inv.status);
            return (
              <tr key={inv.id}>
                <td>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#111827", letterSpacing: "-0.015em" }}>{inv.number ?? inv.id.slice(0, 10) + "…"}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{inv.created_fmt}</div>
                </td>
                <td>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 99, background: s.bg, color: s.color, border: `1px solid ${s.border}`, letterSpacing: "-0.01em" }}>{inv.status}</span>
                  {inv.is_overdue && <div style={{ fontSize: 10.5, color: "#b91c1c", marginTop: 3, fontWeight: 500 }}>{inv.days_overdue}d overdue</div>}
                </td>
                <td><span style={{ fontSize: 13, fontWeight: 600, color: "#111827", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{fmt(inv.amount_due)}</span></td>
                <td><span style={{ fontSize: 13, color: "#16a34a", fontVariantNumeric: "tabular-nums" }}>{fmt(inv.amount_paid)}</span></td>
                <td><span style={{ fontSize: 13, fontWeight: inv.amount_remaining > 0 ? 600 : 400, color: inv.amount_remaining > 0 ? "#b91c1c" : "#9ca3af", fontVariantNumeric: "tabular-nums" }}>{fmt(inv.amount_remaining)}</span></td>
                <td>
                  <div style={{ fontSize: 12.5, color: inv.is_overdue ? "#b91c1c" : "#374151" }}>{inv.due_date_fmt}</div>
                  {inv.paid_at_fmt !== "—" && <div style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 2 }}>paid {inv.paid_at_fmt}</div>}
                </td>
                <td style={{ textAlign: "right" as const }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    {inv.hosted_invoice_url && <a href={inv.hosted_invoice_url} target="_blank" rel="noopener noreferrer" className="cp-inv-btn" style={{ background: "#111827", color: "#fff", border: "1px solid #111827" }}>Pay <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg></a>}
                    {inv.invoice_pdf     && <a href={inv.invoice_pdf}     target="_blank" rel="noopener noreferrer" className="cp-inv-btn" style={{ background: "#fff",    color: "#6b7280", border: "1px solid #e5e7eb" }}>PDF <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg></a>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Email Timeline ───────────────────────────────────────────────────────────

function EmailTimeline({ events }: { events: CustomerEmailEvent[] }) {
  if (!events.length) return (
    <div style={{ padding: "48px 20px", textAlign: "center", fontSize: 13, color: "#9ca3af", fontFamily: "var(--sans)" }}>No email history found.</div>
  );
  const srcLabel: Record<string, { color: string; label: string }> = {
    hubspot: { color: "#b45309", label: "HubSpot" },
    resend:  { color: "#1d4ed8", label: "Resend" },
  };
  return (
    <div style={{ padding: "4px 0", display: "flex", flexDirection: "column" }}>
      {events.map((ev, i) => {
        const src = srcLabel[ev.source] ?? { color: "#6b7280", label: ev.source };
        const icon = EV_ICON[ev.type] ?? EV_ICON["SENT"];
        const label = ev.type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        return (
          <div key={i} className="cp-ev">
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f9fafb", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#111827", letterSpacing: "-0.015em" }}>{label}</span>
                  <span style={{ fontSize: 10, fontWeight: 500, padding: "1px 6px", borderRadius: 4, border: "1px solid #e5e7eb", color: src.color, background: "#fff", letterSpacing: "0.02em", fontFamily: "var(--sans)" }}>{src.label}</span>
                </div>
                <span style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0, fontFamily: "var(--sans)" }}>{fmtRel(ev.created)}</span>
              </div>
              {ev.subject && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>"{ev.subject}"</div>}
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{fmtTime(ev.created)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Risk Intelligence Tab ────────────────────────────────────────────────────

function RiskIntelTab({ email }: { email: string }) {
  const riskDetail  = useSelector((s: RootState) => s.risk.detail);
  const riskLoading = useSelector((s: RootState) => s.risk.loadingDetail);
  const riskError   = useSelector((s: RootState) => s.risk.errorDetail);

  if (riskLoading) return <RiskSkeleton />;

  if (riskError) return (
    <div style={{ padding: "16px", margin: "20px 0", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, color: "#b91c1c", fontFamily: "var(--sans)" }}>
      {riskError}
    </div>
  );

  if (!riskDetail) return (
    <div style={{ padding: "60px 20px", textAlign: "center", fontSize: 13, color: "#9ca3af", fontFamily: "var(--sans)" }}>
      No risk data available.
    </div>
  );

  const cat    = getCategoryStyle(riskDetail.category);
  const maxPts = Math.max(...(riskDetail.breakdown ?? []).map((b: any) => b.points), 1);

  // ── Read from correct nested signal paths — NO posthog ──
  const stripe  = riskDetail.signals?.stripe  ?? {};
  const hubspot = riskDetail.signals?.hubspot ?? {};

  const totalAmountDue  = stripe.totalAmountDue   ?? 0;
  const daysOverdue     = stripe.daysOverdue       ?? 0;
  const paymentRate     = stripe.paymentSuccessRate ?? 1;

  // daysSinceLastReply is already a plain integer (days), NOT a timestamp
  // 999 is the sentinel value meaning "no reply history"
  const rawDaysSinceReply = hubspot.daysSinceLastReply;
  const daysSinceReply    = (rawDaysSinceReply === 999 || rawDaysSinceReply == null) ? null : rawDaysSinceReply;

  // KPI derived values
  const paymentRatePct  = Math.round(paymentRate * 100);
  const paymentRateColor = paymentRate < 0.6 ? "#ef4444" : paymentRate < 0.85 ? "#f59e0b" : "#16a34a";
  const paymentRateSub   = paymentRate < 0.6 ? "poor history" : paymentRate < 0.85 ? "partial payer" : "reliable";

  const replyColor = daysSinceReply === null ? "#9ca3af"
    : daysSinceReply >= 14 ? "#ef4444"
    : "#16a34a";
  const replySub = daysSinceReply === null ? "no email history"
    : daysSinceReply >= 14 ? "going silent"
    : "recently engaged";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "20px 0" }}>

      {/* ── HERO SCORE CARD ── */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
        {/* Category accent stripe */}
        <div style={{ height: 3, background: cat.dot }} />

        <div style={{ padding: "24px 28px", display: "flex", alignItems: "center", gap: 24 }}>
          <ScoreRing score={riskDetail.score} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#111827", letterSpacing: "-0.025em", lineHeight: 1.2 }}>
              {riskDetail.name || riskDetail.email}
            </div>
            {riskDetail.company && (
              <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 3, letterSpacing: "-0.01em" }}>
                {riskDetail.company}
              </div>
            )}
            <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 5 }}>
              Scored {fmtRel(riskDetail.calculatedAt)}
            </div>
          </div>

          <span style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "7px 16px", borderRadius: 99,
            background: cat.bg, color: cat.color, border: `1.5px solid ${cat.border}`,
            fontSize: 12.5, fontWeight: 700, letterSpacing: "0.01em", fontFamily: "var(--sans)",
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: cat.dot }} />
            {cat.label}
          </span>
        </div>

        {/* ── 4 KPI tiles — Stripe + HubSpot only, NO posthog ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderTop: "1px solid #f3f4f6" }}>
          {[
            {
              label: "Amount due",
              value: totalAmountDue > 0 ? fmtK(totalAmountDue) : "$0",
              sub: totalAmountDue > 0 ? "outstanding" : "all clear",
              color: totalAmountDue > 0 ? "#111827" : "#16a34a",
              flag: totalAmountDue > 50000,
            },
            {
              label: "Days overdue",
              value: daysOverdue > 0 ? `${daysOverdue}d` : "On time",
              sub: daysOverdue >= 30 ? "severely late" : daysOverdue >= 14 ? "late" : "in good standing",
              color: daysOverdue >= 30 ? "#ef4444" : daysOverdue >= 14 ? "#f97316" : "#16a34a",
              flag: daysOverdue >= 14,
            },
            {
              label: "Payment rate",
              // FIX: paymentSuccessRate from stripe signals — e.g. 1 paid / 2 non-void = 50%
              value: `${paymentRatePct}%`,
              sub: paymentRateSub,
              color: paymentRateColor,
              flag: paymentRate < 0.7,
            },
            {
              label: "Last reply",
              // FIX: daysSinceLastReply is already a day count integer, NOT a timestamp
              value: daysSinceReply === null ? "No data" : fmtDaysAgo(daysSinceReply),
              sub: replySub,
              color: replyColor,
              flag: daysSinceReply !== null && daysSinceReply >= 14,
            },
          ].map(({ label, value, sub, color, flag }, i) => (
            <div key={label} className="cp-kpi-tile" style={{
              borderRight: i < 3 ? "1px solid #f3f4f6" : "none",
            }}>
              {flag && (
                <div style={{
                  position: "absolute" as const, top: 10, right: 10,
                  width: 6, height: 6, borderRadius: "50%", background: "#ef4444",
                }} />
              )}
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.1em", fontFamily: "var(--sans)", marginBottom: 8 }}>
                {label}
              </div>
              <div style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 24, fontWeight: 400, color, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {value}
              </div>
              <div style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 5, letterSpacing: "-0.01em", fontFamily: "var(--sans)" }}>
                {sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── AI ANALYSIS ── */}
      {riskDetail.ai && (() => {
        const u = getUrgencyStyle(riskDetail.ai.urgency);
        return (
          <div style={{ background: "#0f1117", borderRadius: 16, overflow: "hidden", border: "1px solid #1e2433" }}>
            {/* Indigo accent stripe */}
            <div style={{ height: 3, background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)" }} />

            <div style={{ padding: "22px 24px" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: 99, padding: "4px 12px",
                    fontSize: 10.5, fontWeight: 700, color: "#a5b4fc",
                    letterSpacing: "0.07em", textTransform: "uppercase" as const, fontFamily: "var(--sans)",
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#818cf8" }} />
                    AI Analysis
                  </div>
                  <span style={{ fontSize: 11.5, color: "#475569", fontFamily: "var(--sans)" }}>
                    powered by risk engine
                  </span>
                </div>

                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 8,
                  background: `${u.dot}20`, border: `1px solid ${u.dot}40`,
                  fontSize: 11, fontWeight: 700, color: u.dot, fontFamily: "var(--sans)",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: u.dot }} />
                  {u.label}
                </div>
              </div>

              {/* Situation */}
              <div style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, padding: "16px 18px", marginBottom: 18,
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: "#475569",
                  textTransform: "uppercase" as const, letterSpacing: "0.1em",
                  marginBottom: 10, fontFamily: "var(--sans)",
                }}>
                  Situation
                </div>
                <p style={{ fontSize: 13.5, color: "#cbd5e1", lineHeight: 1.75, margin: 0, fontFamily: "var(--sans)", letterSpacing: "-0.01em" }}>
                  {riskDetail.ai.situation}
                </p>
              </div>

              {/* Actions */}
              {riskDetail.ai.actions?.length > 0 && (
                <>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: "#475569",
                    textTransform: "uppercase" as const, letterSpacing: "0.1em",
                    marginBottom: 10, fontFamily: "var(--sans)",
                  }}>
                    Recommended actions
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {riskDetail.ai.actions.map((action: string, i: number) => (
                      <div key={i} className="cp-action-row">
                        <div style={{
                          width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                          background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.35)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 800, color: "#a5b4fc", fontFamily: "var(--sans)",
                        }}>
                          {i + 1}
                        </div>
                        <span style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.65, fontFamily: "var(--sans)", letterSpacing: "-0.01em" }}>
                          {action}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── SCORE BREAKDOWN ── */}
      {riskDetail.breakdown?.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 22px", borderBottom: "1px solid #f3f4f6",
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", letterSpacing: "-0.02em" }}>
              Score breakdown
            </span>
            <span style={{ fontSize: 11, color: "#6b7280", background: "#f3f4f6", border: "1px solid #e5e7eb", padding: "2px 9px", borderRadius: 99 }}>
              {riskDetail.breakdown.length} signals
            </span>
          </div>

          {riskDetail.breakdown
            .slice().sort((a: any, b: any) => b.points - a.points)
            .map((item: any, i: number) => {
              const barColor = item.points >= 20 ? "#ef4444" : item.points >= 10 ? "#f97316" : item.points >= 5 ? "#f59e0b" : "#22c55e";
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "13px 22px", borderBottom: "1px solid #f9fafb",
                  transition: "background 0.1s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <span className={`cp-source ${item.source}`} style={{ minWidth: 58, justifyContent: "center" }}>
                    {item.source}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: "#111827", letterSpacing: "-0.015em" }}>
                      {item.signal}
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                      {item.reason}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, width: 100 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 99, background: "#f3f4f6", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 99, background: barColor,
                        width: `${(item.points / maxPts) * 100}%`,
                        transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)",
                      }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: barColor, minWidth: 30, textAlign: "right" as const }}>
                      +{item.points}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ── SIGNAL SOURCES — Stripe + HubSpot only, posthog REMOVED ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14 }}>

        {Object.keys(stripe).length > 0 && (
          <SignalSection title="Payment signals" source="stripe" rows={[
            {
              key: "Days overdue",
              value: (stripe.daysOverdue ?? 0) > 0 ? `${stripe.daysOverdue} days` : "On time",
              flag: (stripe.daysOverdue ?? 0) >= 30,
            },
            {
              key: "Open invoices",
              value: stripe.openInvoiceCount ?? 0,
              flag: (stripe.openInvoiceCount ?? 0) >= 3,
            },
            {
              key: "Total amount due",
              value: fmtK(stripe.totalAmountDue ?? 0),
              flag: (stripe.totalAmountDue ?? 0) > 50000,
            },
            {
              key: "Failed payment",
              value: fmtBool(stripe.hasFailedPayment ?? false),
              flag: stripe.hasFailedPayment === true,
            },
            {
              key: "Late payments (hist.)",
              value: stripe.previousLatePayments ?? 0,
              flag: (stripe.previousLatePayments ?? 0) >= 2,
            },
            {
              key: "Payment success rate",
              // FIX: show actual rate — e.g. 1 paid / 2 non-void invoices = 50%
              value: stripe.paymentSuccessRate != null
                ? `${Math.round(stripe.paymentSuccessRate * 100)}%`
                : "—",
              flag: (stripe.paymentSuccessRate ?? 1) < 0.7,
            },
          ]} />
        )}

        {Object.keys(hubspot).length > 0 && (
          <SignalSection title="Engagement signals" source="hubspot" rows={[
            {
              key: "Lifecycle stage",
              value: <span style={{ textTransform: "capitalize" }}>{hubspot.lifecycleStage || "—"}</span>,
            },
            {
              key: "Days since reply",
              // FIX: daysSinceLastReply is a day count integer (999 = never replied)
              value: hubspot.daysSinceLastReply === 999 || hubspot.daysSinceLastReply == null
                ? "No history"
                : fmtDaysAgo(hubspot.daysSinceLastReply),
              flag: hubspot.daysSinceLastReply != null
                && hubspot.daysSinceLastReply < 999
                && hubspot.daysSinceLastReply >= 14,
            },
            {
              key: "Never replied",
              value: fmtBool(hubspot.openedButNeverReplied ?? false),
              flag: hubspot.openedButNeverReplied === true,
            },
            {
              key: "Ignored emails",
              value: hubspot.totalIgnoredEmails ?? 0,
              flag: (hubspot.totalIgnoredEmails ?? 0) >= 3,
            },
            {
              key: "Active meeting",
              value: fmtBool(hubspot.hasActiveMeeting ?? false),
            },
          ]} />
        )}

      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabId = "invoices" | "emails" | "contact" | "risk";

export default function CustomerProfile() {
  const dispatch   = useDispatch<AppDispatch>();
  const email      = useSelector((s: RootState) => s.ui.selectedCustomerEmail);
  const { profile, profileLoading, profileError } = useSelector((s: RootState) => s.customer);
  const riskDetail = useSelector((s: RootState) => s.risk.detail);

  const [tab, setTab]               = useState<TabId>("invoices");
  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(() => {
    if (email) {
      dispatch(loadCustomerProfile(email));
      dispatch(clearDetail());
      dispatch(loadRiskDetail(email));
    }
    return () => {
      dispatch(clearCustomer());
      dispatch(clearDetail());
    };
  }, [email, dispatch]);

  if (!email) return null;

  const contact = profile?.contact;
  const summary = profile?.summary;
  const risk    = getRisk(summary?.risk_level ?? "medium");
  const name    = contact ? `${contact.firstname ?? ""} ${contact.lastname ?? ""}`.trim() || email : email;

  return (
    <div className="cp">
      <style>{css}</style>

      {/* ── Top bar ── */}
      <div style={{
        height: 52, borderBottom: "1px solid #e5e7eb",
        display: "flex", alignItems: "center",
        padding: "0 32px", gap: 16, flexShrink: 0,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)",
        position: "sticky", top: 0, zIndex: 20,
      }}>
        <button className="cp-back" onClick={() => dispatch(closeCustomer())}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Clients
        </button>

        <div style={{ width: 1, height: 18, background: "#e5e7eb" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, background: "#f3f4f6", border: "1px solid #e5e7eb",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 600, color: "#374151", fontFamily: "var(--sans)", letterSpacing: "0.02em",
          }}>
            {inits(name, email)}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: "#111827", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{name}</div>
            {contact?.company && <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.2 }}>{contact.company}</div>}
          </div>
        </div>

        {summary && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 99,
            background: risk.bg, color: risk.color, border: `1px solid ${risk.border}`, letterSpacing: "-0.01em",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: risk.dot }} />
            {risk.label}
          </span>
        )}

        {riskDetail && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 99,
            background: "#eef2ff", color: "#4f46e5", border: "1px solid #e0e7ff",
            letterSpacing: "-0.01em", fontFamily: "var(--sans)",
          }}>
            <span style={{ fontSize: 9, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>AI</span>
            {riskDetail.score}
          </span>
        )}

        <div style={{ flex: 1 }} />

        <button
          onClick={() => setComposeOpen(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 7, border: "none",
            background: "#111827", color: "#fff",
            fontSize: 13, fontWeight: 500, cursor: "pointer",
            fontFamily: "var(--sans)", letterSpacing: "-0.01em", transition: "opacity 0.12s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M1.5 7L12.5 2.5 8 12.5 7 7.5 1.5 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
          </svg>
          Compose
        </button>
      </div>

      {/* ── Body ── */}
      <div className="cp-scroll" style={{ flex: 1, overflowY: "auto", padding: "36px 32px 80px" }}>

        {profileLoading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, gap: 10, color: "#9ca3af", fontSize: 13, fontFamily: "var(--sans)" }}>
            <Spinner size={16} /> Loading profile…
          </div>
        )}

        {profileError && !profileLoading && (
          <div style={{ padding: "12px 16px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, color: "#b91c1c", fontFamily: "var(--sans)" }}>
            {profileError}
          </div>
        )}

        {profile && !profileLoading && (
          <div className="cp-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                { label: "Outstanding",    val: fmtK(summary?.total_due ?? 0),      hint: `${summary?.unpaid_count ?? 0} unpaid`,  icon: "$" },
                { label: "Collected",      val: fmtK(summary?.total_paid ?? 0),      hint: "all time",                              icon: "✓" },
                { label: "Total Invoiced", val: fmtK(summary?.total_invoiced ?? 0),  hint: "lifetime",                              icon: "◫" },
                { label: "Overdue",        val: String(summary?.overdue_count ?? 0), hint: "invoices past due",                     icon: "⚠" },
              ].map(({ label, val, hint, icon }) => (
                <div key={label} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 20px", background: "#fff", transition: "border-color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#d1d5db")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.1em", fontFamily: "var(--sans)" }}>{label}</span>
                    <div style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid #e5e7eb", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#6b7280" }}>{icon}</div>
                  </div>
                  <div style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 32, fontWeight: 400, color: "#111827", lineHeight: 1, letterSpacing: "-0.02em" }}>{val}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 5, fontFamily: "var(--sans)" }}>{hint}</div>
                </div>
              ))}
            </div>

            {/* Tabs + content */}
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #e5e7eb", padding: "0 20px", gap: 4 }}>
                {([
                  { id: "invoices", label: "Invoices",       count: profile.invoices.length },
                  { id: "emails",   label: "Communications", count: profile.emailEvents.length },
                  { id: "contact",  label: "Contact Info" },
                  { id: "risk",     label: "Risk Intel",     isAI: true },
                ] as { id: TabId; label: string; count?: number; isAI?: boolean }[]).map(t => (
                  <button
                    key={t.id}
                    className={`cp-tab${tab === t.id ? " active" : ""}`}
                    onClick={() => setTab(t.id)}
                  >
                    {t.isAI && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                        color: tab === t.id ? "#4f46e5" : "#9ca3af",
                        background: tab === t.id ? "#eef2ff" : "#f3f4f6",
                        border: `1px solid ${tab === t.id ? "#e0e7ff" : "#e5e7eb"}`,
                        padding: "1px 5px", borderRadius: 4,
                        textTransform: "uppercase" as const,
                      }}>AI</span>
                    )}
                    {t.isAI ? (riskDetail ? `Risk Intel · ${riskDetail.score}` : "Risk Intel") : t.label}
                    {t.count !== undefined && (
                      <span style={{
                        fontSize: 11, fontWeight: 500,
                        color: tab === t.id ? "#111827" : "#9ca3af",
                        background: tab === t.id ? "#f3f4f6" : "#f9fafb",
                        border: "1px solid #e5e7eb",
                        padding: "1px 7px", borderRadius: 99,
                      }}>{t.count}</span>
                    )}
                  </button>
                ))}

                <div style={{ flex: 1 }} />

                {summary?.last_payment_date && (
                  <span style={{ fontSize: 11.5, color: "#9ca3af", letterSpacing: "-0.01em", fontFamily: "var(--sans)" }}>
                    Last payment {fmtRel(summary.last_payment_date)}
                  </span>
                )}
              </div>

              {tab === "invoices" && <InvoiceTable invoices={profile.invoices} />}

              {tab === "emails" && (
                <div style={{ padding: "0 20px" }}>
                  <EmailTimeline events={profile.emailEvents} />
                </div>
              )}

              {tab === "contact" && (
                <div style={{ padding: "20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { label: "Email",          value: contact?.email ?? email },
                      { label: "Company",        value: contact?.company ?? "—" },
                      { label: "Lifecycle",      value: contact?.lifecyclestage ?? "—" },
                      { label: "In HubSpot",     value: contact ? "Yes" : "No" },
                      { label: "HS Created",     value: contact?.createdate ? fmtDate(contact.createdate) : "—" },
                      { label: "Customer since", value: summary?.last_payment_date ? fmtDate(summary.last_payment_date) : "—" },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ padding: "14px 16px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#f9fafb" }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 5, fontFamily: "var(--sans)" }}>{label}</div>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: "#111827", letterSpacing: "-0.015em", fontFamily: "var(--sans)" }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "risk" && (
                <div style={{ padding: "0 20px" }}>
                  <RiskIntelTab email={email} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {composeOpen && <ComposeWindow email={email} onClose={() => setComposeOpen(false)} />}
    </div>
  );
}