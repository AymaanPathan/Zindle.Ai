import { useState, useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import { sendMessage, clearChat } from "../store/slices/chatSlice";
import type { ChatMessage } from "../store/slices/chatSlice";

// ─── CSS ──────────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap');

  .ch {
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
    --mono:  'Geist Mono', 'Fira Code', monospace;
    font-family: var(--sans);
    -webkit-font-smoothing: antialiased;
    background: var(--w);
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
    position: relative;
  }

  /* scrollbar for message area */
  .ch-scroll::-webkit-scrollbar { width: 3px; }
  .ch-scroll::-webkit-scrollbar-track { background: transparent; }
  .ch-scroll::-webkit-scrollbar-thumb { background: var(--g200); border-radius: 99px; }

  .ch-textarea { resize: none; }
  .ch-textarea:focus { outline: none; }
  .ch-textarea::placeholder { color: var(--g400); }
  .ch-textarea::-webkit-scrollbar { display: none; }
  .ch-textarea { scrollbar-width: none; -ms-overflow-style: none; }

  @keyframes ch-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ch-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ch-dot {
    0%, 80%, 100% { transform: scale(0.55); opacity: 0.3; }
    40%           { transform: scale(1);    opacity: 1; }
  }
  @keyframes ch-slide {
    from { opacity: 0; transform: translateX(-4px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes ch-shimmer {
    from { background-position: -400px 0; }
    to   { background-position: 400px 0; }
  }

  .ch-msg-in  { animation: ch-in 0.22s ease both; }
  .ch-fade-up { animation: ch-up 0.35s cubic-bezier(0.16,1,0.3,1) both; }
  .ch-slide   { animation: ch-slide 0.18s ease both; }

  /* Chip suggestions */
  .ch-chip {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; border-radius: 10px;
    border: 1px solid var(--g200); background: var(--w);
    cursor: pointer; font-family: var(--sans);
    font-size: 12.5px; font-weight: 400; color: var(--g700);
    letter-spacing: -0.01em; text-align: left; width: 100%;
    transition: all 0.12s;
  }
  .ch-chip:hover {
    background: var(--g50); border-color: var(--g300); color: var(--g900);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }

  /* Send button */
  .ch-send { transition: opacity 0.12s, transform 0.12s; }
  .ch-send:hover:not(:disabled) { opacity: 0.85; transform: scale(1.04); }
  .ch-send:active:not(:disabled) { transform: scale(0.96); }

  /* Input wrap focus ring */
  .ch-input-wrap { transition: border-color 0.15s, box-shadow 0.15s; }
  .ch-input-wrap:focus-within {
    border-color: var(--g400) !important;
    box-shadow: 0 0 0 3px rgba(0,0,0,0.04);
  }

  /* Quick pill buttons */
  .ch-pill {
    display: inline-flex; align-items: center;
    padding: 4px 12px; border-radius: 99px;
    border: 1px solid var(--g200); background: var(--w);
    font-size: 12px; color: var(--g500); cursor: pointer;
    font-family: var(--sans); letter-spacing: -0.01em;
    transition: all 0.1s; white-space: nowrap; flex-shrink: 0;
  }
  .ch-pill:hover { background: var(--g50); color: var(--g900); border-color: var(--g300); }

  /* Code block */
  .ch-code {
    background: var(--g900); border-radius: 10px; overflow: hidden;
  }
  .ch-code-header {
    padding: 7px 14px; background: rgba(255,255,255,0.06);
    border-bottom: 1px solid rgba(255,255,255,0.08);
    display: flex; align-items: center; justify-content: space-between;
  }
  .ch-code pre {
    padding: 14px 16px; margin: 0;
    font-family: var(--mono); font-size: 12.5px;
    color: #e2e8f0; line-height: 1.7; overflow-x: auto;
  }
  .ch-copy-btn {
    background: none; border: none; cursor: pointer;
    color: var(--g400); font-family: var(--sans); font-size: 11px;
    padding: 2px 7px; border-radius: 4px; transition: all 0.1s;
  }
  .ch-copy-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

  /* Table */
  .ch-table-wrap { border-radius: 10px; overflow: hidden; border: 1px solid var(--g200); }
  .ch-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  .ch-table th {
    padding: 8px 14px; text-align: left; font-size: 10px; font-weight: 600;
    color: var(--g400); text-transform: uppercase; letter-spacing: 0.09em;
    background: var(--g50); border-bottom: 1px solid var(--g200);
  }
  .ch-table td {
    padding: 9px 14px; color: var(--g600); border-bottom: 1px solid var(--g100);
    vertical-align: middle; letter-spacing: -0.01em;
  }
  .ch-table tr:last-child td { border-bottom: none; }
  .ch-table tr:hover td { color: var(--g900); background: var(--g50); }

  .ch-stat { background: var(--w); border: 1px solid var(--g200); border-radius: 10px; padding: 13px 14px; }

  .ch-rank {
    display: flex; align-items: flex-start; gap: 11px;
    padding: 10px 0; border-bottom: 1px solid var(--g100);
  }
  .ch-rank:first-child { padding-top: 0; }
  .ch-rank:last-child { border-bottom: none; padding-bottom: 0; }

  .ch-action-item {
    display: flex; align-items: flex-start; gap: 9px;
    background: var(--w); border: 1px solid var(--g200);
    border-radius: 8px; padding: 8px 12px;
  }

  .ch-insight {
    display: flex; gap: 10px; align-items: flex-start;
    padding: 10px 13px; border-radius: 8px; border: 1px solid;
  }

  .ch-card { background: var(--g50); border: 1px solid var(--g200); border-radius: 12px; overflow: hidden; }
  .ch-card-header {
    padding: 10px 16px; background: var(--w);
    border-bottom: 1px solid var(--g200);
    display: flex; align-items: center; gap: 8px;
  }
  .ch-card-body { padding: 14px 16px; }

  /* Scroll-to-bottom button */
  .ch-scroll-btn {
    position: absolute; bottom: 100px; left: 50%; transform: translateX(-50%);
    width: 32px; height: 32px; border-radius: 50%;
    background: var(--w); border: 1px solid var(--g200);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; z-index: 10;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    transition: all 0.15s;
  }
  .ch-scroll-btn:hover { background: var(--g50); border-color: var(--g300); }

  .ch-shimmer {
    background: linear-gradient(90deg, var(--g100) 0%, var(--g50) 50%, var(--g100) 100%);
    background-size: 400px 100%;
    animation: ch-shimmer 1.5s ease infinite;
    border-radius: 6px;
  }
`;

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ─── Logo mark ────────────────────────────────────────────────────────────────

function AIMark({ size = 28 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: "#111827",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <svg width={size * 0.46} height={size * 0.46} viewBox="0 0 14 14" fill="none">
        <path
          d="M7 1C7 1 7.6 4.4 9 5.8C10.4 7.2 13 7 13 7C13 7 10.4 6.8 9 8.2C7.6 9.6 7 13 7 13C7 13 6.4 9.6 5 8.2C3.6 6.8 1 7 1 7C1 7 3.6 7.2 5 5.8C6.4 4.4 7 1 7 1Z"
          fill="white"
        />
      </svg>
    </div>
  );
}

// ─── Thinking bubble ──────────────────────────────────────────────────────────

function ThinkingBubble() {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
      <AIMark size={26} />
      <div style={{
        padding: "12px 16px", borderRadius: "4px 14px 14px 14px",
        background: "#f9fafb", border: "1px solid #e5e7eb",
        display: "flex", gap: 5, alignItems: "center",
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            display: "inline-block", width: 5, height: 5, borderRadius: "50%",
            background: "#9ca3af",
            animation: `ch-dot 1.2s ease-in-out ${i * 0.15}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── Block parser (identical logic, cleaned up) ───────────────────────────────

type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; items: string[] }
  | { type: "numbered"; items: string[] }
  | { type: "code"; lang: string; code: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "stats"; items: { label: string; value: string; accent?: string }[] }
  | { type: "ranked"; items: RankItem[] }
  | { type: "insight"; variant: "warning" | "success" | "info" | "danger"; text: string }
  | { type: "actions"; items: string[] };

interface RankItem {
  rank: number; name: string; amount?: string;
  tag?: string; tagColor?: string; note?: string; progress?: number;
}

function parseAmt(t: string) {
  return t.match(/[₹$€£]\s?[\d,]+(?:\.\d+)?(?:[KkMmBb])?|[\d,]+\s?(?:lakh|crore|thousand|million)/i)?.[0];
}

function riskTag(t: string): { tag: string; color: string } | null {
  if (/high.?risk|critical|urgent/i.test(t)) return { tag: "High risk", color: "#b91c1c" };
  if (/overdue|past.?due/i.test(t))           return { tag: "Overdue",   color: "#92400e" };
  if (/review/i.test(t))                       return { tag: "Review",    color: "#1e40af" };
  if (/settled|paid/i.test(t))                 return { tag: "Settled",   color: "#14532d" };
  return null;
}

function insightVariant(t: string): "warning" | "success" | "info" | "danger" {
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
        items.push({ rank, name, amount, tag: tag?.tag, tagColor: tag?.color, note, progress: Math.max(15, 100 - (rank - 1) * 14) });
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
          else if (/outstanding|overdue|due/i.test(label)) accent = "#92400e";
          else if (/risk|churn/i.test(label)) accent = "#b91c1c";
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

// ─── Inline renderer ──────────────────────────────────────────────────────────

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return <strong key={i} style={{ fontWeight: 600, color: "#111827" }}>{p.slice(2,-2)}</strong>;
        if (p.startsWith("`") && p.endsWith("`"))
          return <code key={i} style={{ fontFamily: "var(--mono)", fontSize: "12px", background: "#f3f4f6", padding: "1px 6px", borderRadius: 4, color: "#374151" }}>{p.slice(1,-1)}</code>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

// ─── Block renderers ──────────────────────────────────────────────────────────

function HeadingBlock({ level, text }: { level: 1|2|3; text: string }) {
  const sizes = { 1: "18px", 2: "15px", 3: "13.5px" };
  return (
    <div style={{
      fontFamily: level === 1 ? "var(--serif)" : "var(--sans)",
      fontSize: sizes[level], fontWeight: level === 1 ? 400 : 600,
      color: "#111827", letterSpacing: level === 1 ? "-0.02em" : "-0.015em",
      lineHeight: 1.25,
      paddingBottom: level < 3 ? "6px" : 0,
      borderBottom: level === 1 ? "1px solid #e5e7eb" : "none",
    }}>
      {text}
    </div>
  );
}

function ParagraphBlock({ text }: { text: string }) {
  return (
    <p style={{ fontSize: "13.5px", color: "#4b5563", lineHeight: 1.7, letterSpacing: "-0.01em", margin: 0 }}>
      <Inline text={text} />
    </p>
  );
}

function BulletBlock({ items }: { items: string[] }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: 9, fontSize: "13px", color: "#4b5563", lineHeight: 1.65 }}>
          <span style={{ color: "#9ca3af", flexShrink: 0, marginTop: 5, fontSize: 6 }}>◆</span>
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
        <li key={i} style={{ display: "flex", gap: 9, fontSize: "13px", color: "#4b5563", lineHeight: 1.65 }}>
          <span style={{
            flexShrink: 0, width: 18, height: 18, borderRadius: 5,
            background: "#f3f4f6", border: "1px solid #e5e7eb",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "10px", fontWeight: 600, color: "#6b7280", marginTop: 2,
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
        <span style={{ fontSize: "10.5px", color: "#9ca3af", fontFamily: "var(--mono)" }}>{lang}</span>
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
          <div style={{ fontSize: "9.5px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
            {s.label}
          </div>
          <div style={{ fontFamily: "var(--serif)", fontSize: "21px", fontWeight: 400, color: s.accent || "#111827", letterSpacing: "-0.02em", lineHeight: 1 }}>
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
        <div style={{ width: 16, height: 16, borderRadius: 4, background: "#111827", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="8" height="8" viewBox="0 0 14 14" fill="none">
            <path d="M7 1C7 1 7.6 4.4 9 5.8C10.4 7.2 13 7 13 7C13 7 10.4 6.8 9 8.2C7.6 9.6 7 13 7 13C7 13 6.4 9.6 5 8.2C3.6 6.8 1 7 1 7C1 7 3.6 7.2 5 5.8C6.4 4.4 7 1 7 1Z" fill="white"/>
          </svg>
        </div>
        <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#4b5563", letterSpacing: "-0.01em" }}>Ranked results</span>
      </div>
      <div className="ch-card-body">
        {items.map((item, idx) => (
          <div key={idx} className="ch-rank ch-slide" style={{ animationDelay: `${idx * 0.04}s` }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0,
              background: idx === 0 ? "#111827" : "#f3f4f6",
              border: `1px solid ${idx === 0 ? "#111827" : "#e5e7eb"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "10.5px", fontWeight: 600, color: idx === 0 ? "#fff" : "#6b7280",
              marginTop: 1,
            }}>
              {item.rank}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "#111827", letterSpacing: "-0.015em" }}>{item.name}</span>
                {item.tag && (
                  <span style={{
                    fontSize: "10px", fontWeight: 600, padding: "1px 7px", borderRadius: 99,
                    letterSpacing: "0.04em", textTransform: "uppercase",
                    background: item.tagColor ? item.tagColor + "14" : "#f3f4f6",
                    color: item.tagColor || "#4b5563",
                    border: `1px solid ${item.tagColor ? item.tagColor + "28" : "#e5e7eb"}`,
                  }}>
                    {item.tag}
                  </span>
                )}
                {item.amount && (
                  <span style={{ fontFamily: "var(--serif)", fontSize: "15px", color: "#111827", letterSpacing: "-0.02em", marginLeft: "auto" }}>
                    {item.amount}
                  </span>
                )}
              </div>
              {item.note && <div style={{ fontSize: "12px", color: "#6b7280", marginTop: 3, lineHeight: 1.5 }}>{item.note}</div>}
              {item.progress !== undefined && (
                <div style={{ height: 2, borderRadius: 99, background: "#f3f4f6", marginTop: 7, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 99, width: `${item.progress}%`, background: "#111827", transition: "width 0.6s ease" }} />
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
  const map: Record<string, { bg: string; border: string; accent: string; icon: string }> = {
    warning: { bg: "#fffbeb", border: "#fde68a", accent: "#92400e", icon: "⚠" },
    success: { bg: "#f0fdf4", border: "#d1fae5", accent: "#14532d", icon: "✓" },
    danger:  { bg: "#fef2f2", border: "#fecaca", accent: "#b91c1c", icon: "✗" },
    info:    { bg: "#eff6ff", border: "#bfdbfe", accent: "#1e40af", icon: "ℹ" },
  };
  const c = map[variant] || map.info;
  return (
    <div className="ch-insight" style={{ background: c.bg, borderColor: c.border }}>
      <span style={{ fontSize: "12px", color: c.accent, flexShrink: 0, lineHeight: 1.7, fontWeight: 600 }}>{c.icon}</span>
      <span style={{ fontSize: "13px", color: "#374151", lineHeight: 1.65, letterSpacing: "-0.01em" }}>
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
            width: 16, height: 16, borderRadius: 4, flexShrink: 0,
            border: "1px solid #d1d5db", background: "#f9fafb",
            display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2,
          }}>
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2.5 2.5L8 2.5" stroke="#9ca3af" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: "12.5px", color: "#374151", lineHeight: 1.55, letterSpacing: "-0.01em" }}>
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

// ─── Message bubbles ──────────────────────────────────────────────────────────

function UserBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <div style={{
          padding: "11px 16px",
          borderRadius: "18px 4px 18px 18px",
          background: "#111827",
          color: "#ffffff",
          fontSize: "14px",
          lineHeight: 1.6,
          letterSpacing: "-0.01em",
        }}>
          {msg.text}
        </div>
        <span style={{ fontSize: "10.5px", color: "#9ca3af", paddingRight: 2 }}>
          {fmtTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
}

function AssistantBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <AIMark size={28} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "4px 18px 18px 18px",
          padding: "14px 18px",
        }}>
          <ResponseRenderer text={msg.text} />
        </div>
        <span style={{ fontSize: "10.5px", color: "#9ca3af", paddingLeft: 2 }}>
          {fmtTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function ChatHeader({ hasMessages, onClear }: { hasMessages: boolean; onClear: () => void }) {
  return (
    <div style={{
      borderBottom: "1px solid #e5e7eb",
      padding: "12px 24px",
      display: "flex", alignItems: "center", gap: 12,
      background: "#ffffff",
      flexShrink: 0,
    }}>
      <AIMark size={26} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827", letterSpacing: "-0.02em" }}>
          Collections AI
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
          <span style={{
            width: 5, height: 5, borderRadius: "50%", background: "#22c55e",
            display: "inline-block",
          }} />
          <span style={{ fontSize: "11px", color: "#9ca3af", letterSpacing: "-0.01em" }}>
            Live · Stripe & HubSpot connected
          </span>
        </div>
      </div>
      {hasMessages && (
        <button
          onClick={onClear}
          style={{
            background: "none", border: "1px solid #e5e7eb", borderRadius: 7,
            padding: "5px 12px", cursor: "pointer", fontSize: "12px",
            color: "#6b7280", fontFamily: "var(--sans)", letterSpacing: "-0.01em",
            transition: "all 0.1s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#111827"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#6b7280"; }}
        >
          Clear chat
        </button>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { text: "Who should I call today?",           icon: "📞" },
  { text: "Show all overdue invoices",           icon: "⏰" },
  { text: "Which customers are at churn risk?",  icon: "⚠️" },
  { text: "Revenue summary this month",          icon: "📊" },
  { text: "Show highest outstanding balances",   icon: "💰" },
  { text: "Who pays late but always converts?",  icon: "🔄" },
];

function EmptyState({ onSend }: { onSend: (t: string) => void }) {
  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 32px 32px",
      gap: 32,
    }}>
      <div style={{ textAlign: "center" }} className="ch-fade-up">
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: "#111827",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 18px",
        }}>
          <svg width="22" height="22" viewBox="0 0 14 14" fill="none">
            <path d="M7 1C7 1 7.6 4.4 9 5.8C10.4 7.2 13 7 13 7C13 7 10.4 6.8 9 8.2C7.6 9.6 7 13 7 13C7 13 6.4 9.6 5 8.2C3.6 6.8 1 7 1 7C1 7 3.6 7.2 5 5.8C6.4 4.4 7 1 7 1Z" fill="white"/>
          </svg>
        </div>
        <h1 style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: "clamp(26px, 3vw, 36px)",
          fontWeight: 400, color: "#111827",
          letterSpacing: "-0.025em", lineHeight: 1.1, margin: "0 0 10px",
        }}>
          Ask <em style={{ fontStyle: "italic" }}>anything.</em>
        </h1>
        <p style={{
          fontSize: "13.5px", color: "#6b7280", lineHeight: 1.65,
          margin: "0 auto", maxWidth: 310, letterSpacing: "-0.01em",
        }}>
          Collections intelligence across invoices, customers, and revenue — live from your database.
        </p>
      </div>

      <div style={{
        width: "100%", maxWidth: 440,
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6,
      }} className="ch-fade-up">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={s.text}
            className="ch-chip"
            onClick={() => onSend(s.text)}
            style={{ animationDelay: `${0.05 + i * 0.04}s` }}
          >
            <span style={{ fontSize: 13 }}>{s.icon}</span>
            <span style={{ flex: 1 }}>{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Input bar ────────────────────────────────────────────────────────────────

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
      borderTop: "1px solid #e5e7eb",
      padding: "10px 24px 16px",
      background: "#ffffff",
      flexShrink: 0,
    }}>
      {/* Quick pill suggestions — shown after first message */}
      {hasMessages && !loading && (
        <div style={{ display: "flex", gap: 6, marginBottom: 10, overflowX: "auto", paddingBottom: 2 }}>
          {QUICK.map(s => (
            <button key={s} className="ch-pill" onClick={() => onSend(s)}>{s}</button>
          ))}
        </div>
      )}

      {/* Input box — ChatGPT-style pill */}
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div
          className="ch-input-wrap"
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 10,
            background: focused ? "#ffffff" : "#f9fafb",
            borderRadius: 28,
            padding: "10px 12px 10px 20px",
            border: `1px solid ${focused ? "#9ca3af" : "#e5e7eb"}`,
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
            placeholder="Ask about customers, invoices, call priorities…"
            rows={1}
            style={{
              flex: 1, border: "none", background: "transparent",
              fontSize: "14px", color: "#111827", lineHeight: 1.6,
              fontFamily: "var(--sans)", maxHeight: 120, overflowY: "auto",
              paddingTop: 4, letterSpacing: "-0.01em",
            }}
            onInput={e => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
            }}
          />

       

          {/* Send button */}
          <button
            className="ch-send"
            onClick={send}
            disabled={!canSend}
            style={{
              width: 34, height: 34, borderRadius: "50%", border: "none",
              background: canSend ? "#111827" : "#e5e7eb",
              cursor: canSend ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 12V2M3 6l4-4 4 4"
                stroke={canSend ? "#ffffff" : "#9ca3af"}
                strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <p style={{
          fontSize: "11px", color: "#9ca3af", textAlign: "center",
          margin: "8px 0 0", letterSpacing: "-0.01em",
        }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Chat() {
  const dispatch = useDispatch<AppDispatch>();
  const { messages, loading } = useSelector((state: RootState) => state.chat);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Show scroll-to-bottom button when user has scrolled up
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 200);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const send = useCallback((text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    dispatch(sendMessage(t));
  }, [dispatch, loading]);

  const isEmpty = messages.length === 0;

  return (
    <div className="ch">
      <style>{css}</style>

      {/* ── Fixed header ── */}
      <ChatHeader hasMessages={!isEmpty} onClear={() => dispatch(clearChat())} />

      {/* ── Scrollable message area ── */}
      <div
        ref={scrollRef}
        className="ch-scroll"
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {isEmpty ? (
          <EmptyState onSend={send} />
        ) : (
          <div style={{
            maxWidth: 720,
            width: "100%",
            margin: "0 auto",
            padding: "32px 24px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}>
            {messages.map(msg => (
              <div key={msg.id} className="ch-msg-in">
                {msg.role === "user" ? <UserBubble msg={msg} /> : <AssistantBubble msg={msg} />}
              </div>
            ))}
            {loading && (
              <div className="ch-msg-in">
                <ThinkingBubble />
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollBtn && !isEmpty && (
        <button className="ch-scroll-btn" onClick={scrollToBottom} title="Scroll to bottom">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M3 8l4 4 4-4" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* ── Fixed input bar ── */}
      <InputBar onSend={send} loading={loading} hasMessages={!isEmpty} />
    </div>
  );
}