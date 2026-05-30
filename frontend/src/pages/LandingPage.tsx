"use client";
import React, { useState, useEffect, useRef } from "react";

interface LandingPageProps {
  onEnterApp: () => void;
}

// ─── Chat demo data ───────────────────────────────────────────────────────────
const CHAT_DEMO = [
  { role: "user", text: "Who should I prioritize calling today?" },
  { role: "ai", text: "**Call Acme Corp first** — ₹1,20,000 overdue, 18 days. Opened the invoice 5× but never replied. Based on their history, direct calls convert 3× better than email for them.\n\nNext up: Orbit Tech (₹1,85,000 · 12 days) and Nova LLC (₹48,500 · 7 days, engagement dropping fast)."},
  { role: "user", text: "Which invoices are close to ghosting?" },
  { role: "ai", text: "**3 invoices are high-risk right now:**\n\n1. Acme Corp — ₹1,20,000 · 18 days · 62% recovery\n2. Orbit Tech — ₹1,85,000 · 12 days · 58% recovery\n3. Nova LLC — ₹48,500 · 7 days · 74% recovery\n\nAll three show sharp engagement drops after the due date. Recommend outreach within 24h." },
  { role: "user", text: "Draft a follow-up email for Acme Corp" },
  { role: "ai", text: "**Draft ready:**\n\nSubject: Invoice #042 — Quick follow-up\n\nHi Rahul, following up on Invoice #042 for ₹1,20,000 due March 5. I noticed you've reviewed it a few times — happy to answer any questions or explore a payment plan.\n\nLet me know how to move forward." },
];

// ─── Inline bold renderer ─────────────────────────────────────────────────────
function InlineBold({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i} style={{ fontWeight: 600, color: "#0a0a0a" }}>{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}

function AiText({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {text.split("\n").filter(Boolean).map((line, i) => {
        if (/^\d+\./.test(line)) {
          return (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ width: 17, height: 17, borderRadius: 4, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600, color: "#666", flexShrink: 0, marginTop: 2 }}>{line.match(/^(\d+)/)?.[1]}</span>
              <span style={{ fontSize: 12.5, color: "#444", lineHeight: 1.6 }}><InlineBold text={line.replace(/^\d+\.\s*/, "")} /></span>
            </div>
          );
        }
        return <p key={i} style={{ margin: 0, fontSize: 12.5, color: "#444", lineHeight: 1.65 }}><InlineBold text={line} /></p>;
      })}
    </div>
  );
}

