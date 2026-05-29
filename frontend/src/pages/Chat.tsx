import { useState, useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import { sendMessage, clearChat } from "../store/slices/chatSlice";
import type { ChatMessage } from "../store/slices/chatSlice";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .ch {
    --white:  #ffffff;
    --bg:     #fafafa;
    --s50:    #f7f7f8;
    --s100:   #f0f0f2;
    --s200:   #e4e4e8;
    --s300:   #d0d0d6;
    --s400:   #a0a0ab;
    --s500:   #70707a;
    --s600:   #4a4a55;
    --s700:   #2e2e38;
    --s900:   #0f0f14;
    --accent: #0f0f14;
    --blue:   #2563eb;
    --green:  #16a34a;
    --amber:  #d97706;
    --red:    #dc2626;
    --serif:  'DM Serif Display', Georgia, serif;
    --sans:   'DM Sans', -apple-system, system-ui, sans-serif;
    --mono:   'DM Mono', 'Fira Code', monospace;

    font-family: var(--sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: var(--white);
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
    position: relative;
  }

  .ch-scroll::-webkit-scrollbar { width: 4px; }
  .ch-scroll::-webkit-scrollbar-track { background: transparent; }
  .ch-scroll::-webkit-scrollbar-thumb { background: var(--s200); border-radius: 99px; }

  .ch-textarea { resize: none; }
  .ch-textarea:focus { outline: none; }
  .ch-textarea::placeholder { color: var(--s400); }
  .ch-textarea::-webkit-scrollbar { display: none; }
  .ch-textarea { scrollbar-width: none; -ms-overflow-style: none; }

  @keyframes ch-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ch-up {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ch-dot {
    0%, 80%, 100% { transform: scale(0.5); opacity: 0.25; }
    40%           { transform: scale(1);   opacity: 0.8; }
  }
  @keyframes ch-slide {
    from { opacity: 0; transform: translateX(-3px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes ch-pulse {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.4; }
  }

  .ch-msg-in  { animation: ch-in 0.2s cubic-bezier(0.16,1,0.3,1) both; }
  .ch-fade-up { animation: ch-up 0.4s cubic-bezier(0.16,1,0.3,1) both; }
  .ch-slide   { animation: ch-slide 0.16s ease both; }

  .ch-suggestion {
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 15px; border-radius: 8px;
    border: 1px solid var(--s200); background: var(--white);
    cursor: pointer; font-family: var(--sans);
    font-size: 13px; font-weight: 400; color: var(--s600);
    letter-spacing: -0.01em; text-align: left; width: 100%;
    transition: border-color 0.12s, background 0.12s, color 0.12s;
    gap: 8px;
  }
  .ch-suggestion:hover {
    background: var(--s50); border-color: var(--s300); color: var(--s900);
  }
  .ch-suggestion-arrow {
    color: var(--s300); font-size: 12px; flex-shrink: 0;
    transition: color 0.12s, transform 0.12s;
  }
  .ch-suggestion:hover .ch-suggestion-arrow {
    color: var(--s600); transform: translateX(2px);
  }

  .ch-send { transition: opacity 0.1s, transform 0.1s; }
  .ch-send:hover:not(:disabled) { opacity: 0.85; }
  .ch-send:active:not(:disabled) { transform: scale(0.94); }

  .ch-input-wrap { transition: border-color 0.15s, box-shadow 0.15s; }
  .ch-input-wrap:focus-within {
    border-color: var(--s400) !important;
    box-shadow: 0 0 0 3px rgba(15,15,20,0.06);
  }

  .ch-pill {
    display: inline-flex; align-items: center;
    padding: 5px 12px; border-radius: 6px;
    border: 1px solid var(--s200); background: var(--white);
    font-size: 12px; font-weight: 400; color: var(--s500);
    cursor: pointer; font-family: var(--sans);
    letter-spacing: -0.01em; transition: all 0.1s;
    white-space: nowrap; flex-shrink: 0;
  }
  .ch-pill:hover { background: var(--s50); color: var(--s900); border-color: var(--s300); }

  .ch-code { background: var(--s900); border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); }
  .ch-code-header {
    padding: 8px 14px; background: rgba(255,255,255,0.04);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    display: flex; align-items: center; justify-content: space-between;
  }
  .ch-code pre {
    padding: 14px 16px; margin: 0;
    font-family: var(--mono); font-size: 12px;
    color: #e2e8f0; line-height: 1.75; overflow-x: auto;
  }
  .ch-copy-btn {
    background: none; border: none; cursor: pointer;
    color: var(--s400); font-family: var(--sans); font-size: 11px;
    padding: 2px 8px; border-radius: 4px; transition: all 0.1s;
  }
  .ch-copy-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }

  .ch-table-wrap { border-radius: 8px; overflow: hidden; border: 1px solid var(--s200); }
  .ch-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  .ch-table th {
    padding: 9px 14px; text-align: left; font-size: 10.5px; font-weight: 500;
    color: var(--s400); text-transform: uppercase; letter-spacing: 0.07em;
    background: var(--s50); border-bottom: 1px solid var(--s200);
  }
  .ch-table td {
    padding: 10px 14px; color: var(--s600); border-bottom: 1px solid var(--s100);
    vertical-align: middle; letter-spacing: -0.01em; font-size: 13px;
  }
  .ch-table tr:last-child td { border-bottom: none; }
  .ch-table tr:hover td { color: var(--s900); background: var(--s50); }

  .ch-stat {
    background: var(--white); border: 1px solid var(--s200);
    border-radius: 8px; padding: 14px 16px;
  }

  .ch-rank {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 11px 0; border-bottom: 1px solid var(--s100);
  }
  .ch-rank:first-child { padding-top: 0; }
  .ch-rank:last-child  { border-bottom: none; padding-bottom: 0; }

  .ch-action-item {
    display: flex; align-items: flex-start; gap: 10px;
    background: var(--white); border: 1px solid var(--s200);
    border-radius: 7px; padding: 9px 12px;
  }

  .ch-insight {
    display: flex; gap: 10px; align-items: flex-start;
    padding: 11px 14px; border-radius: 7px; border: 1px solid;
  }

  .ch-card {
    background: var(--white); border: 1px solid var(--s200);
    border-radius: 10px; overflow: hidden;
  }
  .ch-card-header {
    padding: 10px 16px; background: var(--s50);
    border-bottom: 1px solid var(--s200);
    display: flex; align-items: center; gap: 8px;
  }
  .ch-card-body { padding: 0 16px 4px; }

  .ch-scroll-btn {
    position: absolute; bottom: 96px; left: 50%; transform: translateX(-50%);
    width: 30px; height: 30px; border-radius: 50%;
    background: var(--white); border: 1px solid var(--s200);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; z-index: 10;
    box-shadow: 0 2px 12px rgba(0,0,0,0.07);
    transition: all 0.12s;
  }
  .ch-scroll-btn:hover { background: var(--s50); border-color: var(--s300); }

  .ch-status-dot {
    width: 6px; height: 6px; border-radius: 50%; background: #22c55e;
    animation: ch-pulse 2.5s ease-in-out infinite;
  }

  .ch-clear-btn {
    background: none; border: 1px solid var(--s200); border-radius: 6px;
    padding: 5px 11px; cursor: pointer; font-size: 11.5px;
    color: var(--s500); font-family: var(--sans); letter-spacing: -0.01em;
    transition: all 0.1s; font-weight: 400;
  }
  .ch-clear-btn:hover { border-color: var(--s300); color: var(--s900); background: var(--s50); }

  .ch-wordmark {
    font-family: var(--sans); font-size: 13px; font-weight: 600;
    color: var(--s900); letter-spacing: -0.03em;
  }
  .ch-wordmark span { color: var(--s400); font-weight: 400; }
`;

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ── Logo ──────────────────────────────────────────────────────────────────────

function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#0f0f14"/>
      <path d="M8 16L12 8L16 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.5 13.5H14.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ── Thinking ──────────────────────────────────────────────────────────────────

function ThinkingBubble() {
  return (
    <div style={{ display: "flex", gap: 11, alignItems: "flex-start", paddingLeft: 0 }}>
      <div style={{ paddingTop: 2, flexShrink: 0 }}>
        <LogoMark size={22} />
      </div>
      <div style={{
        padding: "10px 14px", borderRadius: "4px 12px 12px 12px",
        background: "var(--s50)", border: "1px solid var(--s200)",
        display: "flex", gap: 4, alignItems: "center",
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            display: "inline-block", width: 4, height: 4, borderRadius: "50%",
            background: "var(--s400)",
            animation: `ch-dot 1.1s ease-in-out ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Block types ───────────────────────────────────────────────────────────────

type Block =
  | { type: "heading"; level: 1|2|3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; items: string[] }
  | { type: "numbered"; items: string[] }
  | { type: "code"; lang: string; code: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "stats"; items: { label: string; value: string; accent?: string }[] }
  | { type: "ranked"; items: RankItem[] }
  | { type: "insight"; variant: "warning"|"success"|"info"|"danger"; text: string }
  | { type: "actions"; items: string[] };

interface RankItem {
  rank: number; name: string; amount?: string;
  tag?: string; tagColor?: string; note?: string; progress?: number;
}

function parseAmt(t: string) {
  return t.match(/[₹$€£]\s?[\d,]+(?:\.\d+)?(?:[KkMmBb])?|[\d,]+\s?(?:lakh|crore|thousand|million)/i)?.[0];
}

function riskTag(t: string): { tag: string; color: string } | null {
  if (/high.?risk|critical|urgent/i.test(t)) return { tag: "High risk", color: "#dc2626" };
  if (/overdue|past.?due/i.test(t))           return { tag: "Overdue",   color: "#d97706" };
  if (/review/i.test(t))                       return { tag: "Review",    color: "#2563eb" };
  if (/settled|paid/i.test(t))                 return { tag: "Settled",   color: "#16a34a" };
  return null;
}

function insightVariant(t: string): "warning"|"success"|"info"|"danger" {
  if (/⚠|warning|overdue|risk|urgent/i.test(t)) return "warning";
  if (/✅|good|healthy|paid|settled/i.test(t))   return "success";
  if (/❌|error|critical|failed/i.test(t))       return "danger";
  return "info";
}

function parseBlocks(text: string): Block[] {
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) { i++; continue; }
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim() || "text";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) { codeLines.push(lines[i]); i++; }
      blocks.push({ type: "code", lang, code: codeLines.join("\n") });
      i++; continue;
    }
    const hm = line.match(/^(#{1,3})\s+(.*)/);
    if (hm) { blocks.push({ type: "heading", level: hm[1].length as 1|2|3, text: hm[2].replace(/\*+/g, "") }); i++; continue; }
    if (/^\*{2}[^*]{2,50}\*{2}$/.test(line) && line.length < 60) { blocks.push({ type: "heading", level: 2, text: line.replace(/\*+/g, "") }); i++; continue; }
    if (line.startsWith("|") && lines[i+1]?.trim().startsWith("|--")) {
      const headers = line.split("|").map(c => c.trim()).filter(Boolean);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) { rows.push(lines[i].split("|").map(c => c.trim()).filter(Boolean)); i++; }
      blocks.push({ type: "table", headers, rows }); continue;
    }
    if (/^\d+[.)]\s/.test(line)) {
      const items: RankItem[] = [];
      while (i < lines.length && /^\d+[.)]\s/.test(lines[i].trim())) {
        const l = lines[i].trim();
        const rank = parseInt(l);
        const body = l.replace(/^\d+[.)]\s/, "");
        const name = body.split(/[|(—–]|\s{2,}/)[0].trim().replace(/\*+/g, "");
        const tag = riskTag(body);
        const amount = parseAmt(body);
        const noteM = body.match(/[—–]\s*(.+)$/);
        const note = noteM ? noteM[1].replace(/\*+/g, "").trim() : undefined;
        items.push({ rank, name, amount, tag: tag?.tag, tagColor: tag?.color, note, progress: Math.max(12, 100 - (rank - 1) * 14) });
        i++;
      }
      blocks.push({ type: "ranked", items }); continue;
    }
    if (/^[-•*]\s/.test(line)) {
      const bLines: string[] = [];
      while (i < lines.length && /^[-•*]\s/.test(lines[i].trim())) { bLines.push(lines[i].trim()); i++; }
      const statRE = /[:|\-–].*[\d%$₹£€KkMm]/;
      const statCount = bLines.filter(l => statRE.test(l)).length;
      if (statCount >= Math.ceil(bLines.length * 0.6) && bLines.length >= 2) {
        const stats = bLines.map(l => {
          const m = l.match(/^[-•*]?\s*\*{0,2}([^:|\-–]+?)\*{0,2}\s*[:|\-–]\s*(.+)/);
          if (!m) return null;
          const label = m[1].trim().replace(/\*+/g, "");
          const value = m[2].trim().replace(/\*+/g, "");
          let accent: string | undefined;
          if (/paid|collected|success/i.test(label)) accent = "#16a34a";
          else if (/outstanding|overdue|due/i.test(label)) accent = "#d97706";
          else if (/risk|churn/i.test(label)) accent = "#dc2626";
          return { label, value, accent };
        }).filter(Boolean) as { label: string; value: string; accent?: string }[];
        if (stats.length >= 2) { blocks.push({ type: "stats", items: stats }); continue; }
      }
      const actionRE = /^[-•*]\s*(call|contact|reach out|send|follow|schedule|escalate|review|recommend|action|prioritize)/i;
      if (bLines.some(l => actionRE.test(l))) {
        blocks.push({ type: "actions", items: bLines.map(l => l.replace(/^[-•*]\s/, "").replace(/\*+/g, "")) });
      } else {
        blocks.push({ type: "bullet", items: bLines.map(l => l.replace(/^[-•*]\s/, "").replace(/\*+/g, "")) });
      }
      continue;
    }
    if (/^[⚠✅💡🔴🟡🟢❌►→]|^\*?Note:|^\*?Warning:|^\*?Insight:|^\*?Summary:|^\*?Recommendation:/i.test(line)) {
      const cleaned = line.replace(/^[⚠✅💡🔴🟡🟢❌►→]\s*/, "").replace(/\*+/g, "");
      blocks.push({ type: "insight", variant: insightVariant(line), text: cleaned });
      i++; continue;
    }
    blocks.push({ type: "paragraph", text: line });
    i++;
  }
  return blocks;
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return <strong key={i} style={{ fontWeight: 600, color: "var(--s900)" }}>{p.slice(2,-2)}</strong>;
        if (p.startsWith("`") && p.endsWith("`"))
          return <code key={i} style={{ fontFamily: "var(--mono)", fontSize: "11.5px", background: "var(--s100)", padding: "1px 6px", borderRadius: 4, color: "var(--s700)" }}>{p.slice(1,-1)}</code>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function HeadingBlock({ level, text }: { level: 1|2|3; text: string }) {
  const sizes = { 1: "19px", 2: "14.5px", 3: "13px" };
  return (
    <div style={{
      fontFamily: level === 1 ? "var(--serif)" : "var(--sans)",
      fontSize: sizes[level],
      fontWeight: level === 1 ? 400 : 600,
      color: "var(--s900)",
      letterSpacing: level === 1 ? "-0.02em" : "-0.02em",
      lineHeight: 1.25,
      paddingBottom: level < 3 ? 8 : 0,
      borderBottom: level === 1 ? "1px solid var(--s200)" : "none",
      fontStyle: level === 1 ? "italic" : "normal",
    }}>
      {text}
    </div>
  );
}

