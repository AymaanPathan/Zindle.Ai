import React, {
  useEffect, useMemo, useState, useCallback,
} from "react";
import ReactFlow, {
  Background, Controls,
  useNodesState, useEdgesState,
  MarkerType, Handle, Position,
  type NodeProps, type Edge, type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import { loadJourney, clearJourney } from "../../store/slices/journeySlice";

const G = {
  white:  "#ffffff",
  g50:    "#fafafa",
  g100:   "#f5f5f7",
  g200:   "#e8e8ed",
  g300:   "#d1d1d6",
  g400:   "#9ca3af",
  g500:   "#6b7280",
  g600:   "#4b5563",
  g700:   "#374151",
  g900:   "#111827",
  sans:   "'Geist', -apple-system, system-ui, sans-serif",
};

const SRC: Record<string, { dot: string; label: string; bg: string }> = {
  stripe:  { dot: "#635bff", label: "Stripe",  bg: "#f0f0ff" },
  resend:  { dot: "#111827", label: "Resend",  bg: "#f3f4f6" },
  hubspot: { dot: "#ff7a59", label: "HubSpot", bg: "#fff3ef" },
};

const EVENT_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  invoice_created:        { icon: "□", color: "#374151", bg: "#f3f4f6" },
  invoice_sent:           { icon: "↑", color: "#2563eb", bg: "#eff6ff" },
  invoice_paid:           { icon: "✓", color: "#16a34a", bg: "#f0fdf4" },
  invoice_overdue:        { icon: "⚠", color: "#d97706", bg: "#fffbeb" },
  invoice_partially_paid: { icon: "◑", color: "#d97706", bg: "#fffbeb" },
  email_sent:             { icon: "→", color: "#6b7280", bg: "#f9fafb" },
  email_delivered:        { icon: "◎", color: "#16a34a", bg: "#f0fdf4" },
  email_clicked:          { icon: "◉", color: "#2563eb", bg: "#eff6ff" },
  email_opened:           { icon: "◈", color: "#7c3aed", bg: "#f5f3ff" },
  email_bounced:          { icon: "✕", color: "#dc2626", bg: "#fef2f2" },
  follow_up_sent:         { icon: "↻", color: "#0891b2", bg: "#ecfeff" },
  contact_created:        { icon: "○", color: "#6b7280", bg: "#f9fafb" },
  deal_closed:            { icon: "★", color: "#16a34a", bg: "#f0fdf4" },
  payment_failed:         { icon: "✕", color: "#dc2626", bg: "#fef2f2" },
  ghosted:                { icon: "…", color: "#9ca3af", bg: "#f9fafb" },
};

const STATUS_COLOR: Record<string, string> = {
  paid:      "#16a34a",
  delivered: "#16a34a",
  clicked:   "#2563eb",
  opened:    "#7c3aed",
  failed:    "#dc2626",
  bounced:   "#dc2626",
  overdue:   "#d97706",
  sent:      "#6b7280",
  created:   "#6b7280",
  completed: "#16a34a",
  ghosted:   "#9ca3af",
  pending:   "#d97706",
  warning:   "#d97706",
};