// ─── Tab 0: Collections AI Chat ───────────────────────────────────────────────
function ChatTabMockup() {
  const [visible, setVisible] = useState(0);
  const [playing, setPlaying] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setVisible(v => {
          if (v >= CHAT_DEMO.length) { setPlaying(false); return v; }
          return v + 1;
        });
      }, 1400);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [visible]);

  const handlePlay = () => {
    if (playing) { setPlaying(false); }
    else if (visible >= CHAT_DEMO.length) { setVisible(0); setTimeout(() => setPlaying(true), 80); }
    else { setPlaying(true); }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      {/* Chat window */}
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 460 }}>
        {/* Header */}
        <div style={{ padding: "11px 16px", background: "#fafaf9", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>iP</div>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.025em" }}>Collections AI</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "2px 7px", borderRadius: 5, background: "#fff", border: "1px solid var(--border)", fontSize: 10.5, color: "var(--ink-3)", fontWeight: 300 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", animation: "pulse 2.5s ease-in-out infinite" }} />
              Stripe · HubSpot
            </div>
          </div>
          <button
            onClick={handlePlay}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 13px", borderRadius: 7, border: playing ? "1px solid var(--border)" : "none", background: playing ? "var(--surface-3)" : "var(--ink)", color: playing ? "var(--ink-2)" : "#fff", fontSize: 12, fontWeight: 500, fontFamily: "var(--sans)", letterSpacing: "-0.01em", cursor: "pointer" }}
          >
            {playing ? "⏸ Pause" : visible >= CHAT_DEMO.length ? "↺ Replay" : "▶ Play demo"}
          </button>
        </div>

        {/* Messages */}
        <div ref={chatRef} style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", scrollBehavior: "smooth" }}>
          {visible === 0 && !playing && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px", textAlign: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 14, letterSpacing: "-0.04em" }}>ZD</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 8, fontStyle: "italic" }}>Ask anything.</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.65, fontWeight: 300, maxWidth: 220, marginBottom: 18 }}>Watch how Zindle's AI answers real collections questions in seconds.</div>
              <button onClick={handlePlay} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 20px", borderRadius: 8, border: "none", background: "var(--ink)", color: "#fff", fontSize: 12.5, fontWeight: 500, fontFamily: "var(--sans)", cursor: "pointer" }}>▶ Play demo</button>
            </div>
          )}

          {CHAT_DEMO.slice(0, visible).map((msg, idx) => (
            <div key={idx} style={{ animation: "msgin 0.22s cubic-bezier(.16,1,.3,1) both" }}>
              {msg.role === "user" ? (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ background: "var(--ink)", color: "#fff", padding: "9px 13px", borderRadius: "13px 3px 13px 13px", fontSize: 12.5, lineHeight: 1.6, maxWidth: "72%", fontWeight: 300 }}>{msg.text}</div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#fff", flexShrink: 0, marginTop: 2 }}>iP</div>
                  
                </div>
              )}
            </div>
          ))}

          {playing && visible < CHAT_DEMO.length && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", animation: "msgin 0.22s cubic-bezier(.16,1,.3,1) both" }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#fff", flexShrink: 0, marginTop: 2 }}>iP</div>
              <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: "10px 13px", borderRadius: "3px 13px 13px 13px", display: "flex", gap: 4, alignItems: "center" }}>
                {[0,1,2].map(i => <span key={i} style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "var(--ink-4)", animation: `tdot 1.1s ease-in-out ${i*0.18}s infinite` }} />)}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, background: "#fff" }}>
          <div style={{ flex: 1, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, color: "var(--ink-4)", fontFamily: "var(--sans)", fontWeight: 300 }}>Ask about customers, invoices, priorities…</div>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 10V2M2.5 5.5L6 2l3.5 3.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
      </div>

      {/* Right: suggested queries + features */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.025em", marginBottom: 4 }}>Business reasoning, not a chatbot</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.6, fontWeight: 300 }}>Ask operational questions across Stripe, HubSpot, and Gmail in plain English.</div>
          </div>
          <div style={{ padding: "10px 12px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: "var(--ink-4)", marginBottom: 8 }}>Try asking</div>
            {["Show highest revenue at risk this week", "Which invoices were reopened multiple times?", "Who pays late but always converts?", "What's our average recovery time?"].map((q, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, marginBottom: 5, background: "var(--surface-2)", border: "1px solid var(--border)", cursor: "pointer" }}>
                <span style={{ fontSize: 9, color: "var(--ink-4)" }}>✦</span>
                <span style={{ fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.4 }}>{q}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.025em", marginBottom: 12 }}>One-click actions from every answer</div>
          {[
            { icon: "✦", label: "Generate Email", desc: "Personalized from customer history", bg: "#f5f3ff", c: "#6d28d9" },
            { icon: "📤", label: "Send Now", desc: "One-click via Gmail or SMTP", bg: "#eff6ff", c: "#1e40af" },
            { icon: "📞", label: "Schedule Call", desc: "AI picks the optimal call time", bg: "#e8f5ee", c: "#1a7a4a" },
          ].map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 9, padding: "8px 10px", borderRadius: 8, marginBottom: 5, border: "1px solid var(--border)", background: "#fff", cursor: "pointer", transition: "background 0.1s" }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: a.bg, color: a.c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>{a.icon}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)" }}>{a.label}</div>
                <div style={{ fontSize: 10.5, color: "var(--ink-4)", marginTop: 1 }}>{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 1: Journey ───────────────────────────────────────────────────────────
function JourneyTabMockup() {
  const [selectedNode, setSelectedNode] = useState<number | null>(2);

  const nodes = [
    { icon: "★", label: "Deal Closed", sub: "Mar 2 · CRM synced", bg: "#e8f5ee", bc: "#27ae60", c: "#1a7a4a", status: "completed", src: "HubSpot", srcDot: "#ff7a59" },
    { icon: "📄", label: "Contract Signed", sub: "Mar 4 · DocuSign", bg: "#e8f5ee", bc: "#27ae60", c: "#1a7a4a", status: "completed", src: "HubSpot", srcDot: "#ff7a59" },
    { icon: "→", label: "Invoice Sent · ₹1,20,000", sub: "Mar 5 · via Stripe", bg: "#eff6ff", bc: "#3b82f6", c: "#1e40af", status: "sent", src: "Stripe", srcDot: "#635bff" },
    { icon: "◈", label: "Email Opened (3×)", sub: "Mar 8 — late night", bg: "#fef3c7", bc: "#f59e0b", c: "#b45309", status: "opened", src: "Resend", srcDot: "#111827" },
    { icon: "⚠", label: "No Reply · 18 days", sub: "High Risk — call recommended", bg: "#fef2f2", bc: "#ef4444", c: "#c0392b", status: "overdue", src: "Stripe", srcDot: "#635bff" },
    { icon: "↗", label: "Follow-up Sent", sub: "Mar 27 · AI-drafted", bg: "#f5f3ff", bc: "#8b5cf6", c: "#6d28d9", status: "sent", src: "Resend", srcDot: "#111827" },
  ];

  const detailNode = selectedNode !== null ? nodes[selectedNode] : null;

  const insights = [
    { bg: "#fef2f2", border: "#fee2e2", icon: "🕐", tag: "Behavior", c: "#c0392b", text: "Customer repeatedly opens invoices late night — try early morning outreach." },
    { bg: "#fef3c7", border: "#fde68a", icon: "📞", tag: "Channel", c: "#b45309", text: "Historically responds better to direct calls than email." },
    { bg: "#eff6ff", border: "#dbeafe", icon: "📉", tag: "Risk Signal", c: "#1e40af", text: "Engagement dropped after invoice amount increased by 40%." },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      {/* Left: Journey timeline */}
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", background: "#fafaf9", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.025em" }}>Acme Corp · Payment Journey</div>
            <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 1 }}>₹1,20,000 · Invoice #042 · 18 days overdue</div>
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {["Stripe", "Resend", "HubSpot"].map((src, i) => {
              const dots = ["#635bff", "#111827", "#ff7a59"];
              return (
                <div key={src} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 5, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: dots[i] }} />
                  <span style={{ fontSize: 10, color: "var(--ink-3)", fontWeight: 500 }}>{src}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {nodes.map((n, i) => {
            const isSel = selectedNode === i;
            return (
              <div key={i} style={{ position: "relative" }}>
                {i < nodes.length - 1 && (
                  <div style={{ position: "absolute", left: 14, top: 32, width: 1, height: "calc(100% - 6px)", background: "var(--border)", zIndex: 0 }} />
                )}
                <div
                  onClick={() => setSelectedNode(isSel ? null : i)}
                  style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px", borderRadius: 9, cursor: "pointer", background: isSel ? "var(--surface-2)" : "transparent", border: `1px solid ${isSel ? "var(--border-2)" : "transparent"}`, transition: "all 0.12s", position: "relative", zIndex: 1 }}
                >
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: isSel ? "var(--ink)" : n.bg, border: `1.5px solid ${isSel ? "var(--ink)" : n.bc}`, color: isSel ? "#fff" : n.c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0, marginTop: 1, transition: "all 0.12s" }}>{n.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.015em" }}>{n.label}</div>
                    <div style={{ fontSize: 10.5, color: "var(--ink-4)", marginTop: 1 }}>{n.sub}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: n.srcDot }} />
                    <span style={{ fontSize: 10, color: "var(--ink-4)" }}>{n.src}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ height: 10 }} />
      </div>

      {/* Right: Node detail + insights */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {detailNode && (
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", background: "#fafaf9", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: detailNode.bg, border: `1.5px solid ${detailNode.bc}`, color: detailNode.c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{detailNode.icon}</div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.02em" }}>{detailNode.label}</div>
                <div style={{ fontSize: 10.5, color: "var(--ink-4)" }}>{detailNode.sub}</div>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: detailNode.bg, color: detailNode.c, border: `1px solid ${detailNode.bc}` }}>{detailNode.status}</span>
            </div>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>AI Insights</div>
              {insights.slice(0, 2).map((ins, i) => (
                <div key={i} style={{ background: ins.bg, border: `1px solid ${ins.border}`, borderRadius: 8, padding: "9px 11px", marginBottom: 6 }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: ins.c, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}><span>{ins.icon}</span>{ins.tag}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.55 }}>{ins.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.025em", marginBottom: 4 }}>AI Insights at every node</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.6, fontWeight: 300 }}>Behavioral patterns, channel preferences, and risk signals — surfaced automatically.</div>
          </div>
          <div style={{ padding: "10px 14px 14px" }}>
            {insights.map((ins, i) => (
              <div key={i} style={{ background: ins.bg, border: `1px solid ${ins.border}`, borderRadius: 8, padding: "9px 11px", marginBottom: 6 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: ins.c, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}><span>{ins.icon}</span>{ins.tag}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.55 }}>{ins.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2: Activity feed ─────────────────────────────────────────────────────
function ActivityTabMockup() {
  const feedItems = [
    { dot: "#e74c3c", urgency: "Critical", title: "Acme Corp opened invoice 5× — never replied", sub: "₹1,20,000 · 18 days overdue · High risk", ai: "Direct call within 24h — responds 3× better to calls.", pct: "62%", pctClr: "#e74c3c", action: "Draft follow-up", time: "2m" },
    { dot: "#f39c12", urgency: "Watch", title: "Nova LLC stopped engaging after overdue", sub: "₹48,500 · 7 days overdue · Engagement dropped", ai: "Risk of ghosting rising. Outreach within 12h.", pct: "74%", pctClr: "#f39c12", action: "Schedule call", time: "14m" },
    { dot: "#27ae60", urgency: "Opportunity", title: "Zindle reopened payment link twice today", sub: "₹2,80,000 · Strong payment intent", ai: "High intent signal. Send a nudge now.", pct: "91%", pctClr: "#27ae60", action: "Send nudge", time: "31m" },
    { dot: "#f39c12", urgency: "Watch", title: "Orbit Tech email opened at 11:30 PM again", sub: "₹1,85,000 · 12 days overdue · Late-night pattern", ai: "Reach out tomorrow morning for best results.", pct: "58%", pctClr: "#f39c12", action: "Call AM", time: "1h" },
    { dot: "#27ae60", urgency: "Opportunity", title: "Zeta Retail clicked payment link", sub: "₹95,500 · 3 days overdue · High intent", ai: "Highest probability of payment if nudged today.", pct: "88%", pctClr: "#27ae60", action: "Nudge now", time: "2h" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      {/* Live feed */}
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 16px", background: "#fafaf9", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.025em" }}>Live Activity Feed</span>
          <span style={{ fontSize: 10.5, padding: "3px 8px", borderRadius: 5, background: "#e8f5ee", color: "#1a7a4a", border: "1px solid #c6e8d4", fontWeight: 500 }}>5 new signals</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {feedItems.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 16px", borderBottom: "1px solid #f5f5f3", cursor: "default", transition: "background 0.08s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#fafaf9")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: r.dot, flexShrink: 0, marginTop: 5 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 2 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: r.dot, textTransform: "uppercase", letterSpacing: "0.06em" }}>{r.urgency}</span>
                  <span style={{ fontSize: 9.5, color: "var(--ink-4)" }}>· {r.time}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)", lineHeight: 1.4, marginBottom: 2 }}>{r.title}</div>
                <div style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 5 }}>{r.sub}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 6, lineHeight: 1.5 }}>✦ {r.ai}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: r.pctClr }}>{r.pct} recovery</span>
                  <button style={{ padding: "2px 9px", borderRadius: 5, border: "1px solid var(--border)", background: "#fff", fontSize: 10.5, color: "var(--ink-3)", fontFamily: "var(--sans)", cursor: "pointer" }}>{r.action}</button>
                </div>
              </div>
              <span style={{ fontSize: 10.5, color: "var(--ink-5)", flexShrink: 0 }}>{r.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: risk types + stat */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.025em", marginBottom: 5 }}>Surface risks before they become losses</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.6, fontWeight: 300, marginBottom: 14 }}>Monitors Stripe, HubSpot, and Resend in real-time with AI explanations and recovery probability.</div>
          {[
            { icon: "⚡", bg: "#fef2f2", border: "#fee2e2", c: "#c0392b", t: "Payment risks", d: "Overdue spikes, failed charges, bounced payments" },
            { icon: "📉", bg: "#fef3c7", border: "#fde68a", c: "#b45309", t: "Engagement drops", d: "Email open rate decline, link click falloff" },
            { icon: "✅", bg: "#e8f5ee", border: "#c6e8d4", c: "#1a7a4a", t: "Recovery opportunities", d: "High payment intent signals worth acting on now" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 9, padding: "9px 10px", borderRadius: 8, marginBottom: 6, background: item.bg, border: `1px solid ${item.border}` }}>
              <span style={{ fontSize: 12, marginTop: 1 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: item.c, marginBottom: 2 }}>{item.t}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{item.d}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Mini stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "Recovery rate", val: "84%", sub: "this month", up: true },
            { label: "Avg response", val: "2.1d", sub: "after signal", up: false },
            { label: "At-risk value", val: "₹4.5L", sub: "active right now", up: false },
            { label: "Signals today", val: "23", sub: "across customers", up: true },
          ].map(({ label, val, sub, up }) => (
            <div key={label} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 14px" }}>
              <div style={{ fontSize: 9.5, fontWeight: 600, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 24, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: 10.5, color: up ? "#16a34a" : "var(--ink-4)", marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main landing page ────────────────────────────────────────────────────────
export default function LandingPage({ onEnterApp }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const tabs = ["Ask AI", "Journey", "Activity"];
  const logos = ["Stripe", "HubSpot", "Razorpay", "Zoho CRM", "Freshbooks", "QuickBooks"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400;1,6..72,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink: #0a0a0a;
          --ink-2: #2c2c2c;
          --ink-3: #555;
          --ink-4: #888;
          --ink-5: #bbb;
          --surface: #ffffff;
          --surface-2: #f7f7f6;
          --surface-3: #f0f0ee;
          --border: #e8e8e6;
          --border-2: #d8d8d5;
          --green: #1a7a4a;
          --green-light: #e8f5ee;
          --green-mid: #2da05e;
          --amber: #b45309;
          --amber-light: #fef3c7;
          --red: #c0392b;
          --red-light: #fef2f2;
          --blue: #1e40af;
          --blue-light: #eff6ff;
          --serif: 'Newsreader', Georgia, serif;
          --sans: 'DM Sans', -apple-system, system-ui, sans-serif;
          --radius: 10px;
          --radius-lg: 16px;
          --radius-xl: 24px;
        }

        html { scroll-behavior: smooth; }
        body { font-family: var(--sans); background: var(--surface); color: var(--ink); -webkit-font-smoothing: antialiased; overflow-x: hidden; }

        .lp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          height: 58px; display: flex; align-items: center;
          padding: 0 40px; transition: all 0.25s;
        }
        .lp-nav.stuck {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(20px) saturate(160%);
          border-bottom: 1px solid var(--border);
        }
        .lp-nav-logo { font-family: var(--sans); font-weight: 600; font-size: 16px; color: var(--ink); letter-spacing: -0.04em; text-decoration: none; display: flex; align-items: center; gap: 8px; }
        .lp-nav-logo-mark { width: 26px; height: 26px; border-radius: 7px; background: var(--ink); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
        .lp-nav-links { display: flex; align-items: center; gap: 36px; position: absolute; left: 50%; transform: translateX(-50%); }
        .lp-nav-links a { font-size: 13.5px; font-weight: 400; color: var(--ink-3); text-decoration: none; letter-spacing: -0.01em; transition: color 0.12s; }
        .lp-nav-links a:hover { color: var(--ink); }
        .lp-nav-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }
        .btn-ghost { padding: 6px 14px; border-radius: 8px; border: none; background: none; font-size: 13.5px; font-family: var(--sans); font-weight: 400; color: var(--ink-3); cursor: pointer; transition: all 0.12s; letter-spacing: -0.01em; }
        .btn-ghost:hover { color: var(--ink); background: var(--surface-2); }
        .btn-solid { padding: 7px 18px; border-radius: 8px; border: none; background: var(--ink); color: #fff; font-size: 13.5px; font-family: var(--sans); font-weight: 500; cursor: pointer; letter-spacing: -0.02em; transition: opacity 0.12s; }
        .btn-solid:hover { opacity: 0.84; }

        .lp-badge { display: inline-flex; align-items: center; gap: 7px; padding: 5px 13px 5px 9px; border-radius: 100px; border: 1px solid var(--border); background: var(--surface); font-size: 12.5px; font-weight: 400; color: var(--ink-3); margin-bottom: 32px; cursor: pointer; transition: border-color 0.12s; letter-spacing: -0.01em; }
        .lp-badge:hover { border-color: var(--border-2); }
        .lp-badge-icon { color: var(--green-mid); font-size: 13px; }
        .lp-badge-sep { color: var(--border-2); }
        .lp-badge-link { color: var(--ink); font-weight: 500; }

        .lp-hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 120px 40px 80px; text-align: center; }
        .lp-h1 { font-family: var(--serif); font-size: clamp(52px, 6.5vw, 86px); font-weight: 400; line-height: 1.05; letter-spacing: -0.025em; color: var(--ink); max-width: 780px; margin-bottom: 20px; }
        .lp-h1 em { font-style: italic; color: var(--ink); }
        .lp-hero-sub { font-size: 17px; line-height: 1.72; color: var(--ink-3); max-width: 420px; font-weight: 300; letter-spacing: -0.01em; margin-bottom: 36px; }
        .lp-hero-ctas { display: flex; gap: 10px; align-items: center; margin-bottom: 72px; }
        .btn-primary-lg { padding: 12px 26px; border-radius: 10px; border: none; background: var(--ink); color: #fff; font-size: 14.5px; font-family: var(--sans); font-weight: 500; cursor: pointer; letter-spacing: -0.02em; transition: opacity 0.12s; }
        .btn-primary-lg:hover { opacity: 0.82; }
        .btn-ghost-lg { padding: 12px 26px; border-radius: 10px; border: 1px solid var(--border-2); background: none; color: var(--ink-2); font-size: 14.5px; font-family: var(--sans); font-weight: 400; cursor: pointer; letter-spacing: -0.02em; transition: all 0.12s; }
        .btn-ghost-lg:hover { background: var(--surface-2); border-color: #bbb; }

        .lp-screen-wrap { width: 100%; max-width: 1020px; position: relative; }
        .lp-screen-shadow { border-radius: var(--radius-xl); overflow: hidden; border: 1px solid var(--border); box-shadow: 0 2px 6px rgba(0,0,0,0.04), 0 24px 80px rgba(0,0,0,0.09), 0 48px 120px rgba(0,0,0,0.06); }
        .lp-screen-bar { height: 40px; background: #f5f5f4; border-bottom: 1px solid var(--border); display: flex; align-items: center; padding: 0 16px; gap: 7px; }
        .lp-dot { width: 11px; height: 11px; border-radius: 50%; }
        .lp-screen-url { flex: 1; display: flex; justify-content: center; }
        .lp-screen-url-pill { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 3px 16px; font-size: 11.5px; color: var(--ink-4); font-family: var(--sans); }
        .lp-screen-inner { background: var(--surface); display: flex; height: 420px; }
        .app-sidebar { width: 172px; flex-shrink: 0; background: #fafaf9; border-right: 1px solid var(--border); padding: 16px 0; display: flex; flex-direction: column; }
        .app-sidebar-brand { display: flex; align-items: center; gap: 8px; padding: 0 14px 14px; border-bottom: 1px solid var(--border); margin-bottom: 8px; }
        .app-sidebar-mark { width: 22px; height: 22px; border-radius: 6px; background: var(--ink); display: flex; align-items: center; justify-content: center; font-size: 8.5px; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
        .app-sidebar-name { font-size: 13px; font-weight: 600; color: var(--ink); letter-spacing: -0.03em; }
        .app-nav-item { display: flex; align-items: center; gap: 8px; padding: 7px 14px; font-size: 12px; color: var(--ink-3); cursor: pointer; transition: all 0.1s; }
        .app-nav-item.active { background: var(--surface); color: var(--ink); font-weight: 500; border-right: 2px solid var(--ink); }
        .app-nav-item:hover:not(.active) { background: #f0f0ee; color: var(--ink-2); }
        .app-nav-icon { font-size: 11px; width: 14px; text-align: center; }
        .app-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .app-topbar { height: 44px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 20px; background: var(--surface); flex-shrink: 0; }
        .app-topbar-title { font-size: 12.5px; font-weight: 500; color: var(--ink); letter-spacing: -0.025em; }
        .app-topbar-tag { font-size: 10.5px; padding: 3px 9px; border-radius: 5px; background: #e8f5ee; color: var(--green); border: 1px solid #c6e8d4; font-weight: 500; letter-spacing: -0.01em; }
        .feed-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 20px; border-bottom: 1px solid #f5f5f3; transition: background 0.08s; cursor: default; }
        .feed-row:hover { background: #fafaf9; }
        .feed-bullet { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
        .feed-body { flex: 1; min-width: 0; }
        .feed-row-title { font-size: 12px; font-weight: 500; color: var(--ink); line-height: 1.4; margin-bottom: 2px; }
        .feed-row-sub { font-size: 11px; color: var(--ink-4); margin-bottom: 5px; line-height: 1.4; }
        .feed-row-foot { display: flex; align-items: center; gap: 8px; }
        .feed-pct { font-size: 10.5px; font-weight: 600; }
        .feed-btn { padding: 2px 9px; border-radius: 5px; border: 1px solid var(--border); background: var(--surface); font-size: 10.5px; color: var(--ink-3); font-family: var(--sans); cursor: pointer; transition: all 0.1s; }
        .feed-btn:hover { border-color: var(--border-2); color: var(--ink); }
        .feed-time { font-size: 10.5px; color: var(--ink-5); flex-shrink: 0; }

        .lp-logos { padding: 32px 40px; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .lp-logos-inner { max-width: 900px; margin: 0 auto; }
        .lp-logos-label { font-size: 12px; color: var(--ink-4); text-align: center; margin-bottom: 22px; letter-spacing: 0.04em; text-transform: uppercase; font-weight: 400; }
        .lp-logos-row { display: flex; align-items: center; justify-content: center; gap: 48px; flex-wrap: wrap; }
        .lp-logo-item { font-size: 13px; font-weight: 500; color: var(--ink-5); letter-spacing: -0.02em; font-family: var(--sans); transition: color 0.12s; }
        .lp-logo-item:hover { color: var(--ink-3); }

        .lp-section { padding: 100px 40px; }
        .lp-section-wrap { max-width: 1080px; margin: 0 auto; }
        .lp-eyebrow { font-size: 11.5px; font-weight: 500; letter-spacing: 0.1em; color: var(--ink-4); text-transform: uppercase; margin-bottom: 12px; }
        .lp-section-h2 { font-family: var(--serif); font-size: clamp(34px, 3.8vw, 52px); font-weight: 400; line-height: 1.1; letter-spacing: -0.025em; color: var(--ink); margin-bottom: 14px; }
        .lp-section-h2 em { font-style: italic; }
        .lp-section-p { font-size: 15px; line-height: 1.72; color: var(--ink-3); font-weight: 300; letter-spacing: -0.01em; max-width: 380px; }
        .lp-section-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 48px; margin-bottom: 52px; }

        .lp-tab-bar { display: inline-flex; gap: 2px; background: var(--surface-2); border-radius: 10px; padding: 3px; margin-bottom: 36px; border: 1px solid var(--border); }
        .lp-tab { padding: 7px 22px; border-radius: 8px; border: none; background: none; font-size: 13px; font-family: var(--sans); font-weight: 400; color: var(--ink-3); cursor: pointer; transition: all 0.14s; letter-spacing: -0.01em; }
        .lp-tab.on { background: var(--surface); color: var(--ink); font-weight: 500; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .lp-tab:hover:not(.on) { color: var(--ink-2); }

        .why-benefit { display: flex; gap: 16px; align-items: flex-start; padding: 20px 22px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); transition: border-color 0.14s; }
        .why-benefit:hover { border-color: var(--border-2); }
        .why-icon { width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 16px; }
        .why-title { font-size: 14px; font-weight: 500; color: var(--ink); letter-spacing: -0.025em; margin-bottom: 5px; }
        .why-desc { font-size: 13px; color: var(--ink-3); line-height: 1.65; font-weight: 300; }

        .lp-stat { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px 22px; }
        .lp-stat-icon { width: 34px; height: 34px; border-radius: 9px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 15px; margin-bottom: 14px; }
        .lp-stat-title { font-size: 13.5px; font-weight: 500; color: var(--ink); letter-spacing: -0.025em; margin-bottom: 5px; }
        .lp-stat-desc { font-size: 12.5px; color: var(--ink-3); line-height: 1.6; font-weight: 300; }

        .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .g3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }

        .lp-cta-wrap { padding: 0 40px 80px; }
        .lp-cta { background: var(--ink); border-radius: var(--radius-xl); padding: 88px 48px; text-align: center; position: relative; overflow: hidden; }
        .lp-cta::before { content: ''; position: absolute; top: -80px; left: 50%; transform: translateX(-50%); width: 600px; height: 300px; border-radius: 50%; background: rgba(255,255,255,0.03); pointer-events: none; }
        .lp-cta-h2 { font-family: var(--serif); font-size: clamp(38px, 4.5vw, 62px); font-weight: 400; color: #fff; letter-spacing: -0.03em; line-height: 1.08; margin-bottom: 16px; }
        .lp-cta-h2 em { font-style: italic; }
        .lp-cta-p { font-size: 15px; color: rgba(255,255,255,.45); max-width: 360px; margin: 0 auto 36px; line-height: 1.7; font-weight: 300; }
        .btn-cta { padding: 12px 28px; border-radius: 10px; background: #fff; color: var(--ink); font-size: 14.5px; font-family: var(--sans); font-weight: 500; border: none; cursor: pointer; letter-spacing: -0.02em; transition: opacity 0.12s; }
        .btn-cta:hover { opacity: .88; }

        .lp-footer { padding: 26px 40px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
        .lp-footer-logo { font-size: 14px; font-weight: 600; color: var(--ink); letter-spacing: -0.03em; font-family: var(--sans); }
        .lp-footer-copy { font-size: 12px; color: var(--ink-4); }
        .lp-footer-links { display: flex; gap: 20px; }
        .lp-footer-links a { font-size: 12px; color: var(--ink-4); text-decoration: none; transition: color .1s; }
        .lp-footer-links a:hover { color: var(--ink-2); }

        @keyframes msgin { from{opacity:0;transform:translateY(7px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tdot { 0%,80%,100%{transform:scale(.5);opacity:.25} 40%{transform:scale(1);opacity:.8} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

        @media (max-width: 820px) {
          .lp-nav-links { display: none; }
          .g2, .g3 { grid-template-columns: 1fr; }
          .lp-section-header { flex-direction: column; gap: 14px; }
          .lp-section { padding: 64px 24px; }
          .lp-hero { padding: 110px 24px 64px; }
          .lp-cta-wrap { padding: 0 20px 60px; }
          .lp-cta { padding: 64px 28px; }
          .lp-nav, .lp-footer { padding-left: 24px; padding-right: 24px; }
          .lp-logos { padding: 28px 24px; }
          .lp-logos-row { gap: 28px; }
          .lp-screen-inner { height: auto; flex-direction: column; }
          .app-sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--border); flex-direction: row; padding: 10px 0; }
          .app-sidebar-brand { display: none; }
        }
      `}</style>

      <div style={{ fontFamily: "var(--sans)", background: "var(--surface)", minHeight: "100vh" }}>

        {/* ── NAV ── */}
        <nav className={`lp-nav${scrolled ? " stuck" : ""}`}>
          <a href="#" className="lp-nav-logo">
            <div className="lp-nav-logo-mark">iP</div>
            Zindle
          </a>
          <div className="lp-nav-links">
            {["Product", "Solutions", "Pricing", "Company"].map(l => <a key={l} href="#">{l}</a>)}
          </div>
          <div className="lp-nav-right">
            <button className="btn-ghost" onClick={onEnterApp}>Sign in</button>
            <button className="btn-solid" onClick={onEnterApp}>Get started</button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="lp-hero">
          <div className="lp-badge">
            <span className="lp-badge-icon">✦</span>
            <span>New</span>
            <span className="lp-badge-sep">·</span>
            <span className="lp-badge-link">AI follow-up drafts are now live →</span>
          </div>

          <h1 className="lp-h1">
            Stop chasing invoices.<br /><em>Start closing them.</em>
          </h1>
          <p className="lp-hero-sub">
            Zindle reconstructs every customer's payment journey, surfaces real-time risk signals, and helps you act — so you recover more, faster.
          </p>
          <div className="lp-hero-ctas">
            <button className="btn-primary-lg" onClick={onEnterApp}>Get started free</button>
            <button className="btn-ghost-lg" onClick={onEnterApp}>See how it works</button>
          </div>

          {/* Browser mockup */}
          <div className="lp-screen-wrap">
            <div className="lp-screen-shadow">
              <div className="lp-screen-bar">
                <div className="lp-dot" style={{ background: "#ff5f57" }} />
                <div className="lp-dot" style={{ background: "#febc2e" }} />
                <div className="lp-dot" style={{ background: "#28c840" }} />
                <div className="lp-screen-url">
                  <div className="lp-screen-url-pill">app.Zindle.co/activity</div>
                </div>
              </div>
              <div className="lp-screen-inner">
                <div className="app-sidebar">
                  <div className="app-sidebar-brand">
                    <div className="app-sidebar-mark">ZD</div>
                    <span className="app-sidebar-name">Zindle</span>
                  </div>
                  {[
                    { label: "Activity", icon: "◫", on: true },
                    { label: "Journey", icon: "⬡" },
                    { label: "Ask AI", icon: "✦" },
                    { label: "Actions", icon: "◎" },
                  ].map(item => (
                    <div key={item.label} className={`app-nav-item${item.on ? " active" : ""}`}>
                      <span className="app-nav-icon">{item.icon}</span>
                      {item.label}
                    </div>
                  ))}
                </div>
                <div className="app-main">
                  <div className="app-topbar">
                    <span className="app-topbar-title">Live Activity Feed</span>
                    <span className="app-topbar-tag">5 new signals</span>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto" }}>
                    {[
                      { dot: "#e74c3c", title: "Acme Corp opened invoice 5× — never replied", sub: "₹1,20,000 · 18 days overdue · High risk", pct: "62%", pctClr: "#e74c3c", action: "Draft follow-up", time: "2m" },
                      { dot: "#f39c12", title: "Nova LLC stopped engaging after overdue", sub: "₹48,500 · 7 days overdue · Engagement dropped", pct: "74%", pctClr: "#f39c12", action: "Schedule call", time: "14m" },
                      { dot: "#27ae60", title: "Zeka reopened payment link twice today", sub: "₹2,80,000 · Strong payment intent", pct: "91%", pctClr: "#27ae60", action: "Send nudge", time: "31m" },
                      { dot: "#f39c12", title: "Orbit Tech email opened at 11:30 PM again", sub: "₹1,85,000 · 12 days overdue · Late-night pattern", pct: "58%", pctClr: "#f39c12", action: "Call AM", time: "1h" },
                      { dot: "#27ae60", title: "Zeta Retail clicked payment link", sub: "₹95,500 · 3 days overdue · High intent", pct: "88%", pctClr: "#27ae60", action: "Nudge now", time: "2h" },
                    ].map((r, i) => (
                      <div key={i} className="feed-row">
                        <div className="feed-bullet" style={{ background: r.dot }} />
                        <div className="feed-body">
                          <div className="feed-row-title">{r.title}</div>
                          <div className="feed-row-sub">{r.sub}</div>
                          <div className="feed-row-foot">
                            <span className="feed-pct" style={{ color: r.pctClr }}>{r.pct} recovery</span>
                            <button className="feed-btn">{r.action}</button>
                          </div>
                        </div>
                        <span className="feed-time">{r.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── LOGOS ── */}
        <div className="lp-logos">
          <div className="lp-logos-inner">
            <div className="lp-logos-label">Trusted by teams integrating with</div>
            <div className="lp-logos-row">
              {logos.map(l => <span key={l} className="lp-logo-item">{l}</span>)}
            </div>
          </div>
        </div>

        {/* ── PLATFORM (TABS) ── */}
        <section className="lp-section" style={{ background: "var(--surface-2)" }}>
          <div className="lp-section-wrap">
            <div className="lp-section-header">
              <div>
                <div className="lp-eyebrow">Platform</div>
                <h2 className="lp-section-h2">Three surfaces.<br /><em>One revenue brain.</em></h2>
              </div>
              <p className="lp-section-p">Zindle joins Stripe, HubSpot, and Gmail — every decision grounded in full customer context.</p>
            </div>

            <div className="lp-tab-bar">
              {tabs.map((t, i) => (
                <button key={t} className={`lp-tab${activeTab === i ? " on" : ""}`} onClick={() => setActiveTab(i)}>{t}</button>
              ))}
            </div>

            {activeTab === 0 && <ChatTabMockup />}
            {activeTab === 1 && <JourneyTabMockup />}
            {activeTab === 2 && <ActivityTabMockup />}
          </div>
        </section>

        {/* ── WHY Zindle ── */}
        <section className="lp-section" style={{ background: "var(--surface)" }}>
          <div className="lp-section-wrap">
            <div className="lp-section-header">
              <div>
                <div className="lp-eyebrow">Why Zindle</div>
                <h2 className="lp-section-h2">Everything you need to<br /><em>recover more revenue</em></h2>
              </div>
              <p className="lp-section-p">Built for founders and collections teams who need operational edge — not another CRM that stores contacts.</p>
            </div>

            <div className="g2" style={{ marginBottom: 14, alignItems: "start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { icon: "✦", bg: "#f5f3ff", c: "#6d28d9", title: "Ask anything in plain English", desc: "\"Who should I call today?\" gets a prioritized list with context — not a query builder. The AI reasons across Stripe, HubSpot, and Gmail." },
                  { icon: "⚡", bg: "#fef3c7", c: "#b45309", title: "Real-time risk signals", desc: "Signals fire the moment a customer ghosts, an invoice spikes in risk, or payment intent surges. Act before opportunities close." },
                  { icon: "◎", bg: "#eff6ff", c: "#1e40af", title: "One-click actions", desc: "Draft an email, schedule a call, or send a nudge directly from the recommendation — no tab switching, no copy-paste." },
                  { icon: "🔒", bg: "#e8f5ee", c: "#1a7a4a", title: "Enterprise-grade security", desc: "Role-based access, audit trails, and SOC 2 compliant infrastructure. Your revenue data stays yours." },
                ].map((b, i) => (
                  <div key={i} className="why-benefit">
                    <div className="why-icon" style={{ background: b.bg, color: b.c }}>{b.icon}</div>
                    <div>
                      <div className="why-title">{b.title}</div>
                      <div className="why-desc">{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { icon: "🔒", title: "Enterprise-grade security", desc: "Role-based access, audit trails, and SOC 2 compliant infrastructure." },
                  { icon: "⚡", title: "Real-time Risk Feed", desc: "Live signals from Stripe, HubSpot, and Resend — surface payment risks before they become losses." },
                  { icon: "📊", title: "Revenue Analytics", desc: "Track collection rates, ARPU, and recovery probability with cohort charts." },
                ].map(item => (
                  <div key={item.title} className="lp-stat">
                    <div className="lp-stat-icon">{item.icon}</div>
                    <div className="lp-stat-title">{item.title}</div>
                    <div className="lp-stat-desc">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <div className="lp-cta-wrap">
          <div className="lp-cta">
            <h2 className="lp-cta-h2">Stop chasing.<br /><em>Start collecting.</em></h2>
            <p className="lp-cta-p">Join founders who recover more revenue with less effort using AI-powered collections intelligence.</p>
            <button className="btn-cta" onClick={onEnterApp}>Get started free</button>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <span className="lp-footer-logo">Zindle</span>
          <span className="lp-footer-copy">© 2026 Zindle. All rights reserved.</span>
          <div className="lp-footer-links">
            {["Privacy", "Terms", "Contact"].map(l => <a key={l} href="#">{l}</a>)}
          </div>
        </footer>

      </div>
    </>
  );
}