function ParagraphBlock({ text }: { text: string }) {
  return (
    <p style={{ fontSize: "13.5px", color: "var(--s600)", lineHeight: 1.72, letterSpacing: "-0.01em", margin: 0, fontWeight: 400 }}>
      <Inline text={text} />
    </p>
  );
}

function BulletBlock({ items }: { items: string[] }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 5 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: 10, fontSize: "13px", color: "var(--s600)", lineHeight: 1.65 }}>
          <span style={{ color: "var(--s300)", flexShrink: 0, marginTop: 7, width: 4, height: 4, borderRadius: "50%", background: "var(--s300)", display: "inline-block" }} />
          <Inline text={item} />
        </li>
      ))}
    </ul>
  );
}

function NumberedBlock({ items }: { items: string[] }) {
  return (
    <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 5 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: 10, fontSize: "13px", color: "var(--s600)", lineHeight: 1.65 }}>
          <span style={{
            flexShrink: 0, width: 18, height: 18, borderRadius: 5,
            background: "var(--s100)", border: "1px solid var(--s200)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "10px", fontWeight: 500, color: "var(--s500)", marginTop: 2, fontFamily: "var(--mono)",
          }}>{i + 1}</span>
          <Inline text={item} />
        </li>
      ))}
    </ol>
  );
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className="ch-code">
      <div className="ch-code-header">
        <span style={{ fontSize: "10.5px", color: "#6b7280", fontFamily: "var(--mono)", fontWeight: 500 }}>{lang}</span>
        <button className="ch-copy-btn" onClick={copy}>{copied ? "✓ copied" : "copy"}</button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  );
}

