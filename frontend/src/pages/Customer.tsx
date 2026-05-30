import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import {
  loadCustomerProfile, draftCustomerEmail, sendCustomerEmail,
  clearCustomer, clearSendStatus,
} from "../store/slices/customerSlice";
import { loadRiskDetail, clearDetail } from "../store/slices/riskSlice";
import { closeCustomer } from "../store/slices/uiSlice";
import type { CustomerInvoice, CustomerEmailEvent } from "../store/slices/customerSlice";
import type { RiskSignalBreakdown } from "../types";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap');

  .cp {
    --w:    #ffffff;
    --g50:  #fafafa;
    --g100: #f5f5f5;
    --g200: #e8e8e8;
    --g300: #d1d1d1;
    --g400: #9ca3af;
    --g500: #6b7280;
    --g600: #4b5563;
    --g700: #374151;
    --g900: #111111;
    --serif: 'Instrument Serif', Georgia, serif;
    --sans:  'Geist', -apple-system, system-ui, sans-serif;
    font-family: var(--sans);
    -webkit-font-smoothing: antialiased;
    background: #fff;
    display: flex; flex-direction: column;
    height: 100%; overflow: hidden;
  }

  .cp-scroll::-webkit-scrollbar { width: 3px; }
  .cp-scroll::-webkit-scrollbar-track { background: transparent; }
  .cp-scroll::-webkit-scrollbar-thumb { background: var(--g200); border-radius: 99px; }

  @keyframes cp-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes cp-modal-in {
    from { opacity: 0; transform: translateY(12px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes cp-overlay-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes cp-spin { to { transform: rotate(360deg); } }
  .cp-in { animation: cp-in 0.22s cubic-bezier(0.16,1,0.3,1) both; }

  .cp-back {
    display: inline-flex; align-items: center; gap: 5px;
    background: none; border: none; cursor: pointer;
    font-size: 12.5px; font-weight: 400; color: var(--g400);
    font-family: var(--sans); padding: 0; letter-spacing: -0.01em;
    transition: color 0.1s;
  }
  .cp-back:hover { color: var(--g900); }

  .cp-tab {
    padding: 0 2px; height: 44px; border: none; background: transparent; cursor: pointer;
    font-size: 13px; font-weight: 400; color: var(--g400);
    font-family: var(--sans); letter-spacing: -0.01em;
    border-bottom: 2px solid transparent; transition: all 0.1s;
    display: inline-flex; align-items: center; gap: 6px;
    margin-right: 20px;
  }
  .cp-tab:hover:not(.active) { color: var(--g700); }
  .cp-tab.active { color: var(--g900); font-weight: 500; border-bottom-color: var(--g900); }

  .cp-tbl { width: 100%; border-collapse: collapse; }
  .cp-tbl thead tr { background: #fff; border-bottom: 1px solid var(--g200); }
  .cp-tbl thead th {
    padding: 10px 20px; text-align: left;
    font-size: 10px; font-weight: 600; color: var(--g400);
    text-transform: uppercase; letter-spacing: 0.08em; white-space: nowrap;
  }
  .cp-tbl tbody tr { border-bottom: 1px solid #f5f5f5; transition: background 0.08s; }
  .cp-tbl tbody tr:last-child { border-bottom: none; }
  .cp-tbl tbody tr:hover { background: #fafafa; }
  .cp-tbl tbody td { padding: 12px 20px; font-size: 13px; vertical-align: middle; }

  .cp-inv-btn {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 10px; border-radius: 6px;
    font-size: 11.5px; font-weight: 500; cursor: pointer;
    font-family: var(--sans); letter-spacing: -0.01em;
    text-decoration: none; transition: all 0.1s; white-space: nowrap;
  }

  .cp-ev {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 12px 0; border-bottom: 1px solid #f5f5f5;
  }
  .cp-ev:last-child { border-bottom: none; }

  /* ── Centered modal overlay ── */
  .cp-overlay {
    position: fixed; inset: 0; z-index: 100;
    background: rgba(0,0,0,0.28);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    animation: cp-overlay-in 0.18s ease both;
    padding: 20px;
  }

  .cp-compose {
    width: 100%; max-width: 560px;
    background: #fff;
    border-radius: 16px;
    border: 1px solid var(--g200);
    box-shadow: 0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
    display: flex; flex-direction: column;
    animation: cp-modal-in 0.22s cubic-bezier(0.16,1,0.3,1) both;
    overflow: hidden;
    max-height: 90vh;
  }

  .cp-compose-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid var(--g200);
    flex-shrink: 0;
  }

  .cp-compose-field {
    display: flex; align-items: center;
    border-bottom: 1px solid #f5f5f5;
  }
  .cp-compose-label {
    font-size: 11.5px; color: var(--g400); width: 60px; flex-shrink: 0;
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
    font-size: 13px; color: var(--g900); padding: 14px 18px;
    font-family: var(--sans); letter-spacing: -0.01em;
    resize: none; line-height: 1.72; min-height: 160px;
  }
  .cp-compose-body::placeholder { color: var(--g300); }

  .cp-close-btn {
    width: 26px; height: 26px; border-radius: 7px; border: none;
    background: #f5f5f5; cursor: pointer; display: flex;
    align-items: center; justify-content: center; color: var(--g500);
    transition: all 0.1s; flex-shrink: 0;
  }
  .cp-close-btn:hover { background: var(--g200); color: var(--g900); }

  .cp-dtype {
    padding: 5px 11px; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 400; letter-spacing: -0.01em;
    border: 1px solid var(--g200); background: #fff; color: var(--g500);
    font-family: var(--sans); transition: all 0.1s;
  }
  .cp-dtype:hover:not(.active) { background: #fafafa; color: var(--g900); border-color: var(--g300); }
  .cp-dtype.active { background: var(--g900); border-color: var(--g900); color: #fff; font-weight: 500; }

  @keyframes cp-shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
  .cp-shimmer {
    background: linear-gradient(90deg, #f3f4f6 0%, #fafafa 50%, #f3f4f6 100%) !important;
    background-size: 600px 100% !important;
    animation: cp-shimmer 1.6s ease infinite !important;
    border-radius: 5px;
  }

  .cp-risk-card { background: #fff; border: 1px solid var(--g200); border-radius: 12px; overflow: hidden; }
  .cp-risk-card-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-bottom: 1px solid #f5f5f5; }
  .cp-signal-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 18px; border-bottom: 1px solid #f5f5f5; gap: 12px; }
  .cp-signal-row:last-child { border-bottom: none; }
  .cp-signal-row:hover { background: #fafafa; }

  .cp-source {
    display: inline-flex; align-items: center;
    font-size: 10px; font-weight: 600; padding: 2px 6px;
    border-radius: 4px; letter-spacing: 0.03em;
    text-transform: uppercase; font-family: var(--sans); flex-shrink: 0;
  }
  .cp-source.stripe  { background: #eef2ff; color: #4f46e5; border: 1px solid #e0e7ff; }
  .cp-source.hubspot { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }

  .cp-score-ring { position: relative; width: 68px; height: 68px; flex-shrink: 0; }

  .cp-kpi-tile {
    padding: 16px 20px; position: relative; transition: background 0.1s;
  }
  .cp-kpi-tile:hover { background: #fafafa; }

  .cp-action-row {
    display: flex; align-items: flex-start; gap: 10px;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px; padding: 11px 13px; transition: background 0.1s;
  }
  .cp-action-row:hover { background: rgba(255,255,255,0.05); }

  .cp-stat-card {
    border: 1px solid var(--g200); border-radius: 12px;
    padding: 18px 20px; background: #fff;
    transition: border-color 0.12s;
  }
  .cp-stat-card:hover { border-color: var(--g300); }

  .cp-field-card {
    padding: 12px 14px; border-radius: 9px;
    border: 1px solid var(--g200); background: #fff;
    transition: border-color 0.12s;
  }
  .cp-field-card:hover { border-color: var(--g300); }

  .cp-send-btn {
    padding: 7px 18px; border-radius: 7px; border: none;
    background: #111; color: #fff; font-size: 13px; font-weight: 500;
    cursor: pointer; letter-spacing: -0.02em; font-family: var(--sans);
    transition: opacity 0.1s; display: flex; align-items: center; gap: 5px;
  }
  .cp-send-btn:hover:not(:disabled) { opacity: 0.82; }
  .cp-send-btn:disabled { background: var(--g200); color: var(--g400); cursor: not-allowed; }

  .cp-gen-btn {
    padding: 7px 14px; border-radius: 7px; border: none;
    background: #111; color: #fff; font-size: 12.5px; font-weight: 500;
    cursor: pointer; letter-spacing: -0.015em; font-family: var(--sans);
    transition: opacity 0.1s; display: flex; align-items: center; gap: 5px;
  }
  .cp-gen-btn:hover:not(:disabled) { opacity: 0.82; }
  .cp-gen-btn:disabled { background: var(--g100); color: var(--g400); cursor: not-allowed; }
`;

function fmt(cents: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: 0 }).format(cents / 100);
}
function fmtK(cents: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(cents / 100);
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
function fmtDaysAgo(days: number | undefined | null): string {
  if (days === undefined || days === null) return "—";
  if (days === 999) return "No history";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}
function inits(name: string, email: string) {
  const n = name?.trim();
  if (n) { const p = n.split(" "); return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : n.slice(0, 2).toUpperCase(); }
  return (email ?? "?").slice(0, 2).toUpperCase();
}

function getRisk(level: string) {
  if (level === "high" || level === "critical") return { label: "High risk", dot: "#ef4444", color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" };
  if (level === "medium") return { label: "Review", dot: "#f59e0b", color: "#92400e", bg: "#fffbeb", border: "#fde68a" };
  return { label: "Healthy", dot: "#22c55e", color: "#15803d", bg: "#f0fdf4", border: "#d1fae5" };
}
function getStatusStyle(status: string) {
  if (status === "paid")          return { bg: "#f0fdf4", color: "#15803d", border: "#d1fae5" };
  if (status === "open")          return { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" };
  if (status === "uncollectible") return { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" };
  return { bg: "#f5f5f5", color: "#6b7280", border: "#e5e5e5" };
}
function getCategoryStyle(cat: string) {
  if (cat === "critical")  return { label: "Critical",  dot: "#ef4444", color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" };
  if (cat === "high_risk") return { label: "High risk", dot: "#f97316", color: "#9a3412", bg: "#fff7ed", border: "#fed7aa" };
  if (cat === "watch")     return { label: "Watch",     dot: "#f59e0b", color: "#92400e", bg: "#fffbeb", border: "#fde68a" };
  return                          { label: "Healthy",   dot: "#22c55e", color: "#15803d", bg: "#f0fdf4", border: "#d1fae5" };
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
  return v ? <span style={{ color: "#ef4444", fontWeight: 600 }}>Yes</span> : <span style={{ color: "#22c55e", fontWeight: 600 }}>No</span>;
}

function Spinner({ size = 14 }: { size?: number }) {
  return <div style={{ width: size, height: size, border: "1.5px solid #e5e5e5", borderTopColor: "#6b7280", borderRadius: "50%", flexShrink: 0, animation: "cp-spin 0.6s linear infinite" }} />;
}

function ScoreRing({ score }: { score: number }) {
  const r = 26, circ = 2 * Math.PI * r;
  const color = getScoreColor(score);
  return (
    <div className="cp-score-ring">
      <svg width="68" height="68" viewBox="0 0 68 68" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="34" cy="34" r={r} fill="none" stroke="#f0f0f0" strokeWidth="4.5" />
        <circle cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="4.5"
          strokeDasharray={`${(score / 100) * circ} ${circ - (score / 100) * circ}`}
          strokeLinecap="round" style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 18, fontWeight: 400, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 7.5, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>score</span>
      </div>
    </div>
  );
}

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

function SignalSection({ title, source, rows }: {
  title: string; source: "stripe" | "hubspot";
  rows: { key: string; value: React.ReactNode; flag?: boolean }[];
}) {
  return (
    <div className="cp-risk-card">
      <div className="cp-risk-card-header">
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "#111", letterSpacing: "-0.02em" }}>{title}</span>
        <span className={`cp-source ${source}`}>{source}</span>
      </div>
      {rows.map((row, i) => (
        <div className="cp-signal-row" key={i}>
          <span style={{ fontSize: 12, color: "#6b7280", letterSpacing: "-0.01em" }}>{row.key}</span>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: row.flag ? "#ef4444" : "#111", letterSpacing: "-0.015em", textAlign: "right" as const }}>
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function RiskSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "20px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px", background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12 }}>
        <div className="cp-shimmer" style={{ width: 68, height: 68, borderRadius: "50%" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
          <div className="cp-shimmer" style={{ height: 14, width: "30%" }} />
          <div className="cp-shimmer" style={{ height: 10, width: "20%" }} />
          <div className="cp-shimmer" style={{ height: 10, width: "25%" }} />
        </div>
        <div className="cp-shimmer" style={{ height: 28, width: 80, borderRadius: 99 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, overflow: "hidden" }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ padding: "18px 20px", borderRight: i < 3 ? "1px solid #f5f5f5" : "none" }}>
            <div className="cp-shimmer" style={{ height: 8, width: "55%", marginBottom: 10 }} />
            <div className="cp-shimmer" style={{ height: 22, width: "55%", marginBottom: 7 }} />
            <div className="cp-shimmer" style={{ height: 8, width: "40%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

const DRAFT_TYPES = [
  { id: "payment_reminder",     label: "Reminder" },
  { id: "overdue_followup",     label: "Follow-up" },
  { id: "relationship_checkin", label: "Check-in" },
  { id: "custom",               label: "Custom" },
] as const;

function ComposeModal({ email, onClose }: { email: string; onClose: () => void }) {
  const dispatch = useDispatch<AppDispatch>();
  const { draft, draftLoading, draftError, sendLoading, sendError, sendSuccess, sentMessageId } = useSelector((s: RootState) => s.customer);
  const [selectedType, setSelectedType]           = useState<string>("payment_reminder");
  const [customInstruction, setCustomInstruction] = useState("");
  const [editSubject, setEditSubject]             = useState("");
  const [editBody, setEditBody]                   = useState("");
  const [confirmSend, setConfirmSend]             = useState(false);

  useEffect(() => { if (draft) { setEditSubject(draft.subject ?? ""); setEditBody(draft.body ?? ""); } }, [draft]);
  useEffect(() => {
    if (sendSuccess) { const t = setTimeout(() => { dispatch(clearSendStatus()); onClose(); }, 2200); return () => clearTimeout(t); }
  }, [sendSuccess, dispatch, onClose]);

  const handleGenerate = () => {
    dispatch(draftCustomerEmail({ email, type: selectedType, customInstruction: selectedType === "custom" ? customInstruction : undefined }));
    setConfirmSend(false);
  };
  const handleSend = () => {
    dispatch(sendCustomerEmail({ email, subject: editSubject, body: editBody }));
    setConfirmSend(false);
  };

  const canSend = !!(editSubject && editBody && !sendLoading);

  return (
    <div className="cp-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cp-compose">

        {/* Header */}
        <div className="cp-compose-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M1.5 7L12.5 2.5 8 12.5 7 7.5 1.5 7z" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111", letterSpacing: "-0.025em", lineHeight: 1.2 }}>
                {draft ? `Re: ${editSubject || "Draft"}` : "New message"}
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>Compose & send via Gmail</div>
            </div>
          </div>
          <button className="cp-close-btn" onClick={onClose}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Fields */}
        <div style={{ borderBottom: "1px solid #f0f0f0" }}>
          <div className="cp-compose-field">
            <span className="cp-compose-label">To</span>
            <span style={{ fontSize: 13, color: "#111", padding: "10px 14px 10px 0", flex: 1, fontWeight: 400 }}>{email}</span>
          </div>
          <div className="cp-compose-field">
            <span className="cp-compose-label">Subject</span>
            <input
              className="cp-compose-input"
              placeholder="Subject line…"
              value={editSubject}
              onChange={e => setEditSubject(e.target.value)}
            />
          </div>
        </div>

        {/* Body */}
        <textarea
          className="cp-compose-body"
          placeholder="Write your message, or generate an AI draft below…"
          value={editBody}
          onChange={e => setEditBody(e.target.value)}
        />

        {/* Footer */}
        <div style={{ borderTop: "1px solid #f0f0f0", padding: "12px 18px", background: "#fff", display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>

          {/* Draft type pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" as const }}>
            <span style={{ fontSize: 11, color: "#bbb", marginRight: 2, letterSpacing: "-0.01em" }}>AI draft:</span>
            {DRAFT_TYPES.map(t => (
              <button key={t.id} className={`cp-dtype${selectedType === t.id ? " active" : ""}`} onClick={() => setSelectedType(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {selectedType === "custom" && (
            <input
              className="cp-compose-input"
              style={{ border: "1px solid #e8e8e8", borderRadius: 7, padding: "7px 11px", fontSize: 12, width: "100%" }}
              placeholder="Describe what you want the AI to write…"
              value={customInstruction}
              onChange={e => setCustomInstruction(e.target.value)}
            />
          )}

          {/* Errors / Success */}
          {draftError && (
            <div style={{ fontSize: 11.5, color: "#b91c1c", padding: "7px 10px", background: "#fef2f2", borderRadius: 6, border: "1px solid #fecaca" }}>{draftError}</div>
          )}
          {sendError && (
            <div style={{ fontSize: 11.5, color: "#b91c1c", padding: "7px 10px", background: "#fef2f2", borderRadius: 6, border: "1px solid #fecaca" }}>{sendError}</div>
          )}
          {sendSuccess && (
            <div style={{ fontSize: 12, color: "#15803d", padding: "8px 12px", background: "#f0fdf4", borderRadius: 7, border: "1px solid #d1fae5", display: "flex", alignItems: "center", gap: 7 }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.5L5.5 10.5L11.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Sent successfully{sentMessageId ? ` · ${sentMessageId.slice(0, 14)}…` : ""}
            </div>
          )}

          {/* Actions row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="cp-gen-btn" onClick={handleGenerate} disabled={draftLoading}>
                {draftLoading ? <><Spinner size={11} /> Generating…</> : (
                  <>
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M7 1v2M7 11v2M1 7h2M11 7h2M3.2 3.2l1.4 1.4M9.4 9.4l1.4 1.4M3.2 10.8l1.4-1.4M9.4 4.6l1.4-1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    Generate draft
                  </>
                )}
              </button>
              {(editSubject || editBody) && (
                <button
                  onClick={() => navigator.clipboard.writeText(`Subject: ${editSubject}\n\n${editBody}`)}
                  style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid #e8e8e8", background: "#fff", fontSize: 12.5, color: "#6b7280", cursor: "pointer", fontFamily: "var(--sans)", transition: "all 0.1s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#f5f5f5"; e.currentTarget.style.color = "#111"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#6b7280"; }}
                >
                  Copy
                </button>
              )}
            </div>

            {!confirmSend ? (
              <button className="cp-send-btn" onClick={() => setConfirmSend(true)} disabled={!canSend}>
                {sendLoading ? <><Spinner size={11} /> Sending…</> : (
                  <>
                    Send
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                      <path d="M1.5 7L12.5 2.5 8 12.5 7 7.5 1.5 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 12, color: "#374151", letterSpacing: "-0.01em" }}>
                  Send to <strong style={{ color: "#111" }}>{email.split("@")[0]}</strong>?
                </span>
                <button
                  onClick={() => setConfirmSend(false)}
                  style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e8e8e8", background: "#fff", fontSize: 12, color: "#6b7280", cursor: "pointer", fontFamily: "var(--sans)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={sendLoading}
                  style={{ padding: "5px 13px", borderRadius: 6, border: "none", background: "#111", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "var(--sans)" }}
                >
                  {sendLoading ? <><Spinner size={10} /> Sending…</> : "Confirm send"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InvoiceTable({ invoices, currency }: { invoices: CustomerInvoice[]; currency: string }) {
  if (!invoices.length) return <div style={{ padding: "48px 20px", textAlign: "center", fontSize: 13, color: "#9ca3af" }}>No invoices found.</div>;
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
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#111", letterSpacing: "-0.015em" }}>{inv.number ?? inv.id.slice(0, 10) + "…"}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{inv.created_fmt}</div>
                </td>
                <td>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, padding: "2px 7px", borderRadius: 5, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{inv.status}</span>
                  {inv.is_overdue && <div style={{ fontSize: 10.5, color: "#b91c1c", marginTop: 2, fontWeight: 500 }}>{inv.days_overdue}d overdue</div>}
                </td>
                <td><span style={{ fontSize: 13, fontWeight: 600, color: "#111", fontVariantNumeric: "tabular-nums" }}>{fmt(inv.amount_due, currency)}</span></td>
                <td><span style={{ fontSize: 13, color: "#16a34a", fontVariantNumeric: "tabular-nums" }}>{fmt(inv.amount_paid, currency)}</span></td>
                <td><span style={{ fontSize: 13, fontWeight: inv.amount_remaining > 0 ? 600 : 400, color: inv.amount_remaining > 0 ? "#b91c1c" : "#9ca3af", fontVariantNumeric: "tabular-nums" }}>{fmt(inv.amount_remaining, currency)}</span></td>
                <td>
                  <div style={{ fontSize: 12.5, color: inv.is_overdue ? "#b91c1c" : "#374151" }}>{inv.due_date_fmt}</div>
                  {inv.paid_at_fmt !== "—" && <div style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 2 }}>paid {inv.paid_at_fmt}</div>}
                </td>
                <td style={{ textAlign: "right" as const }}>
                  <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
                    {inv.invoice_pdf && <a href={inv.invoice_pdf} target="_blank" rel="noopener noreferrer" className="cp-inv-btn" style={{ background: "#fff", color: "#6b7280", border: "1px solid #e8e8e8" }}>PDF ↗</a>}
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

function EmailTimeline({ events }: { events: CustomerEmailEvent[] }) {
  if (!events.length) return <div style={{ padding: "48px 20px", textAlign: "center", fontSize: 13, color: "#9ca3af" }}>No email history found.</div>;
  const srcLabel: Record<string, { color: string; label: string }> = {
    hubspot: { color: "#c2410c", label: "HubSpot" },
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
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "#fff", border: "1px solid #e8e8e8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: "#111", letterSpacing: "-0.015em" }}>{label}</span>
                  <span style={{ fontSize: 10, fontWeight: 500, padding: "1px 5px", borderRadius: 3, border: "1px solid #e8e8e8", color: src.color, background: "#fff" }}>{src.label}</span>
                </div>
                <span style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>{fmtRel(ev.created)}</span>
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

function RiskIntelTab({ email }: { email: string }) {
  const riskDetail  = useSelector((s: RootState) => s.risk.detail);
  const riskLoading = useSelector((s: RootState) => s.risk.loadingDetail);
  const riskError   = useSelector((s: RootState) => s.risk.errorDetail);

  if (riskLoading) return <RiskSkeleton />;
  if (riskError) return <div style={{ padding: "14px", margin: "20px 0", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, color: "#b91c1c" }}>{riskError}</div>;
  if (!riskDetail) return <div style={{ padding: "60px 20px", textAlign: "center", fontSize: 13, color: "#9ca3af" }}>No risk data available.</div>;

  const cat    = getCategoryStyle(riskDetail.category);
  const maxPts = Math.max(...(riskDetail.breakdown ?? []).map((b: any) => b.points), 1);
  const stripe  = riskDetail.signals?.stripe  ?? {};
  const hubspot = riskDetail.signals?.hubspot ?? {};
  const totalAmountDue    = stripe.totalAmountDue   ?? 0;
  const daysOverdue       = stripe.daysOverdue       ?? 0;
  const paymentRate       = stripe.paymentSuccessRate ?? 1;
  const rawDaysSinceReply = hubspot.daysSinceLastReply;
  const daysSinceReply    = (rawDaysSinceReply === 999 || rawDaysSinceReply == null) ? null : rawDaysSinceReply;
  const paymentRatePct    = Math.round(paymentRate * 100);
  const paymentRateColor  = paymentRate < 0.6 ? "#ef4444" : paymentRate < 0.85 ? "#f59e0b" : "#16a34a";
  const paymentRateSub    = paymentRate < 0.6 ? "poor history" : paymentRate < 0.85 ? "partial payer" : "reliable";
  const replyColor = daysSinceReply === null ? "#9ca3af" : daysSinceReply >= 14 ? "#ef4444" : "#16a34a";
  const replySub   = daysSinceReply === null ? "no email history" : daysSinceReply >= 14 ? "going silent" : "recently engaged";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "20px 0" }}>

      {/* Hero score card */}
      <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ height: 2, background: cat.dot }} />
        <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 20 }}>
          <ScoreRing score={riskDetail.score} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#111", letterSpacing: "-0.025em", lineHeight: 1.2 }}>{riskDetail.name || riskDetail.email}</div>
            {riskDetail.company && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{riskDetail.company}</div>}
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Scored {fmtRel(riskDetail.calculatedAt)}</div>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 99, background: cat.bg, color: cat.color, border: `1.5px solid ${cat.border}`, fontSize: 12, fontWeight: 700 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: cat.dot }} />
            {cat.label}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderTop: "1px solid #f5f5f5" }}>
          {[
            { label: "Amount due",   value: totalAmountDue > 0 ? fmtK(totalAmountDue) : "₹0", sub: totalAmountDue > 0 ? "outstanding" : "all clear", color: totalAmountDue > 0 ? "#111" : "#16a34a", flag: totalAmountDue > 50000 },
            { label: "Days overdue", value: daysOverdue > 0 ? `${daysOverdue}d` : "On time", sub: daysOverdue >= 30 ? "severely late" : daysOverdue >= 14 ? "late" : "in good standing", color: daysOverdue >= 30 ? "#ef4444" : daysOverdue >= 14 ? "#f97316" : "#16a34a", flag: daysOverdue >= 14 },
            { label: "Payment rate", value: `${paymentRatePct}%`, sub: paymentRateSub, color: paymentRateColor, flag: paymentRate < 0.7 },
            { label: "Last reply",   value: daysSinceReply === null ? "No data" : fmtDaysAgo(daysSinceReply), sub: replySub, color: replyColor, flag: daysSinceReply !== null && daysSinceReply >= 14 },
          ].map(({ label, value, sub, color, flag }, i) => (
            <div key={label} className="cp-kpi-tile" style={{ borderRight: i < 3 ? "1px solid #f5f5f5" : "none" }}>
              {flag && <div style={{ position: "absolute" as const, top: 9, right: 9, width: 5, height: 5, borderRadius: "50%", background: "#ef4444" }} />}
              <div style={{ fontSize: 9.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 7 }}>{label}</div>
              <div style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 22, fontWeight: 400, color, letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 4, letterSpacing: "-0.01em" }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Analysis */}
      {riskDetail.ai && (() => {
        const u = getUrgencyStyle(riskDetail.ai.urgency);
        return (
          <div style={{ background: "#0f1117", borderRadius: 12, overflow: "hidden", border: "1px solid #1e2433" }}>
            <div style={{ height: 2, background: "linear-gradient(90deg,#6366f1,#8b5cf6,#a78bfa)" }} />
            <div style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 99, padding: "3px 10px", fontSize: 10, fontWeight: 700, color: "#a5b4fc", letterSpacing: "0.07em", textTransform: "uppercase" as const }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#818cf8" }} />
                  AI Analysis
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, background: `${u.dot}20`, border: `1px solid ${u.dot}40`, fontSize: 10.5, fontWeight: 700, color: u.dot }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: u.dot }} />
                  {u.label}
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: "#475569", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 8 }}>Situation</div>
                <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.75, margin: 0, letterSpacing: "-0.01em" }}>{riskDetail.ai.situation}</p>
              </div>
              {riskDetail.ai.actions?.length > 0 && (
                <>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: "#475569", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 8 }}>Recommended actions</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {riskDetail.ai.actions.map((action: string, i: number) => (
                      <div key={i} className="cp-action-row">
                        <div style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, fontWeight: 800, color: "#a5b4fc" }}>{i + 1}</div>
                        <span style={{ fontSize: 12.5, color: "#94a3b8", lineHeight: 1.65, letterSpacing: "-0.01em" }}>{action}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Score breakdown */}
      {riskDetail.breakdown?.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: "1px solid #f5f5f5" }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#111", letterSpacing: "-0.02em" }}>Score breakdown</span>
            <span style={{ fontSize: 11, color: "#6b7280", background: "#f5f5f5", border: "1px solid #e8e8e8", padding: "2px 8px", borderRadius: 5 }}>{riskDetail.breakdown.length} signals</span>
          </div>
          {riskDetail.breakdown.slice().sort((a: any, b: any) => b.points - a.points).map((item: any, i: number) => {
            const barColor = item.points >= 20 ? "#ef4444" : item.points >= 10 ? "#f97316" : item.points >= 5 ? "#f59e0b" : "#22c55e";
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 18px", borderBottom: "1px solid #f9fafb", transition: "background 0.1s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <span className={`cp-source ${item.source}`} style={{ minWidth: 52, justifyContent: "center" }}>{item.source}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: "#111", letterSpacing: "-0.015em" }}>{item.signal}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{item.reason}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, width: 90 }}>
                  <div style={{ flex: 1, height: 3, borderRadius: 99, background: "#f0f0f0", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 99, background: barColor, width: `${(item.points / maxPts) * 100}%`, transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)" }} />
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: barColor, minWidth: 28, textAlign: "right" as const }}>+{item.points}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Signal sources */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
        {Object.keys(stripe).length > 0 && (
          <SignalSection title="Payment signals" source="stripe" rows={[
            { key: "Days overdue",          value: (stripe.daysOverdue ?? 0) > 0 ? `${stripe.daysOverdue} days` : "On time", flag: (stripe.daysOverdue ?? 0) >= 30 },
            { key: "Open invoices",         value: stripe.openInvoiceCount ?? 0, flag: (stripe.openInvoiceCount ?? 0) >= 3 },
            { key: "Total amount due",      value: fmtK(stripe.totalAmountDue ?? 0, "INR"), flag: (stripe.totalAmountDue ?? 0) > 50000 },
            { key: "Failed payment",        value: fmtBool(stripe.hasFailedPayment ?? false), flag: stripe.hasFailedPayment === true },
            { key: "Late payments (hist.)", value: stripe.previousLatePayments ?? 0, flag: (stripe.previousLatePayments ?? 0) >= 2 },
            { key: "Payment success rate",  value: stripe.paymentSuccessRate != null ? `${Math.round(stripe.paymentSuccessRate * 100)}%` : "—", flag: (stripe.paymentSuccessRate ?? 1) < 0.7 },
          ]} />
        )}
        {Object.keys(hubspot).length > 0 && (
          <SignalSection title="Engagement signals" source="hubspot" rows={[
            { key: "Lifecycle stage",  value: <span style={{ textTransform: "capitalize" }}>{hubspot.lifecycleStage || "—"}</span> },
            { key: "Days since reply", value: hubspot.daysSinceLastReply === 999 || hubspot.daysSinceLastReply == null ? "No history" : fmtDaysAgo(hubspot.daysSinceLastReply), flag: hubspot.daysSinceLastReply != null && hubspot.daysSinceLastReply < 999 && hubspot.daysSinceLastReply >= 14 },
            { key: "Never replied",    value: fmtBool(hubspot.openedButNeverReplied ?? false), flag: hubspot.openedButNeverReplied === true },
            { key: "Ignored emails",   value: hubspot.totalIgnoredEmails ?? 0, flag: (hubspot.totalIgnoredEmails ?? 0) >= 3 },
            { key: "Active meeting",   value: fmtBool(hubspot.hasActiveMeeting ?? false) },
          ]} />
        )}
      </div>
    </div>
  );
}

type TabId = "invoices" | "emails" | "contact" | "risk";

export default function CustomerProfile() {
  const dispatch   = useDispatch<AppDispatch>();
  const email      = useSelector((s: RootState) => s.ui.selectedCustomerEmail);
  const { profile, profileLoading, profileError } = useSelector((s: RootState) => s.customer);
  const riskDetail = useSelector((s: RootState) => s.risk.detail);

  const [tab, setTab]             = useState<TabId>("invoices");
  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(() => {
    if (email) { dispatch(loadCustomerProfile(email)); dispatch(clearDetail()); dispatch(loadRiskDetail(email)); }
    return () => { dispatch(clearCustomer()); dispatch(clearDetail()); };
  }, [email, dispatch]);

  if (!email) return null;

  const contact  = profile?.contact;
  const summary  = profile?.summary;
  const currency = summary?.currency ?? profile?.invoices?.[0]?.currency ?? "INR";
  const risk     = getRisk(summary?.risk_level ?? "medium");
  const name     = contact ? `${contact.firstname ?? ""} ${contact.lastname ?? ""}`.trim() || email : email;

  return (
    <div className="cp">
      <style>{css}</style>

      {/* ── Top bar ── */}
      <div style={{
        height: 48, borderBottom: "1px solid #e8e8e8",
        display: "flex", alignItems: "center",
        padding: "0 24px", gap: 12, flexShrink: 0,
        background: "#fff", position: "sticky", top: 0, zIndex: 20,
      }}>
        <button className="cp-back" onClick={() => dispatch(closeCustomer())}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Clients
        </button>

        <div style={{ width: 1, height: 16, background: "#e8e8e8" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "#f5f5f5", border: "1px solid #e8e8e8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: "#374151", flexShrink: 0 }}>
            {inits(name, email)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#111", letterSpacing: "-0.02em", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{name}</div>
            {contact?.company && <div style={{ fontSize: 11, color: "#9ca3af" }}>{contact.company}</div>}
          </div>
        </div>

        {summary && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 5, background: risk.bg, color: risk.color, border: `1px solid ${risk.border}`, letterSpacing: "-0.01em", flexShrink: 0 }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: risk.dot }} />
            {risk.label}
          </span>
        )}

        {riskDetail && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", flexShrink: 0 }}>
            <span style={{ fontSize: 8.5, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>AI</span>
            {riskDetail.score}
          </span>
        )}

        <div style={{ flex: 1 }} />

        <button
          onClick={() => setComposeOpen(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 30, padding: "0 13px", borderRadius: 7, border: "none", background: "#111", color: "#fff", fontSize: 12.5, fontWeight: 500, cursor: "pointer", letterSpacing: "-0.01em", transition: "opacity 0.1s", fontFamily: "var(--sans)" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.82"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
            <path d="M1.5 7L12.5 2.5 8 12.5 7 7.5 1.5 7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
          </svg>
          Compose
        </button>
      </div>

      {/* ── Body ── */}
      <div className="cp-scroll" style={{ flex: 1, overflowY: "auto", padding: "24px 24px 80px" }}>
        {profileLoading && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 280, gap: 8, color: "#9ca3af", fontSize: 13 }}>
            <Spinner size={14} /> Loading profile…
          </div>
        )}

        {profileError && !profileLoading && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, color: "#b91c1c" }}>{profileError}</div>
        )}

        {profile && !profileLoading && (
          <div className="cp-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                { label: "Outstanding",    val: fmtK(summary?.total_due ?? 0, currency),     hint: `${summary?.unpaid_count ?? 0} unpaid` },
                { label: "Collected",      val: fmtK(summary?.total_paid ?? 0, currency),     hint: "all time" },
                { label: "Total invoiced", val: fmtK(summary?.total_invoiced ?? 0, currency), hint: "lifetime" },
                { label: "Overdue",        val: String(summary?.overdue_count ?? 0),          hint: "invoices past due" },
              ].map(({ label, val, hint }) => (
                <div key={label} className="cp-stat-card">
                  <div style={{ fontSize: 9.5, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10 }}>{label}</div>
                  <div style={{ fontFamily: "'Instrument Serif',Georgia,serif", fontSize: 28, fontWeight: 400, color: "#111", lineHeight: 1, letterSpacing: "-0.02em" }}>{val}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{hint}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ border: "1px solid #e8e8e8", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #e8e8e8", padding: "0 20px" }}>
                {([
                  { id: "invoices", label: "Invoices",  count: profile.invoices.length },
                  { id: "contact",  label: "Contact" },
                  { id: "risk",     label: "Risk Intel", isAI: true },
                ] as { id: TabId; label: string; count?: number; isAI?: boolean }[]).map(t => (
                  <button key={t.id} className={`cp-tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
                    {t.isAI && (
                      <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.06em", color: tab === t.id ? "#1d4ed8" : "#9ca3af", background: tab === t.id ? "#eff6ff" : "#f5f5f5", border: `1px solid ${tab === t.id ? "#bfdbfe" : "#e8e8e8"}`, padding: "1px 4px", borderRadius: 3, textTransform: "uppercase" as const }}>AI</span>
                    )}
                    {t.isAI ? (riskDetail ? `Risk · ${riskDetail.score}` : "Risk Intel") : t.label}
                    {t.count !== undefined && (
                      <span style={{ fontSize: 10.5, fontWeight: 500, color: tab === t.id ? "#374151" : "#9ca3af", background: tab === t.id ? "#f5f5f5" : "transparent", border: `1px solid ${tab === t.id ? "#e8e8e8" : "transparent"}`, padding: "0 5px", borderRadius: 3, lineHeight: "16px" }}>
                        {t.count}
                      </span>
                    )}
                  </button>
                ))}
                <div style={{ flex: 1 }} />
                {summary?.last_payment_date && (
                  <span style={{ fontSize: 11.5, color: "#9ca3af", letterSpacing: "-0.01em" }}>
                    Last payment {fmtRel(summary.last_payment_date)}
                  </span>
                )}
              </div>

              {tab === "invoices" && <InvoiceTable invoices={profile.invoices} currency={currency} />}
              {tab === "emails"   && <div style={{ padding: "0 20px" }}><EmailTimeline events={profile.emailEvents} /></div>}
              {tab === "contact"  && (
                <div style={{ padding: "20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { label: "Email",          value: contact?.email ?? email },
                      { label: "Company",        value: contact?.company ?? "—" },
                      { label: "Lifecycle",      value: contact?.lifecyclestage ?? "—" },
                      { label: "In HubSpot",     value: contact ? "Yes" : "No" },
                      { label: "HS Created",     value: contact?.createdate ? fmtDate(contact.createdate) : "—" },
                      { label: "Customer since", value: summary?.last_payment_date ? fmtDate(summary.last_payment_date) : "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className="cp-field-card">
                        <div style={{ fontSize: 9.5, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#111", letterSpacing: "-0.015em" }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {tab === "risk" && <div style={{ padding: "0 20px" }}><RiskIntelTab email={email} /></div>}
            </div>
          </div>
        )}
      </div>

      {/* ── Centered compose modal ── */}
      {composeOpen && <ComposeModal email={email} onClose={() => setComposeOpen(false)} />}
    </div>
  );
}