const f = {
  money: (c: number) => new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(c / 100),
  pct:  (n: number) => `${Math.round(n * 100)}%`,
  dt:   (ts?: string) => ts
    ? new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—",
  date: (ts?: string) => ts
    ? new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "—",
  time: (ts?: string) => ts
    ? new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "—",
  dateShort: (ts?: string) => ts
    ? new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—",
  rel: (a?: string, b?: string) => {
    if (!a || !b) return "";
    const m = Math.round(Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 60000);
    return m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`;
  },
};

function tsv(ts?: string) {
  if (!ts) return Number.MAX_SAFE_INTEGER;
  const v = new Date(ts).getTime();
  return isNaN(v) ? Number.MAX_SAFE_INTEGER : v;
}
function srcCfg(s: string) { return SRC[s as keyof typeof SRC] ?? SRC.stripe; }
function evtCfg(type: string) { return EVENT_CONFIG[type] ?? { icon: "·", color: G.g500, bg: "#f5f5f7" }; }

// ─── Event Node ────────────────────────────────────────────────────────────────
function EventNode({ data }: NodeProps) {
  const { event, selected, onClick } = data;
  const s = srcCfg(event.source);
  const ec = evtCfg(event.type);
  const [hov, setHov] = useState(false);
  const amt = event.metadata?.amountDue ?? event.metadata?.amountPaid;
  const statusColor = STATUS_COLOR[event.status] ?? G.g500;
  const isSelected = selected;

  return (
    <>
      <Handle type="target" position={Position.Left}
        style={{ opacity: 0, width: 10, height: 10, left: -5, background: "transparent", border: "none" }}
      />
      <div
        onClick={() => onClick(event)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: 220,
          background: isSelected ? G.g900 : G.white,
          border: `1.5px solid ${isSelected ? G.g900 : hov ? G.g300 : G.g200}`,
          borderRadius: 12,
          cursor: "pointer",
          fontFamily: G.sans,
          transition: "all 0.15s ease",
          transform: hov && !isSelected ? "translateY(-3px)" : "none",
          boxShadow: isSelected
            ? "0 8px 32px rgba(0,0,0,0.2)"
            : hov
            ? "0 4px 16px rgba(0,0,0,0.08)"
            : "0 1px 4px rgba(0,0,0,0.04)",
          overflow: "hidden",
          userSelect: "none",
        }}
      >
        <div style={{ height: 3, background: s.dot, flexShrink: 0 }} />

        <div style={{ padding: "10px 12px 12px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: isSelected ? "rgba(255,255,255,0.14)" : ec.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, color: isSelected ? G.white : ec.color, fontWeight: 700,
              border: `1px solid ${isSelected ? "rgba(255,255,255,0.1)" : G.g200}`,
            }}>
              {ec.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12.5, fontWeight: 600, lineHeight: 1.3,
                color: isSelected ? G.white : G.g900, letterSpacing: "-0.02em",
                overflow: "hidden", textOverflow: "ellipsis",
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
              }}>
                {event.label}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                <div style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: isSelected ? "rgba(255,255,255,0.5)" : s.dot, flexShrink: 0,
                }} />
                <span style={{ fontSize: 10, color: isSelected ? "rgba(255,255,255,0.45)" : G.g400, letterSpacing: "0.02em" }}>
                  {s.label}
                </span>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: isSelected ? "rgba(255,255,255,0.08)" : G.g200, marginBottom: 8 }} />

          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
              <rect x="0.5" y="1.5" width="9" height="8" rx="1.5"
                stroke={isSelected ? "rgba(255,255,255,0.35)" : G.g400} strokeWidth="0.8" fill="none" />
              <line x1="3" y1="0.5" x2="3" y2="2.5"
                stroke={isSelected ? "rgba(255,255,255,0.35)" : G.g400} strokeWidth="0.8" strokeLinecap="round" />
              <line x1="7" y1="0.5" x2="7" y2="2.5"
                stroke={isSelected ? "rgba(255,255,255,0.35)" : G.g400} strokeWidth="0.8" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 10.5, color: isSelected ? "rgba(255,255,255,0.5)" : G.g500, letterSpacing: "0.01em" }}>
              {f.dateShort(event.timestamp)}
            </span>
            <span style={{ fontSize: 10, color: isSelected ? "rgba(255,255,255,0.3)" : G.g300 }}>·</span>
            <span style={{ fontSize: 10.5, color: isSelected ? "rgba(255,255,255,0.4)" : G.g400 }}>
              {f.time(event.timestamp)}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 100,
              background: isSelected ? "rgba(255,255,255,0.1)" : statusColor + "15",
              color: isSelected ? "rgba(255,255,255,0.7)" : statusColor,
              border: `1px solid ${isSelected ? "rgba(255,255,255,0.08)" : statusColor + "25"}`,
              textTransform: "capitalize" as const, whiteSpace: "nowrap" as const,
            }}>
              {event.status}
            </span>
            {amt != null && amt > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: isSelected ? "rgba(255,255,255,0.85)" : G.g700,
                letterSpacing: "-0.02em", flexShrink: 0,
              }}>
                {f.money(amt)}
              </span>
            )}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right}
        style={{ opacity: 0, width: 10, height: 10, right: -5, background: "transparent", border: "none" }}
      />
    </>
  );
}

function LaneRule({ data }: NodeProps) {
  return (
    <div style={{ width: data.width, height: 1, background: G.g200, pointerEvents: "none" }} />
  );
}

const nodeTypes = { eventNode: EventNode, laneRule: LaneRule };

function buildGraph(events: any[], selectedId: string | null, onClick: (ev: any) => void) {
  const LANES   = ["stripe", "resend", "hubspot"];
  const NODE_W  = 220;
  const NODE_H  = 118;
  const COL_GAP = 56;
  const LANE_H  = NODE_H + 80;
  const PAD_X   = 72;
  const PAD_Y   = 40;
  const COL_W   = NODE_W + COL_GAP;

  const sorted = [...events].sort((a, b) => tsv(a.timestamp) - tsv(b.timestamp));
  const byLane: Record<string, any[]> = {};
  LANES.forEach((l) => { byLane[l] = []; });
  sorted.forEach((ev) => {
    const lane = LANES.includes(ev.source) ? ev.source : LANES[0];
    byLane[lane].push(ev);
  });

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const maxCols = Math.max(...LANES.map((l) => byLane[l].length), 1);
  const totalW  = PAD_X + maxCols * COL_W + 80;

  LANES.forEach((lane, li) => {
    const evs   = byLane[lane];
    const s     = srcCfg(lane);
    const laneY = PAD_Y + li * LANE_H;

    if (li > 0) {
      nodes.push({
        id: `__sep_${lane}`, type: "laneRule",
        position: { x: 0, y: laneY - 28 },
        data: { width: totalW + 200 },
        selectable: false, draggable: false,
      } as Node);
    }

    evs.forEach((ev, col) => {
      nodes.push({
        id: ev.id, type: "eventNode",
        position: { x: PAD_X + col * COL_W, y: laneY },
        data: { event: ev, selected: selectedId === ev.id, onClick },
      });
    });

    evs.forEach((ev, i) => {
      if (i === 0) return;
      const prev = evs[i - 1];
      const gap  = f.rel(prev.timestamp, ev.timestamp);
      edges.push({
        id: `${prev.id}→${ev.id}`,
        source: prev.id, target: ev.id, type: "straight",
        ...(gap ? {
          label: gap,
          labelStyle: { fontSize: 9, fill: G.g400, fontFamily: G.sans, fontWeight: 500 },
          labelBgStyle: { fill: G.white, fillOpacity: 1 },
          labelBgPadding: [4, 6] as [number, number],
          labelBgBorderRadius: 4,
        } : {}),
        style: { stroke: s.dot, strokeWidth: 1.5, strokeOpacity: 0.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: s.dot, width: 8, height: 8 },
      });
    });
  });

  return { nodes, edges };
}

// ─── Event detail panel ────────────────────────────────────────────────────────
function EventPanel({ event, patterns, onClose }: { event: any; patterns: any[]; onClose: () => void }) {
  const s  = srcCfg(event.source);
  const ec = evtCfg(event.type);
  const amt = event.metadata?.amountDue ?? event.metadata?.amountPaid;
  const related = patterns.filter((p) => (p.relatedEventIds ?? []).includes(event.id));
  const statusColor = STATUS_COLOR[event.status] ?? G.g500;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: G.sans, background: G.white }}>
      {/* Header */}
      <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${G.g200}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot }} />
            <span style={{ fontSize: 11, color: G.g400, fontWeight: 500 }}>{s.label}</span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, border: `1px solid ${G.g200}`, borderRadius: 7,
              background: G.white, color: G.g400, cursor: "pointer", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: G.sans, transition: "all 0.1s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = G.g50; e.currentTarget.style.color = G.g700; }}
            onMouseLeave={e => { e.currentTarget.style.background = G.white; e.currentTarget.style.color = G.g400; }}
          >×</button>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: ec.bg, border: `1px solid ${G.g200}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: ec.color, fontWeight: 700,
          }}>
            {ec.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: G.g900, letterSpacing: "-0.02em", lineHeight: 1.35, marginBottom: 4 }}>
              {event.label}
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 100,
              background: statusColor + "15", color: statusColor,
              border: `1px solid ${statusColor + "25"}`,
            }}>
              {event.status}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>

        {/* When */}
        <div style={{
          padding: "12px 14px", background: G.white, borderRadius: 10,
          border: `1px solid ${G.g200}`, marginBottom: 14,
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: G.g400, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 }}>
            When
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: G.g900, letterSpacing: "-0.02em" }}>
            {f.dateShort(event.timestamp)}
          </div>
          <div style={{ fontSize: 12, color: G.g500, marginTop: 2 }}>{f.time(event.timestamp)}</div>
        </div>

        {/* Amount */}
        {amt != null && amt > 0 && (
          <div style={{
            padding: "12px 14px", background: G.white, borderRadius: 10,
            border: `1px solid ${G.g200}`, marginBottom: 14,
            boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: G.g400, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 }}>
              Amount
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: G.g900, letterSpacing: "-0.04em" }}>
              {f.money(amt)}
            </div>
          </div>
        )}

        {/* Metadata */}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: G.g400, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>
              Event data
            </div>
            <div style={{ border: `1px solid ${G.g200}`, borderRadius: 10, overflow: "hidden" }}>
              {Object.entries(event.metadata).map(([k, v], i, arr) => (
                <div key={k} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 12px",
                  borderBottom: i < arr.length - 1 ? `1px solid ${G.g200}` : "none",
                  background: G.white,
                }}>
                  <span style={{ fontSize: 11.5, color: G.g500 }}>{k}</span>
                  <span style={{
                    fontSize: 11.5, fontWeight: 600, color: G.g700,
                    maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: "nowrap" as const,
                    fontFamily: typeof v === "string" && v.startsWith("in_") ? "monospace" : G.sans,
                  }}>
                    {typeof v === "number" && k.toLowerCase().includes("amount") ? f.money(v) : String(v ?? "—")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patterns */}
        {related.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: G.g400, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>
              Patterns triggered
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {related.map((p) => {
                const sevColor = p.severity === "critical" ? "#dc2626" : p.severity === "warning" ? "#d97706" : G.g400;
                return (
                  <div key={p.code} style={{ padding: "10px 12px", borderRadius: 9, background: sevColor + "08", border: `1px solid ${sevColor}20` }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: sevColor, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: G.g900, flex: 1 }}>{p.label}</span>
                      <span style={{
                        fontSize: 9.5, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
                        background: sevColor + "18", color: sevColor,
                        border: `1px solid ${sevColor}30`,
                        textTransform: "uppercase" as const, letterSpacing: "0.04em",
                      }}>
                        {p.severity}
                      </span>
                    </div>
                    <p style={{ fontSize: 11.5, color: G.g500, margin: 0, lineHeight: 1.6 }}>{p.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Event ID */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: G.g400, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 }}>
            Event ID
          </div>
          <div style={{
            fontSize: 10, color: G.g400, wordBreak: "break-all" as const, lineHeight: 1.6,
            fontFamily: "monospace", background: G.white, padding: "8px 12px",
            borderRadius: 8, border: `1px solid ${G.g200}`,
          }}>
            {event.id}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Insights drawer ───────────────────────────────────────────────────────────
function InsightsDrawer({ data, onClose }: { data: any; onClose: () => void }) {
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      background: G.white, borderTop: `1px solid ${G.g200}`,
      zIndex: 25, maxHeight: "40%",
      display: "flex", flexDirection: "column",
      animation: "sheetUp 0.18s ease",
      boxShadow: "0 -4px 24px rgba(0,0,0,0.06)",
      fontFamily: G.sans,
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 20px", borderBottom: `1px solid ${G.g200}`, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: G.g900, letterSpacing: "-0.01em" }}>Patterns</span>
          {data.patterns?.length > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 100,
              background: G.white, border: `1px solid ${G.g200}`, color: G.g500,
            }}>
              {data.patterns.length}
            </span>
          )}
        </div>
        <button onClick={onClose} style={{
          width: 26, height: 26, border: `1px solid ${G.g200}`, borderRadius: 6,
          background: G.white, color: G.g500, cursor: "pointer", fontSize: 15,
          display: "flex", alignItems: "center", justifyContent: "center", fontFamily: G.sans,
        }}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
        {data.patterns?.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
            {data.patterns.map((p: any, i: number) => {
              const sevColor = p.severity === "critical" ? "#dc2626" : p.severity === "warning" ? "#d97706" : G.g500;
              return (
                <div key={p.code} style={{
                  padding: "12px 14px", borderRadius: 10,
                  background: G.white, border: `1px solid ${G.g200}`,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                  animation: `tlFadeUp 0.2s ease ${i * 0.04}s both`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: sevColor, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: G.g900, flex: 1, letterSpacing: "-0.01em" }}>{p.label}</span>
                    <span style={{
                      fontSize: 9.5, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
                      background: sevColor + "18", color: sevColor,
                      border: `1px solid ${sevColor}30`,
                      textTransform: "uppercase" as const, letterSpacing: "0.05em",
                    }}>
                      {p.severity}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: G.g500, margin: 0, lineHeight: 1.65 }}>{p.description}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: G.g400 }}>No patterns detected.</p>
        )}
      </div>
    </div>
  );
}