function TableBlock({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="ch-table-wrap">
      <table className="ch-table">
        <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => (
          <tr key={i}>{row.map((cell, j) => <td key={j}><Inline text={cell} /></td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function StatsBlock({ items }: { items: { label: string; value: string; accent?: string }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)`, gap: 8 }}>
      {items.map((s, i) => (
        <div key={i} className="ch-stat">
          <div style={{ fontSize: "10px", fontWeight: 500, color: "var(--s400)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8 }}>
            {s.label}
          </div>
          <div style={{ fontFamily: "var(--serif)", fontSize: "22px", fontWeight: 400, color: s.accent || "var(--s900)", letterSpacing: "-0.02em", lineHeight: 1, fontStyle: "italic" }}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function RankedBlock({ items }: { items: RankItem[] }) {
  return (
    <div className="ch-card">
      <div className="ch-card-header">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 10L6 2L10 10" stroke="var(--s500)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3.5 7.5H8.5" stroke="var(--s500)" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--s500)", letterSpacing: "-0.01em" }}>Ranked results</span>
        <span style={{ fontSize: "10.5px", color: "var(--s400)", marginLeft: "auto" }}>{items.length} items</span>
      </div>
      <div className="ch-card-body">
        {items.map((item, idx) => (
          <div key={idx} className="ch-rank ch-slide" style={{ animationDelay: `${idx * 0.03}s` }}>
            <div style={{
              width: 20, height: 20, borderRadius: 5, flexShrink: 0,
              background: idx === 0 ? "var(--s900)" : "var(--s100)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "10px", fontWeight: 500,
              color: idx === 0 ? "#fff" : "var(--s500)",
              fontFamily: "var(--mono)", marginTop: 1,
            }}>
              {item.rank}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--s900)", letterSpacing: "-0.015em" }}>{item.name}</span>
                {item.tag && (
                  <span style={{
                    fontSize: "10px", fontWeight: 500, padding: "1px 7px", borderRadius: 4,
                    letterSpacing: "0.03em",
                    background: (item.tagColor || "#4a4a55") + "12",
                    color: item.tagColor || "var(--s600)",
                    border: `1px solid ${(item.tagColor || "#4a4a55") + "22"}`,
                  }}>
                    {item.tag}
                  </span>
                )}
                {item.amount && (
                  <span style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--s700)", letterSpacing: "-0.02em", marginLeft: "auto", fontWeight: 500 }}>
                    {item.amount}
                  </span>
                )}
              </div>
              {item.note && <div style={{ fontSize: "11.5px", color: "var(--s400)", marginTop: 3, lineHeight: 1.5 }}>{item.note}</div>}
              {item.progress !== undefined && (
                <div style={{ height: 2, borderRadius: 99, background: "var(--s100)", marginTop: 8, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 99, width: `${item.progress}%`, background: "var(--s300)", transition: "width 0.5s ease" }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightBlock({ variant, text }: { variant: string; text: string }) {
  const map: Record<string, { bg: string; border: string; accent: string; label: string }> = {
    warning: { bg: "#fffbeb", border: "#fde68a", accent: "#d97706", label: "Warning" },
    success: { bg: "#f0fdf4", border: "#bbf7d0", accent: "#16a34a", label: "Note" },
    danger:  { bg: "#fef2f2", border: "#fecaca", accent: "#dc2626", label: "Alert" },
    info:    { bg: "#eff6ff", border: "#bfdbfe", accent: "#2563eb", label: "Info" },
  };
  const c = map[variant] || map.info;
  return (
    <div className="ch-insight" style={{ background: c.bg, borderColor: c.border }}>
      <span style={{ fontSize: "10px", fontWeight: 600, color: c.accent, flexShrink: 0, lineHeight: 1.9, letterSpacing: "0.06em", textTransform: "uppercase" }}>{c.label}</span>
      <span style={{ fontSize: "13px", color: "var(--s700)", lineHeight: 1.65, letterSpacing: "-0.01em" }}>
        <Inline text={text} />
      </span>
    </div>
  );
}

function ActionsBlock({ items }: { items: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {items.map((item, i) => (
        <div key={i} className="ch-action-item">
          <div style={{
            width: 14, height: 14, borderRadius: 3, flexShrink: 0,
            border: "1.5px solid var(--s300)", background: "var(--white)",
            marginTop: 3,
          }} />
          <span style={{ fontSize: "13px", color: "var(--s700)", lineHeight: 1.6, letterSpacing: "-0.01em" }}>
            <Inline text={item} />
          </span>
        </div>
      ))}
    </div>
  );
}

function ResponseRenderer({ text }: { text: string }) {
  const blocks = parseBlocks(text);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":   return <HeadingBlock key={i} level={block.level} text={block.text} />;
          case "paragraph": return <ParagraphBlock key={i} text={block.text} />;
          case "bullet":    return <BulletBlock key={i} items={block.items} />;
          case "numbered":  return <NumberedBlock key={i} items={block.items} />;
          case "code":      return <CodeBlock key={i} lang={block.lang} code={block.code} />;
          case "table":     return <TableBlock key={i} headers={block.headers} rows={block.rows} />;
          case "stats":     return <StatsBlock key={i} items={block.items} />;
          case "ranked":    return <RankedBlock key={i} items={block.items} />;
          case "insight":   return <InsightBlock key={i} variant={block.variant} text={block.text} />;
          case "actions":   return <ActionsBlock key={i} items={block.items} />;
          default:          return null;
        }
      })}
    </div>
  );
}

function UserBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{ maxWidth: "68%", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <div style={{
          padding: "10px 16px",
          borderRadius: "14px 3px 14px 14px",
          background: "var(--s900)",
          color: "#ffffff",
          fontSize: "13.5px",
          lineHeight: 1.65,
          letterSpacing: "-0.01em",
          fontWeight: 400,
        }}>
          {msg.text}
        </div>
        <span style={{ fontSize: "10px", color: "var(--s400)", paddingRight: 2, fontVariantNumeric: "tabular-nums" }}>
          {fmtTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
}

function AssistantBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
      <div style={{ paddingTop: 2, flexShrink: 0 }}>
        <LogoMark size={22} />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{
          background: "var(--s50)",
          border: "1px solid var(--s200)",
          borderRadius: "3px 14px 14px 14px",
          padding: "14px 18px",
        }}>
          <ResponseRenderer text={msg.text} />
        </div>
        <span style={{ fontSize: "10px", color: "var(--s400)", paddingLeft: 2, fontVariantNumeric: "tabular-nums" }}>
          {fmtTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
}

function ChatHeader({ hasMessages, onClear }: { hasMessages: boolean; onClear: () => void }) {
  return (
    <div style={{
      borderBottom: "1px solid var(--s200)",
      padding: "0 24px",
      height: 52,
      display: "flex", alignItems: "center", gap: 12,
      background: "var(--white)",
      flexShrink: 0,
    }}>
      <LogoMark size={22} />
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
        <span className="ch-wordmark">Collections<span> AI</span></span>
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "3px 8px", borderRadius: 5,
          background: "var(--s50)", border: "1px solid var(--s200)",
        }}>
          <span className="ch-status-dot" />
          <span style={{ fontSize: "11px", color: "var(--s500)", fontWeight: 400, letterSpacing: "-0.01em" }}>
            Stripe · HubSpot
          </span>
        </div>
      </div>
      {hasMessages && (
        <button className="ch-clear-btn" onClick={onClear}>Clear</button>
      )}
    </div>
  );
}

const SUGGESTIONS = [
  { text: "Who should I call today?" },
  { text: "Show all overdue invoices" },
  { text: "Which customers are at churn risk?" },
  { text: "Revenue summary this month" },
  { text: "Highest outstanding balances" },
  { text: "Who pays late but always converts?" },
];

function EmptyState({ onSend }: { onSend: (t: string) => void }) {
  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 32px 24px",
    }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        {/* Heading */}
        <div className="ch-fade-up" style={{ marginBottom: 32 }}>
          <div style={{ marginBottom: 16 }}>
            <LogoMark size={32} />
          </div>
          <h1 style={{
            fontFamily: "var(--serif)",
            fontSize: "clamp(28px, 4vw, 38px)",
            fontWeight: 400, color: "var(--s900)",
            letterSpacing: "-0.025em", lineHeight: 1.1,
            margin: "0 0 10px", fontStyle: "italic",
          }}>
            Ask anything.
          </h1>
          <p style={{
            fontSize: "13.5px", color: "var(--s500)", lineHeight: 1.65,
            margin: 0, letterSpacing: "-0.01em", fontWeight: 400,
          }}>
            Collections intelligence across invoices, customers, and revenue.
          </p>
        </div>

        {/* Suggestions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }} className="ch-fade-up">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={s.text}
              className="ch-suggestion"
              onClick={() => onSend(s.text)}
              style={{ animationDelay: `${0.05 + i * 0.03}s` }}
            >
              <span>{s.text}</span>
              <svg className="ch-suggestion-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const QUICK = ["Who else is overdue?", "Revenue summary", "Top customers", "Recent invoices"];

function InputBar({ onSend, loading, hasMessages }: { onSend: (t: string) => void; loading: boolean; hasMessages: boolean }) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const send = () => {
    const t = input.trim();
    if (!t || loading) return;
    setInput("");
    if (ref.current) ref.current.style.height = "auto";
    onSend(t);
    setTimeout(() => ref.current?.focus(), 50);
  };

  const canSend = !!input.trim() && !loading;

  return (
    <div style={{
      borderTop: "1px solid var(--s200)",
      padding: "10px 24px 18px",
      background: "var(--white)",
      flexShrink: 0,
    }}>
      {hasMessages && !loading && (
        <div style={{ display: "flex", gap: 5, marginBottom: 9, overflowX: "auto", paddingBottom: 1, maxWidth: 720, margin: "0 auto 9px" }}>
          {QUICK.map(s => (
            <button key={s} className="ch-pill" onClick={() => onSend(s)}>{s}</button>
          ))}
        </div>
      )}

      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div
          className="ch-input-wrap"
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            background: focused ? "var(--white)" : "var(--s50)",
            borderRadius: 12,
            padding: "10px 10px 10px 16px",
            border: `1px solid ${focused ? "var(--s300)" : "var(--s200)"}`,
          }}
        >
          <textarea
            ref={ref}
            className="ch-textarea"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Ask about customers, invoices, priorities…"
            rows={1}
            style={{
              flex: 1, border: "none", background: "transparent",
              fontSize: "13.5px", color: "var(--s900)", lineHeight: 1.65,
              fontFamily: "var(--sans)", maxHeight: 120, overflowY: "auto",
              paddingTop: 2, letterSpacing: "-0.01em", fontWeight: 400,
            }}
            onInput={e => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
            }}
          />

          <button
            className="ch-send"
            onClick={send}
            disabled={!canSend}
            style={{
              width: 30, height: 30, borderRadius: 8, border: "none",
              background: canSend ? "var(--s900)" : "var(--s100)",
              cursor: canSend ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "background 0.15s",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 10V2M2.5 5.5L6 2l3.5 3.5"
                stroke={canSend ? "#ffffff" : "var(--s400)"}
                strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <p style={{
          fontSize: "10.5px", color: "var(--s400)", textAlign: "center",
          margin: "7px 0 0", letterSpacing: "-0.01em",
        }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

export default function Chat() {
  const dispatch = useDispatch<AppDispatch>();
  const { messages, loading } = useSelector((state: RootState) => state.chat);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
  };

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  const send = useCallback((text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    dispatch(sendMessage(t));
  }, [dispatch, loading]);

  const isEmpty = messages.length === 0;

  return (
    <div className="ch">
      <style>{css}</style>
      <ChatHeader hasMessages={!isEmpty} onClear={() => dispatch(clearChat())} />

      <div
        ref={scrollRef}
        className="ch-scroll"
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}
      >
        {isEmpty ? (
          <EmptyState onSend={send} />
        ) : (
          <div style={{
            maxWidth: 720, width: "100%", margin: "0 auto",
            padding: "32px 24px 24px",
            display: "flex", flexDirection: "column", gap: 22,
          }}>
            {messages.map(msg => (
              <div key={msg.id} className="ch-msg-in">
                {msg.role === "user" ? <UserBubble msg={msg} /> : <AssistantBubble msg={msg} />}
              </div>
            ))}
            {loading && <div className="ch-msg-in"><ThinkingBubble /></div>}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {showScrollBtn && !isEmpty && (
        <button className="ch-scroll-btn" onClick={scrollToBottom}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2v8M2.5 6.5L6 10l3.5-3.5" stroke="var(--s600)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      <InputBar onSend={send} loading={loading} hasMessages={!isEmpty} />
    </div>
  );
}