// ─── Timeline ──────────────────────────────────────────────────────────────────
function Timeline({ events, selectedEvent, onEventClick }: {
  events: any[]; selectedEvent: any | null; onEventClick: (e: any | null) => void;
}) {
  const sorted = useMemo(() => [...events].sort((a, b) => tsv(a.timestamp) - tsv(b.timestamp)), [events]);
  const groups = useMemo(() => {
    const map = new Map<string, any[]>();
    sorted.forEach((ev) => {
      const key = f.date(ev.timestamp);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    });
    return Array.from(map.entries());
  }, [sorted]);

  return (
    <div style={{ flex: 1, overflowY: "auto", fontFamily: G.sans, background: G.white }}>
      {groups.map(([date, evs]) => (
        <div key={date}>
          {/* Date header — white with just a border, no gray fill */}
          <div style={{
            position: "sticky", top: 0, zIndex: 10,
            padding: "6px 20px",
            background: G.white,
            borderBottom: `1px solid ${G.g200}`,
            borderTop: `1px solid ${G.g200}`,
            fontSize: 11, fontWeight: 600, color: G.g400,
            letterSpacing: "0.06em", textTransform: "uppercase" as const,
          }}>
            {date}
          </div>

          {evs.map((ev) => {
            const s = srcCfg(ev.source);
            const ec = evtCfg(ev.type);
            const isSel = selectedEvent?.id === ev.id;
            const amt = ev.metadata?.amountDue ?? ev.metadata?.amountPaid;
            const statusColor = STATUS_COLOR[ev.status] ?? G.g500;

            return (
              <div
                key={ev.id}
                onClick={() => onEventClick(isSel ? null : ev)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "32px 1fr auto auto auto",
                  alignItems: "center", gap: "0 12px",
                  padding: "11px 20px",
                  background: isSel ? G.g50 : G.white,
                  borderBottom: `1px solid ${G.g200}`,
                  cursor: "pointer",
                  transition: "background 0.08s",
                  borderLeft: `2px solid ${isSel ? G.g900 : "transparent"}`,
                }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = G.g50; }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = G.white; }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: isSel ? G.g900 : ec.bg,
                  border: `1px solid ${isSel ? G.g900 : G.g200}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, color: isSel ? G.white : ec.color,
                  flexShrink: 0, transition: "all 0.15s",
                }}>
                  {ec.icon}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 500, color: G.g900, letterSpacing: "-0.015em",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
                  }}>
                    {ev.label}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: G.g400 }}>{s.label}</span>
                  </div>
                </div>

                <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                  {amt != null && amt > 0 ? (
                    <span style={{
                      fontSize: 12, fontWeight: 600, color: G.g700,
                      background: G.white, border: `1px solid ${G.g200}`,
                      padding: "2px 8px", borderRadius: 5,
                    }}>
                      {f.money(amt)}
                    </span>
                  ) : <span />}
                </div>

                <div style={{ flexShrink: 0 }}>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 100, fontWeight: 500,
                    background: statusColor + "14", color: statusColor,
                    border: `1px solid ${statusColor}28`, whiteSpace: "nowrap" as const,
                  }}>
                    {ev.status}
                  </span>
                </div>

                <div style={{ fontSize: 11, color: G.g400, flexShrink: 0, minWidth: 52, textAlign: "right" as const }}>
                  {f.time(ev.timestamp)}
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ height: 32 }} />
    </div>
  );
}

// ─── Header ────────────────────────────────────────────────────────────────────
function Header({ data, email, onBack }: { data: any; email: string; onBack: () => void }) {
  const riskCat = data?.riskCategory ?? "watch";
  const riskScore = data?.riskScore ?? null;
  const riskConfig: Record<string, { label: string; color: string }> = {
    healthy:   { label: "On track",  color: "#22c55e" },
    watch:     { label: "Review",    color: G.g500 },
    high_risk: { label: "High risk", color: "#d97706" },
    critical:  { label: "Critical",  color: "#dc2626" },
  };
  const risk = riskConfig[riskCat] ?? riskConfig.watch;

  return (
    <div style={{
      background: "rgba(255,255,255,0.96)", backdropFilter: "blur(20px)",
      borderBottom: `1px solid ${G.g200}`,
      height: 56, display: "flex", alignItems: "center",
      padding: "0 20px", gap: 14, flexShrink: 0, fontFamily: G.sans,
    }}>
      <button
        onClick={onBack}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          background: "none", border: "none", cursor: "pointer",
          fontSize: 13, fontWeight: 400, color: G.g500,
          fontFamily: G.sans, padding: 0, transition: "color 0.12s",
          flexShrink: 0, letterSpacing: "-0.01em",
        }}
        onMouseEnter={e => { e.currentTarget.style.color = G.g900; }}
        onMouseLeave={e => { e.currentTarget.style.color = G.g500; }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Clients
      </button>

      <div style={{ width: 1, height: 18, background: G.g200 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: G.white, border: `1px solid ${G.g200}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 600, color: G.g700,
        }}>
          {email[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: G.g900, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            {email.split("@")[0]}
          </div>
          <div style={{ fontSize: 10.5, color: G.g400 }}>{email}</div>
        </div>
      </div>

      {data && (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontSize: 12, fontWeight: 500, padding: "3px 9px", borderRadius: 100,
          background: risk.color + "12", border: `1px solid ${risk.color + "25"}`, color: risk.color,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: risk.color }} />
          {risk.label}
          {riskScore != null && <span style={{ opacity: 0.6, fontSize: 10.5 }}>· {riskScore}</span>}
        </span>
      )}

      {data && (
        <>
          <div style={{ width: 1, height: 18, background: G.g200 }} />
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { v: f.money(data.summary.totalDue),          l: "Due" },
              { v: String(data.summary.totalInvoices),      l: "Invoices" },
              { v: f.pct(data.summary.paymentSuccessRate),  l: "Paid" },
              { v: `${data.summary.daysSinceLastContact}d`, l: "Last contact" },
            ].map(({ v, l }) => (
              <div key={l}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: G.g900, letterSpacing: "-0.025em", lineHeight: 1.2 }}>{v}</div>
                <div style={{ fontSize: 10, color: G.g400 }}>{l}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Toolbar ───────────────────────────────────────────────────────────────────
type FilterSource = "all" | "stripe" | "resend" | "hubspot";

function Toolbar({
  tab, onTabChange, showInsights, onInsightsToggle,
  eventsCount, loading, onRefresh, patternCount, filterSource, onFilterSource,
}: {
  tab: "flow" | "timeline"; onTabChange: (t: "flow" | "timeline") => void;
  showInsights: boolean; onInsightsToggle: () => void;
  eventsCount: number; loading: boolean; onRefresh: () => void;
  patternCount: number; filterSource: FilterSource; onFilterSource: (s: FilterSource) => void;
}) {
  return (
    <div style={{
      background: G.white, borderBottom: `1px solid ${G.g200}`,
      height: 46, display: "flex", alignItems: "center",
      padding: "0 20px", gap: 8, flexShrink: 0, fontFamily: G.sans,
    }}>
      {/* Tab toggle — white base, selected gets dark */}
      <div style={{
        display: "flex", background: G.white, borderRadius: 9,
        border: `1px solid ${G.g200}`, padding: "3px", gap: 2,
      }}>
        {(["flow", "timeline"] as const).map((t) => (
          <button key={t} onClick={() => onTabChange(t)} style={{
            padding: "3px 14px", borderRadius: 7, border: "none",
            fontSize: 12.5, fontWeight: tab === t ? 600 : 400,
            color: tab === t ? G.white : G.g500,
            background: tab === t ? G.g900 : "transparent",
            cursor: "pointer", fontFamily: G.sans, transition: "all 0.15s",
            boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
          }}>
            {t === "flow" ? "Flow" : "Timeline"}
          </button>
        ))}
      </div>

      {tab === "timeline" && (
        <div style={{ display: "flex", gap: 2 }}>
          {(["all", "stripe", "resend", "hubspot"] as const).map((s) => {
            const isActive = filterSource === s;
            const dot = s !== "all" ? SRC[s].dot : null;
            return (
              <button key={s} onClick={() => onFilterSource(s)} style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "3px 10px", borderRadius: 6,
                border: `1px solid ${isActive ? G.g900 : G.g200}`,
                background: isActive ? G.g900 : G.white,
                color: isActive ? G.white : G.g500,
                fontSize: 11.5, fontWeight: 500, cursor: "pointer",
                fontFamily: G.sans, transition: "all 0.12s",
              }}>
                {dot && (
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: isActive ? G.white : dot, flexShrink: 0 }} />
                )}
                {s === "all" ? "All" : SRC[s].label}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {eventsCount > 0 && <span style={{ fontSize: 11, color: G.g400 }}>{eventsCount} events</span>}

      <button onClick={onInsightsToggle} style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "4px 11px", borderRadius: 7,
        border: `1px solid ${showInsights ? G.g900 : G.g200}`,
        background: showInsights ? G.g900 : G.white,
        color: showInsights ? G.white : G.g600,
        fontSize: 12.5, fontWeight: 500, cursor: "pointer",
        fontFamily: G.sans, transition: "all 0.15s",
      }}>
        Insights
        {patternCount > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 100,
            background: showInsights ? "rgba(255,255,255,0.18)" : G.white,
            border: `1px solid ${showInsights ? "rgba(255,255,255,0.25)" : G.g200}`,
            color: showInsights ? G.white : G.g500,
          }}>
            {patternCount}
          </span>
        )}
      </button>

      <button
        onClick={onRefresh}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "4px 11px", borderRadius: 7,
          border: `1px solid ${G.g200}`, background: G.white,
          fontSize: 12.5, fontWeight: 400, color: G.g500,
          cursor: "pointer", fontFamily: G.sans, transition: "all 0.12s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = G.g50; e.currentTarget.style.color = G.g900; }}
        onMouseLeave={e => { e.currentTarget.style.background = G.white; e.currentTarget.style.color = G.g500; }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }}>
          <path d="M1 6C1 3.24 3.24 1 6 1c1.5 0 2.85.6 3.84 1.57M11 6c0 2.76-2.24 5-5 5-1.5 0-2.85-.6-3.84-1.57"
            stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M9 2.5l.84-.57.93.57" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Refresh
      </button>
    </div>
  );
}

// ─── Loading ───────────────────────────────────────────────────────────────────
function Loading() {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 220, height: 118, borderRadius: 12,
            background: G.white, border: `1px solid ${G.g200}`,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            animation: `pulse 1.6s ease ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <span style={{ fontSize: 12, color: G.g400, fontFamily: G.sans }}>Building journey…</span>
    </div>
  );
}

function FlowEmpty() {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: G.g700 }}>No events yet</div>
      <div style={{ fontSize: 12, color: G.g400 }}>Events will appear here as activity is recorded.</div>
    </div>
  );
}

function LaneLegend() {
  return (
    <div style={{
      position: "absolute", left: 0, top: 0, bottom: 0, width: 52,
      display: "flex", flexDirection: "column", justifyContent: "flex-start",
      pointerEvents: "none", zIndex: 10, paddingTop: 40,
      background: "linear-gradient(to right, rgba(255,255,255,0.97) 65%, transparent)",
    }}>
      {(["stripe", "resend", "hubspot"] as const).map((lane, i) => {
        const s = SRC[lane];
        return (
          <div key={lane} style={{
            height: 198, display: "flex", alignItems: "center", justifyContent: "flex-start",
            paddingLeft: 10, borderTop: i > 0 ? `1px solid ${G.g200}` : "none",
          }}>
            <div style={{
              writingMode: "vertical-rl" as const, transform: "rotate(180deg)",
              fontSize: 9.5, fontWeight: 700, color: s.dot,
              letterSpacing: "0.14em", textTransform: "uppercase" as const, fontFamily: G.sans,
            }}>
              {s.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function JourneyView({ email, onClose }: { email: string; onClose: () => void }) {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector((s: RootState) => s.journey);

  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [tab, setTab] = useState<"flow" | "timeline">("timeline");
  const [filterSource, setFilterSource] = useState<FilterSource>("all");

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    dispatch(loadJourney(email));
    return () => { dispatch(clearJourney()); };
  }, [dispatch, email]);

  const handleNodeClick = useCallback((ev: any) => {
    setSelectedEvent((prev: any) => (prev?.id === ev.id ? null : ev));
  }, []);

  useEffect(() => {
    if (!data) return;
    const { nodes, edges } = buildGraph(data.events, selectedEvent?.id ?? null, handleNodeClick);
    setRfNodes(nodes);
    setRfEdges(edges);
  }, [data, selectedEvent?.id, handleNodeClick]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedEvent) setSelectedEvent(null);
        else if (showInsights) setShowInsights(false);
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [selectedEvent, showInsights]);

  const filteredEvents = useMemo(() => {
    if (!data) return [];
    if (filterSource === "all") return data.events;
    return data.events.filter((e: any) => e.source === filterSource);
  }, [data, filterSource]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');
        @keyframes panelIn  { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes sheetUp  { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes tlFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes pulse    { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

        .jv .react-flow__attribution { display: none; }
        .jv .react-flow__controls {
          background: #ffffff !important;
          border: 1px solid #e8e8ed !important;
          border-radius: 10px !important;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05) !important;
          overflow: hidden;
        }
        .jv .react-flow__controls-button {
          background: #ffffff !important;
          border-bottom: 1px solid #f5f5f7 !important;
          color: #6b7280 !important;
        }
        .jv .react-flow__controls-button:hover { background: #fafafa !important; }
        .jv .react-flow__edge-label { font-family: 'Geist', -apple-system, system-ui, sans-serif !important; }
        .jv .react-flow__minimap { border-radius: 10px !important; border: 1px solid #e8e8ed !important; overflow: hidden; }
      `}</style>

      <div style={{
        display: "flex", flexDirection: "column",
        height: "100%", width: "100%",
        background: G.white, fontFamily: G.sans, overflow: "hidden",
      }}>
        <Header data={data} email={email} onBack={onClose} />
        <Toolbar
          tab={tab}
          onTabChange={(t) => { setTab(t); setSelectedEvent(null); setFilterSource("all"); }}
          showInsights={showInsights}
          onInsightsToggle={() => { setShowInsights((o) => !o); setSelectedEvent(null); }}
          eventsCount={filteredEvents.length}
          loading={loading}
          onRefresh={() => dispatch(loadJourney(email))}
          patternCount={data?.patterns?.length ?? 0}
          filterSource={filterSource}
          onFilterSource={setFilterSource}
        />

        <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {loading && <div style={{ display: "flex", height: "100%" }}><Loading /></div>}

          {!loading && error && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: G.g900 }}>{error}</div>
              <div style={{ fontSize: 12, color: G.g400 }}>Check the API and try again.</div>
            </div>
          )}

          {/* Flow */}
          {data && tab === "flow" && (
            <div style={{ position: "absolute", inset: 0, display: "flex" }}>
              <div className="jv" style={{ flex: 1, position: "relative", marginRight: selectedEvent ? 320 : 0, transition: "margin-right 0.2s ease" }}>
                {data.events.length === 0 ? <FlowEmpty /> : (
                  <ReactFlow
                    nodes={rfNodes} edges={rfEdges}
                    onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView fitViewOptions={{ padding: 0.2 }}
                    minZoom={0.08} maxZoom={2}
                    proOptions={{ hideAttribution: true }}
                    style={{ background: G.white }}
                    onPaneClick={() => setSelectedEvent(null)}
                    elevateEdgesOnSelect
                    defaultEdgeOptions={{ zIndex: 1 }}
                  >
                    <Background variant={"dots" as any} color={G.g200} gap={24} size={1} style={{ backgroundColor: G.white }} />
                    <Controls showInteractive={false} position="bottom-right" />
                  </ReactFlow>
                )}
                <LaneLegend />
                <div style={{
                  position: "absolute", bottom: 16, left: 64,
                  display: "flex", gap: 12, zIndex: 10,
                  background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
                  border: `1px solid ${G.g200}`, borderRadius: 8, padding: "6px 12px",
                  pointerEvents: "none",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}>
                  {(["stripe", "resend", "hubspot"] as const).map((s) => (
                    <div key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: SRC[s].dot }} />
                      <span style={{ fontSize: 10.5, color: G.g600, fontFamily: G.sans, fontWeight: 500 }}>{SRC[s].label}</span>
                    </div>
                  ))}
                  <div style={{ width: 1, height: 12, background: G.g200, alignSelf: "center" }} />
                  <span style={{ fontSize: 10.5, color: G.g400, fontFamily: G.sans }}>Click a node for details</span>
                </div>
              </div>

              {selectedEvent && (
                <div style={{
                  position: "absolute", right: 0, top: 0, bottom: 0, width: 320,
                  borderLeft: `1px solid ${G.g200}`, background: G.white,
                  display: "flex", flexDirection: "column",
                  animation: "panelIn 0.18s ease", overflow: "hidden",
                  boxShadow: "-4px 0 20px rgba(0,0,0,0.05)", zIndex: 20,
                }}>
                  <EventPanel event={selectedEvent} patterns={data?.patterns ?? []} onClose={() => setSelectedEvent(null)} />
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          {data && tab === "timeline" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "row", overflow: "hidden" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <Timeline events={filteredEvents} selectedEvent={selectedEvent} onEventClick={setSelectedEvent} />
              </div>
              {selectedEvent && (
                <div style={{
                  width: 320, flexShrink: 0,
                  borderLeft: `1px solid ${G.g200}`, background: G.white,
                  display: "flex", flexDirection: "column",
                  animation: "panelIn 0.18s ease", overflow: "hidden",
                }}>
                  <EventPanel event={selectedEvent} patterns={data?.patterns ?? []} onClose={() => setSelectedEvent(null)} />
                </div>
              )}
            </div>
          )}

          {showInsights && data && <InsightsDrawer data={data} onClose={() => setShowInsights(false)} />}
        </div>
      </div>
    </>
  );
}