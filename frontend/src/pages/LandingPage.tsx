"use client";
import React, { useState, useEffect, useRef } from "react";

interface LandingPageProps {
  onEnterApp: () => void;
}

// ── Static chat demo data ──────────────────────────────────────────────────
const CHAT_DEMO = [
  {
    role: "user",
    text: "Who should I call today?",
  },
  {
    role: "ai",
    text: "**Call Acme Corp first.** ₹1,20,000 overdue, 18 days late. Email opened 5× but no reply in 6 days. Historically responds best to direct calls — optimal time: tomorrow 11:30 AM.\n\nNext: Nova LLC (₹48,500, engagement dropped sharply after becoming overdue).",
    actions: ["Call Acme Corp", "Draft email"],
  },
  {
    role: "user",
    text: "Which invoices are at highest risk of ghosting?",
  },
  {
    role: "ai",
    text: "**3 invoices are high-risk right now:**\n\n1. Acme Corp — ₹1,20,000 · 18 days overdue · 62% recovery\n2. Orbit Tech — ₹1,85,000 · 12 days overdue · 58% recovery\n3. Nova LLC — ₹48,500 · 7 days overdue · 74% recovery\n\nAll three show engagement drops after the invoice due date. Recommend direct outreach within 24h.",
    actions: ["Show all overdue", "Bulk follow-up"],
  },
  {
    role: "user",
    text: "Generate a follow-up email for Acme Corp",
  },
  {
    role: "ai",
    text: "**Draft ready for Acme Corp:**\n\nSubject: Invoice #042 – Quick follow-up\n\nHi Rahul, following up on Invoice #042 for ₹1,20,000 due March 5. I noticed you've reviewed it a few times — happy to answer any questions or explore a payment plan if helpful.\n\nLet me know the best way to move forward.",
    actions: ["Send now", "Edit draft", "Change tone"],
  },
];

export default function LandingPage({ onEnterApp }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Build flat message list from pairs
  const allMessages: { role: string; text: string; actions?: string[] }[] = [];
  CHAT_DEMO.forEach(m => allMessages.push(m));

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setVisibleMessages(v => {
          if (v >= allMessages.length) {
            setIsPlaying(false);
            return v;
          }
          return v + 1;
        });
      }, 1200);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [visibleMessages]);

  const handlePlayReset = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else if (visibleMessages >= allMessages.length) {
      setVisibleMessages(1);
      setTimeout(() => setIsPlaying(true), 100);
    } else {
      setIsPlaying(true);
    }
  };

  const tabs = ["Journey", "Ask AI", "Actions", "Activity"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --white: #ffffff;
          --gray-50: #f9fafb;
          --gray-100: #f3f4f6;
          --gray-200: #e5e7eb;
          --gray-300: #d1d5db;
          --gray-400: #9ca3af;
          --gray-500: #6b7280;
          --gray-600: #4b5563;
          --gray-700: #374151;
          --gray-800: #1f2937;
          --gray-900: #111827;
          --gray-950: #030712;
          --green-50: #f0fdf4;
          --green-100: #dcfce7;
          --green-500: #22c55e;
          --green-600: #16a34a;
          --green-700: #15803d;
          --amber-50: #fffbeb;
          --amber-100: #fef3c7;
          --amber-500: #f59e0b;
          --amber-700: #b45309;
          --red-50: #fef2f2;
          --red-100: #fee2e2;
          --red-500: #ef4444;
          --red-700: #b91c1c;
          --blue-50: #eff6ff;
          --blue-100: #dbeafe;
          --blue-500: #3b82f6;
          --blue-700: #1d4ed8;
          --violet-50: #f5f3ff;
          --violet-100: #ede9fe;
          --violet-500: #8b5cf6;
          --violet-700: #6d28d9;
          --font-display: 'Instrument Serif', Georgia, serif;
          --font-sans: 'Geist', -apple-system, system-ui, sans-serif;
        }

        html { scroll-behavior: smooth; }
        body {
          font-family: var(--font-sans);
          background: var(--white);
          color: var(--gray-900);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        /* ─── NAV ─── */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 32px; height: 56px;
          transition: all 0.2s;
        }
        .nav.scrolled {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(24px) saturate(180%);
          border-bottom: 1px solid var(--gray-200);
        }
        .nav-logo { font-weight: 600; font-size: 15px; color: var(--gray-900); letter-spacing: -0.03em; text-decoration: none; }
        .nav-links {
          display: flex; align-items: center; gap: 32px;
          position: absolute; left: 50%; transform: translateX(-50%);
        }
        .nav-links a { font-size: 13.5px; font-weight: 400; color: var(--gray-500); text-decoration: none; letter-spacing: -0.01em; transition: color 0.12s; }
        .nav-links a:hover { color: var(--gray-900); }
        .nav-actions { display: flex; align-items: center; gap: 6px; }
        .btn-nav-ghost { padding: 5px 12px; border-radius: 7px; border: none; background: transparent; color: var(--gray-500); font-size: 13px; font-family: var(--font-sans); font-weight: 400; cursor: pointer; transition: all 0.12s; letter-spacing: -0.01em; }
        .btn-nav-ghost:hover { color: var(--gray-900); background: var(--gray-100); }
        .btn-nav-solid { padding: 6px 14px; border-radius: 7px; border: none; background: var(--gray-900); color: var(--white); font-size: 13px; font-family: var(--font-sans); font-weight: 500; cursor: pointer; letter-spacing: -0.01em; transition: opacity 0.12s; }
        .btn-nav-solid:hover { opacity: 0.85; }

        /* ─── HERO ─── */
        .hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 140px 32px 100px; text-align: center; background: var(--white); }
        .hero-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px 4px 8px; border-radius: 100px; border: 1px solid var(--gray-200); background: var(--white); font-size: 12px; font-weight: 500; color: var(--gray-500); margin-bottom: 28px; letter-spacing: -0.01em; }
        .hero-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green-500); box-shadow: 0 0 0 3px rgba(34,197,94,0.18); }
        .hero-h1 { font-family: var(--font-display); font-size: clamp(48px, 7vw, 88px); font-weight: 400; line-height: 1.04; letter-spacing: -0.03em; color: var(--gray-900); max-width: 820px; margin-bottom: 22px; }
        .hero-h1 em { font-style: italic; }
        .hero-sub { font-size: 16.5px; line-height: 1.7; color: var(--gray-500); max-width: 440px; font-weight: 400; letter-spacing: -0.01em; margin-bottom: 36px; }
        .hero-ctas { display: flex; gap: 8px; align-items: center; margin-bottom: 80px; }
        .btn-primary { padding: 10px 22px; border-radius: 8px; border: none; background: var(--gray-900); color: var(--white); font-size: 13.5px; font-family: var(--font-sans); font-weight: 500; cursor: pointer; letter-spacing: -0.02em; transition: opacity 0.12s; }
        .btn-primary:hover { opacity: 0.82; }
        .btn-secondary { padding: 10px 22px; border-radius: 8px; border: 1px solid var(--gray-200); background: var(--white); color: var(--gray-600); font-size: 13.5px; font-family: var(--font-sans); font-weight: 400; cursor: pointer; letter-spacing: -0.02em; transition: all 0.12s; }
        .btn-secondary:hover { background: var(--gray-50); border-color: var(--gray-300); }

        /* ─── HERO PREVIEW ─── */
        .preview-frame { width: 100%; max-width: 960px; border: 1px solid var(--gray-200); border-radius: 20px; padding: 5px; background: var(--gray-50); box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.06); }
        .preview-inner { border-radius: 16px; overflow: hidden; border: 1px solid var(--gray-200); background: var(--white); display: flex; height: 400px; }
        .preview-sidebar { width: 168px; flex-shrink: 0; background: var(--gray-50); border-right: 1px solid var(--gray-200); padding: 14px 0; }
        .sidebar-brand { display: flex; align-items: center; gap: 7px; padding: 0 12px 12px; border-bottom: 1px solid var(--gray-200); margin-bottom: 6px; }
        .sidebar-brand-mark { width: 20px; height: 20px; border-radius: 5px; background: var(--gray-900); display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 700; color: var(--white); letter-spacing: -0.02em; flex-shrink: 0; }
        .sidebar-brand-name { font-size: 12px; font-weight: 600; color: var(--gray-900); letter-spacing: -0.025em; }
        .sidebar-item { display: flex; align-items: center; gap: 7px; padding: 6px 12px; font-size: 11.5px; color: var(--gray-500); cursor: pointer; transition: all 0.1s; }
        .sidebar-item.active { background: var(--white); color: var(--gray-900); font-weight: 500; border-right: 2px solid var(--gray-900); }
        .sidebar-item:hover:not(.active) { background: var(--gray-100); color: var(--gray-700); }
        .preview-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .preview-topbar { height: 42px; border-bottom: 1px solid var(--gray-200); display: flex; align-items: center; justify-content: space-between; padding: 0 18px; flex-shrink: 0; background: var(--white); }
        .topbar-title { font-size: 12px; font-weight: 500; color: var(--gray-900); letter-spacing: -0.025em; }
        .topbar-actions { display: flex; gap: 10px; }
        .topbar-action { font-size: 11px; color: var(--gray-400); cursor: pointer; transition: color 0.1s; }
        .topbar-action:hover { color: var(--gray-600); }
        .feed-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 18px; border-bottom: 1px solid var(--gray-100); transition: background 0.08s; cursor: default; }
        .feed-item:hover { background: var(--gray-50); }
        .feed-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
        .feed-title { font-size: 11.5px; font-weight: 500; color: var(--gray-900); line-height: 1.4; margin-bottom: 2px; }
        .feed-sub { font-size: 10.5px; color: var(--gray-400); line-height: 1.4; margin-bottom: 5px; }
        .feed-meta { display: flex; align-items: center; gap: 8px; }
        .feed-prob { font-size: 10px; font-weight: 600; }
        .feed-action-btn { padding: 1px 8px; border-radius: 4px; border: 1px solid var(--gray-200); background: var(--white); font-size: 10px; font-weight: 400; cursor: pointer; color: var(--gray-500); font-family: var(--font-sans); transition: all 0.1s; }
        .feed-action-btn:hover { border-color: var(--gray-300); color: var(--gray-700); }
        .feed-time { font-size: 10px; color: var(--gray-400); flex-shrink: 0; }

        /* ─── SECTIONS ─── */
        .section { padding: 96px 32px; }
        .section-wrap { max-width: 1080px; margin: 0 auto; }
        .section-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; color: var(--gray-400); text-transform: uppercase; margin-bottom: 10px; }
        .section-h2 { font-family: var(--font-display); font-size: clamp(32px, 4vw, 50px); font-weight: 400; line-height: 1.1; letter-spacing: -0.03em; color: var(--gray-900); margin-bottom: 12px; }
        .section-h2 em { font-style: italic; }
        .section-desc { font-size: 14.5px; line-height: 1.7; color: var(--gray-500); max-width: 360px; font-weight: 400; letter-spacing: -0.01em; }
        .section-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 48px; margin-bottom: 48px; }

        /* ─── TABS ─── */
        .tab-bar { display: inline-flex; gap: 2px; margin-bottom: 36px; background: var(--gray-100); border-radius: 10px; padding: 3px; }
        .tab-btn { padding: 7px 18px; border-radius: 8px; border: none; background: transparent; font-size: 13px; font-family: var(--font-sans); font-weight: 400; color: var(--gray-500); cursor: pointer; transition: all 0.15s; letter-spacing: -0.01em; }
        .tab-btn.active { background: var(--white); color: var(--gray-900); font-weight: 500; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 1px rgba(0,0,0,0.04); }
        .tab-btn:hover:not(.active) { color: var(--gray-700); }

        /* ─── GRID ─── */
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
        .grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }

        /* ─── CARDS ─── */
        .card { background: var(--white); border: 1px solid var(--gray-200); border-radius: 16px; overflow: hidden; }
        .card-body { padding: 24px 24px 0; }
        .card-title { font-size: 14px; font-weight: 500; color: var(--gray-900); letter-spacing: -0.025em; margin-bottom: 6px; }
        .card-desc { font-size: 12.5px; line-height: 1.65; color: var(--gray-500); margin-bottom: 20px; font-weight: 400; max-width: 300px; }
        .card-visual { display: flex; justify-content: center; }
        .card-window { background: var(--white); border: 1px solid var(--gray-200); border-radius: 10px 10px 0 0; padding: 14px 16px 0; width: 100%; max-width: 320px; }
        .card-window-title { font-size: 11px; font-weight: 600; color: var(--gray-900); letter-spacing: -0.025em; margin-bottom: 12px; }

        /* ─── TIMELINE ─── */
        .tl-row { display: flex; gap: 9px; margin-bottom: 8px; position: relative; }
        .tl-dot { width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 7px; flex-shrink: 0; z-index: 1; border: 1.5px solid; }
        .tl-label { font-size: 11px; font-weight: 500; color: var(--gray-900); }
        .tl-sub { font-size: 9.5px; color: var(--gray-400); margin-top: 1px; }
        .tl-line { position: absolute; left: 8px; top: 20px; bottom: -8px; width: 1px; background: var(--gray-200); }

        /* ─── INSIGHT CARDS ─── */
        .insight-card { border-radius: 9px; padding: 10px 12px; margin-bottom: 7px; }
        .insight-tag { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 5px; display: flex; align-items: center; gap: 5px; }
        .insight-text { font-size: 11px; line-height: 1.55; }

        /* ─── CHAT ─── */
        .chat-bubble { border-radius: 10px; padding: 9px 12px; font-size: 11px; line-height: 1.55; max-width: 230px; }
        .chat-user { background: var(--gray-100); color: var(--gray-600); align-self: flex-end; }
        .chat-ai { background: var(--green-50); color: var(--green-700); border: 1px solid var(--green-100); }

        /* ─── ACTION PILL ─── */
        .action-pill { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 6px; font-size: 10.5px; font-weight: 500; font-family: var(--font-sans); cursor: pointer; border: 1px solid var(--gray-200); background: var(--white); color: var(--gray-700); transition: all 0.1s; }
        .action-pill:hover { background: var(--gray-50); border-color: var(--gray-300); }
        .action-pill-dark { background: var(--gray-900); color: var(--white); border-color: var(--gray-900); }
        .action-pill-dark:hover { opacity: 0.85; }

        /* ─── CHIP ─── */
        .chip { padding: 3px 9px; border-radius: 5px; font-size: 9.5px; font-weight: 500; cursor: pointer; font-family: var(--font-sans); border: none; }
        .chip-dark { background: var(--gray-900); color: var(--white); }
        .chip-light { background: var(--white); color: var(--gray-500); border: 1px solid var(--gray-200); }

        /* ─── SIDE-BY-SIDE CARD ─── */
        .split-card { background: var(--white); border: 1px solid var(--gray-200); border-radius: 16px; display: flex; overflow: hidden; min-height: 180px; }
        .split-card-body { flex: 1; padding: 24px 20px 24px 24px; display: flex; flex-direction: column; justify-content: flex-start; }
        .split-card-visual { width: 200px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; padding: 20px 16px; background: var(--gray-50); border-left: 1px solid var(--gray-200); }

        /* ─── STAT CARDS ─── */
        .stat-card { background: var(--white); border: 1px solid var(--gray-200); border-radius: 16px; padding: 22px 20px; display: flex; flex-direction: column; }
        .stat-icon { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--gray-200); display: flex; align-items: center; justify-content: center; font-size: 14px; margin-bottom: 12px; }
        .stat-title { font-size: 13px; font-weight: 500; color: var(--gray-900); letter-spacing: -0.02em; margin-bottom: 4px; }
        .stat-desc { font-size: 12px; color: var(--gray-500); line-height: 1.6; }

        /* ─── BENEFIT CARD ─── */
        .benefit-card { background: var(--white); border: 1px solid var(--gray-200); border-radius: 16px; padding: 22px 20px; display: flex; flex-direction: column; min-height: 240px; }
        .benefit-title { font-size: 13.5px; font-weight: 500; color: var(--gray-900); letter-spacing: -0.025em; margin-bottom: 5px; }
        .benefit-desc { font-size: 12px; color: var(--gray-500); line-height: 1.62; margin-bottom: 18px; }

        /* ─── INTEGRATION BADGE ─── */
        .int-badge { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 8px; margin-bottom: 5px; background: var(--white); border: 1px solid var(--gray-200); }
        .int-name { font-size: 11.5px; font-weight: 500; color: var(--gray-900); }
        .int-sub { font-size: 10px; color: var(--gray-400); }
        .int-status { width: 5px; height: 5px; border-radius: 50%; background: var(--green-500); margin-left: auto; flex-shrink: 0; }

        /* ─── DEMO CHAT ─── */
        .demo-chat-wrap {
          background: var(--white); border: 1px solid var(--gray-200);
          border-radius: 16px; overflow: hidden;
          display: flex; flex-direction: column;
        }
        .demo-chat-header {
          padding: 12px 16px; border-bottom: 1px solid var(--gray-200);
          background: var(--gray-50);
          display: flex; align-items: center; justify-content: space-between;
        }
        .demo-chat-title { font-size: 12px; font-weight: 600; color: var(--gray-900); letter-spacing: -0.025em; display: flex; align-items: center; gap: 7px; }
        .demo-chat-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green-500); animation: pulse-dot 2.5s ease-in-out infinite; }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .demo-chat-body { flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; max-height: 440px; scroll-behavior: smooth; }
        .demo-chat-body::-webkit-scrollbar { width: 4px; }
        .demo-chat-body::-webkit-scrollbar-thumb { background: var(--gray-200); border-radius: 99px; }
        .demo-msg-in { animation: msg-in 0.25s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes msg-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .demo-user-bubble {
          align-self: flex-end;
          background: var(--gray-900); color: #fff;
          padding: 9px 14px; border-radius: 14px 3px 14px 14px;
          font-size: 12.5px; line-height: 1.6; max-width: 72%;
          font-weight: 400; letter-spacing: -0.01em;
        }
        .demo-ai-row { display: flex; gap: 9px; align-items: flex-start; }
        .demo-ai-mark { width: 22px; height: 22px; border-radius: 6px; background: var(--gray-900); display: flex; align-items: center; justify-content: center; font-size: 7px; font-weight: 700; color: var(--white); letter-spacing: -0.02em; flex-shrink: 0; margin-top: 2px; }
        .demo-ai-bubble {
          background: var(--gray-50); border: 1px solid var(--gray-200);
          padding: 11px 14px; border-radius: 3px 14px 14px 14px;
          font-size: 12px; line-height: 1.65; color: var(--gray-700);
          letter-spacing: -0.01em; flex: 1;
        }
        .demo-ai-actions { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
        .demo-ai-action-btn {
          padding: 4px 11px; border-radius: 6px;
          border: 1px solid var(--gray-200); background: var(--white);
          font-size: 10.5px; font-weight: 500; color: var(--gray-700);
          font-family: var(--font-sans); cursor: pointer; letter-spacing: -0.01em;
          transition: all 0.1s;
        }
        .demo-ai-action-btn:first-child { background: var(--gray-900); color: var(--white); border-color: var(--gray-900); }
        .demo-ai-action-btn:hover:not(:first-child) { background: var(--gray-50); border-color: var(--gray-300); }
        .demo-typing { display: flex; gap: 4px; align-items: center; padding: 10px 14px; }
        @keyframes demo-dot { 0%,80%,100%{transform:scale(0.5);opacity:0.25} 40%{transform:scale(1);opacity:0.8} }
        .demo-chat-footer {
          padding: 10px 14px; border-top: 1px solid var(--gray-200);
          display: flex; align-items: center; justify-content: space-between;
          background: var(--white);
        }
        .demo-input-mock {
          flex: 1; background: var(--gray-50); border: 1px solid var(--gray-200);
          border-radius: 8px; padding: 8px 12px;
          font-size: 11.5px; color: var(--gray-400); letter-spacing: -0.01em;
          font-family: var(--font-sans);
        }
        .demo-play-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 8px;
          border: none; cursor: pointer;
          font-size: 11.5px; font-weight: 500; font-family: var(--font-sans);
          letter-spacing: -0.01em; margin-left: 8px; transition: opacity 0.12s;
          background: var(--gray-900); color: var(--white);
        }
        .demo-play-btn:hover { opacity: 0.82; }
        .demo-play-btn.playing { background: var(--gray-100); color: var(--gray-700); }

        /* ─── CTA ─── */
        .cta-wrap { margin: 0 32px 72px; }
        .cta-block { background: var(--gray-950); border-radius: 20px; padding: 80px 48px; text-align: center; }
        .cta-h2 { font-family: var(--font-display); font-size: clamp(36px, 4.5vw, 60px); font-weight: 400; color: var(--white); letter-spacing: -0.03em; line-height: 1.08; margin-bottom: 14px; }
        .cta-h2 em { font-style: italic; }
        .cta-p { font-size: 14.5px; color: rgba(255,255,255,0.45); max-width: 360px; margin: 0 auto 32px; line-height: 1.7; }
        .btn-cta { padding: 10px 24px; border-radius: 8px; background: var(--white); color: var(--gray-900); font-size: 13.5px; font-family: var(--font-sans); font-weight: 500; border: none; cursor: pointer; letter-spacing: -0.02em; transition: opacity 0.12s; }
        .btn-cta:hover { opacity: 0.88; }

        /* ─── FOOTER ─── */
        .footer { padding: 24px 32px; border-top: 1px solid var(--gray-200); display: flex; align-items: center; justify-content: space-between; }
        .footer-logo { font-size: 13px; font-weight: 600; color: var(--gray-900); letter-spacing: -0.025em; }
        .footer-copy { font-size: 11.5px; color: var(--gray-400); }
        .footer-links { display: flex; gap: 18px; }
        .footer-links a { font-size: 11.5px; color: var(--gray-400); text-decoration: none; transition: color 0.1s; }
        .footer-links a:hover { color: var(--gray-600); }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 860px) {
          .nav-links { display: none; }
          .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
          .section-header { flex-direction: column; gap: 12px; }
          .section { padding: 64px 20px; }
          .hero { padding: 110px 20px 72px; }
          .preview-inner { height: auto; flex-direction: column; }
          .preview-sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--gray-200); padding: 10px 0; display: flex; flex-direction: row; gap: 0; }
          .sidebar-brand { display: none; }
          .sidebar-item { padding: 6px 10px; }
          .split-card { flex-direction: column; }
          .split-card-visual { width: 100%; border-left: none; border-top: 1px solid var(--gray-200); }
          .cta-wrap { margin: 0 16px 60px; }
          .cta-block { padding: 60px 24px; }
          .nav { padding: 0 20px; }
          .tab-bar { flex-wrap: wrap; }
        }
      `}</style>

      <div style={{ fontFamily: "var(--font-sans)", background: "var(--white)", minHeight: "100vh" }}>

        {/* ── NAV ── */}
        <nav className={`nav${scrolled ? " scrolled" : ""}`}>
          <a href="#" className="nav-logo">inPay</a>
          <div className="nav-links">
            {["Product", "Solutions", "Pricing", "Company"].map(l => (
              <a key={l} href="#">{l}</a>
            ))}
          </div>
          <div className="nav-actions">
            <button className="btn-nav-ghost" onClick={onEnterApp}>Sign in</button>
            <button className="btn-nav-solid" onClick={onEnterApp}>Get started</button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="hero">
          <h1 className="hero-h1">
            Stop chasing invoices.<br /><em>Start closing them.</em>
          </h1>
          <p className="hero-sub">
            inPay reconstructs every customer's payment journey, surfaces real-time risk signals, and helps you act — so you recover more, faster.
          </p>
          <div className="hero-ctas">
            <button className="btn-primary" onClick={onEnterApp}>Get started free</button>
            <button className="btn-secondary" onClick={onEnterApp}>See how it works</button>
          </div>

          <div className="preview-frame">
            <div className="preview-inner">
              <div className="preview-sidebar">
                <div className="sidebar-brand">
                  <div className="sidebar-brand-mark">iP</div>
                  <span className="sidebar-brand-name">inPay</span>
                </div>
                {[
                  { label: "Activity", icon: "◫", active: true },
                  { label: "Journey", icon: "⬡" },
                  { label: "Ask AI", icon: "✦" },
                  { label: "Actions", icon: "◎" },
                ].map(item => (
                  <div key={item.label} className={`sidebar-item${item.active ? " active" : ""}`}>
                    <span style={{ fontSize: 11 }}>{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>
              <div className="preview-main">
                <div className="preview-topbar">
                  <span className="topbar-title">Live Activity Feed</span>
                  <div className="topbar-actions">
                    <span className="topbar-action">Filter</span>
                    <span className="topbar-action">Sort</span>
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {[
                    { dot: "#ef4444", title: "Acme Corp opened invoice 5× — never replied", sub: "₹1,20,000 · 18 days overdue · High risk", prob: "62%", probClr: "#ef4444", action: "Draft follow-up", time: "2m" },
                    { dot: "#f59e0b", title: "Nova LLC stopped engaging after overdue", sub: "₹48,500 · 7 days overdue · Engagement dropped", prob: "74%", probClr: "#f59e0b", action: "Schedule call", time: "14m" },
                    { dot: "#22c55e", title: "InPay reopened payment link twice today", sub: "₹2,80,000 · Strong payment intent detected", prob: "91%", probClr: "#22c55e", action: "Send nudge", time: "31m" },
                    { dot: "#f59e0b", title: "Orbit Tech email opened at 11:30 PM again", sub: "₹1,85,000 · 12 days overdue · Late-night pattern", prob: "58%", probClr: "#f59e0b", action: "Call AM", time: "1h" },
                    { dot: "#22c55e", title: "Zeta Retail clicked payment link", sub: "₹95,500 · 3 days overdue · High intent", prob: "88%", probClr: "#22c55e", action: "Nudge now", time: "2h" },
                  ].map((item, i) => (
                    <div key={i} className="feed-item">
                      <div className="feed-dot" style={{ background: item.dot }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="feed-title">{item.title}</div>
                        <div className="feed-sub">{item.sub}</div>
                        <div className="feed-meta">
                          <span className="feed-prob" style={{ color: item.probClr }}>{item.prob} recovery</span>
                          <button className="feed-action-btn">{item.action}</button>
                        </div>
                      </div>
                      <span className="feed-time">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="section" style={{ background: "var(--gray-50)" }}>
          <div className="section-wrap">
            <div className="section-header">
              <div>
                <div className="section-eyebrow">Platform</div>
                <h2 className="section-h2">Four surfaces.<br /><em>One revenue brain.</em></h2>
              </div>
              <p className="section-desc">
                inPay joins Stripe, HubSpot, and Gmail across Journey, AI, Actions, and Activity — every decision grounded in complete context.
              </p>
            </div>

            <div className="tab-bar">
              {tabs.map((t, i) => (
                <button key={t} className={`tab-btn${activeTab === i ? " active" : ""}`} onClick={() => setActiveTab(i)}>
                  {t}
                </button>
              ))}
            </div>

            {activeTab === 0 && (
              <div className="grid-2" style={{ marginBottom: 12 }}>
                <div className="card">
                  <div className="card-body">
                    <div className="card-title">Invoice Journey Graph</div>
                    <div className="card-desc">Click any customer to open a full relationship timeline — reconstructed from CRM, email, and invoice data.</div>
                  </div>
                  <div className="card-visual" style={{ alignItems: "flex-end" }}>
                    <div className="card-window">
                      <div className="card-window-title">Acme Corp · Payment Journey</div>
                      {[
                        { icon: "✓", label: "Deal Closed", sub: "Mar 2 · CRM synced", bg: "var(--green-50)", bc: "var(--green-500)", c: "var(--green-600)" },
                        { icon: "📄", label: "Contract Signed", sub: "Mar 4 · DocuSign event", bg: "var(--green-50)", bc: "var(--green-500)", c: "var(--green-600)" },
                        { icon: "→", label: "Invoice Sent · ₹1,20,000", sub: "Mar 5 · via Stripe", bg: "var(--blue-50)", bc: "var(--blue-500)", c: "var(--blue-700)" },
                        { icon: "◈", label: "Email Opened (3×)", sub: "Mar 8 — late night · AI: watch", bg: "var(--amber-50)", bc: "var(--amber-500)", c: "var(--amber-700)" },
                        { icon: "⚠", label: "No Reply · 18 days", sub: "AI: High Risk — call recommended", bg: "var(--red-50)", bc: "var(--red-500)", c: "var(--red-700)" },
                        { icon: "↗", label: "Follow-up Sent", sub: "Mar 27 · AI-drafted email", bg: "var(--violet-50)", bc: "var(--violet-500)", c: "var(--violet-700)" },
                      ].map((node, i, arr) => (
                        <div key={i} className="tl-row">
                          {i < arr.length - 1 && <div className="tl-line" />}
                          <div className="tl-dot" style={{ background: node.bg, borderColor: node.bc, color: node.c }}>{node.icon}</div>
                          <div>
                            <div className="tl-label">{node.label}</div>
                            <div className="tl-sub">{node.sub}</div>
                          </div>
                        </div>
                      ))}
                      <div style={{ height: 16 }} />
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body">
                    <div className="card-title">AI Insights at every node</div>
                    <div className="card-desc">Each node includes AI-generated insights, quick actions, and contextual recommendations.</div>
                  </div>
                  <div className="card-visual" style={{ alignItems: "flex-end" }}>
                    <div className="card-window">
                      <div className="card-window-title" style={{ color: "var(--gray-400)", textTransform: "uppercase", fontSize: 9.5, letterSpacing: "0.1em" }}>Node Insights</div>
                      {[
                        { bg: "var(--red-50)", border: "var(--red-100)", icon: "🕐", tag: "Behavior", tagClr: "var(--red-700)", text: "Customer repeatedly opens invoices late night — consider early morning outreach." },
                        { bg: "var(--amber-50)", border: "var(--amber-100)", icon: "📞", tag: "Channel", tagClr: "var(--amber-700)", text: "Historically responds better to direct calls than email." },
                        { bg: "var(--blue-50)", border: "var(--blue-100)", icon: "📉", tag: "Risk Signal", tagClr: "var(--blue-700)", text: "Engagement dropped after invoice amount increased by 40%." },
                      ].map((ins, i) => (
                        <div key={i} className="insight-card" style={{ background: ins.bg, border: `1px solid ${ins.border}` }}>
                          <div className="insight-tag" style={{ color: ins.tagClr }}><span>{ins.icon}</span>{ins.tag}</div>
                          <div className="insight-text" style={{ color: "var(--gray-700)" }}>{ins.text}</div>
                        </div>
                      ))}
                      <div style={{ height: 14 }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div className="grid-2" style={{ marginBottom: 12 }}>
                <div className="card">
                  <div className="card-body">
                    <div className="card-title">AI Collections Assistant</div>
                    <div className="card-desc">Ask operational questions in plain English. The agent joins Stripe, HubSpot, and Gmail — combining overdue invoices, engagement, and risk signals.</div>
                  </div>
                  <div className="card-visual" style={{ alignItems: "flex-end" }}>
                    <div className="card-window">
                      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <div className="chat-bubble chat-user">Who should I call today?</div>
                        </div>
                        <div style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--gray-900)", color: "var(--white)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>AI</div>
                          <div className="chat-bubble chat-ai">
                            <strong>Call Acme Corp first.</strong> ₹1,20,000 overdue, 18 days late. Historically responds best to direct calls.
                            <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
                              <button className="chip chip-dark">Call now</button>
                              <button className="chip chip-light">Draft email</button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style={{ height: 16 }} />
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body">
                    <div className="card-title">Business reasoning, not a chatbot</div>
                    <div className="card-desc">Ask anything across your revenue stack. The AI reasons across all your data and returns prioritized, actionable answers.</div>
                  </div>
                  <div className="card-visual" style={{ alignItems: "flex-end" }}>
                    <div className="card-window">
                      <div style={{ fontSize: 10, fontWeight: 500, color: "var(--gray-400)", marginBottom: 10, letterSpacing: "-0.01em" }}>Example questions</div>
                      {[
                        "Show highest revenue at risk this week",
                        "Which invoices were reopened multiple times?",
                        "Who usually pays late but eventually converts?",
                        "What's our average recovery time by segment?",
                      ].map((q, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 9px", borderRadius: 7, marginBottom: 4, background: "var(--gray-50)", border: "1px solid var(--gray-200)", cursor: "pointer" }}>
                          <span style={{ fontSize: 9, color: "var(--gray-400)" }}>✦</span>
                          <span style={{ fontSize: 11, color: "var(--gray-700)", lineHeight: 1.4 }}>{q}</span>
                        </div>
                      ))}
                      <div style={{ height: 14 }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 2 && (
              <div className="grid-2" style={{ marginBottom: 12 }}>
                <div className="card">
                  <div className="card-body">
                    <div className="card-title">AI-Powered Next Steps</div>
                    <div className="card-desc">After recommendations, inPay suggests executable next steps — personalized emails, optimal call times, and the right channel.</div>
                  </div>
                  <div className="card-visual" style={{ alignItems: "flex-end" }}>
                    <div className="card-window">
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gray-900)", marginBottom: 2, letterSpacing: "-0.02em" }}>Acme Corp · Next Steps</div>
                      <div style={{ fontSize: 10, color: "var(--gray-400)", marginBottom: 12 }}>₹1,20,000 overdue · 18 days</div>
                      <div style={{ background: "var(--green-50)", border: "1px solid var(--green-100)", borderRadius: 9, padding: "9px 11px", marginBottom: 7 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>✦ AI Draft Ready</div>
                        <div style={{ fontSize: 10.5, color: "var(--gray-700)", lineHeight: 1.5, marginBottom: 8 }}>"Hi Rahul, following up on Invoice #042 for ₹1,20,000 due March 5..."</div>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button className="action-pill action-pill-dark">Send Now</button>
                          <button className="action-pill">Edit Draft</button>
                        </div>
                      </div>
                      <div style={{ background: "var(--blue-50)", border: "1px solid var(--blue-100)", borderRadius: 9, padding: "9px 11px" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--blue-700)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>📞 Call Suggested</div>
                        <div style={{ fontSize: 10.5, color: "var(--gray-700)" }}>Tomorrow at 11:30 AM — highest historical response rate.</div>
                      </div>
                      <div style={{ height: 12 }} />
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body">
                    <div className="card-title">Intelligent assistance, not full automation</div>
                    <div className="card-desc">inPay keeps you in control with inline actions at every step — generate, review, and send with a single click.</div>
                  </div>
                  <div className="card-visual" style={{ alignItems: "flex-end" }}>
                    <div className="card-window">
                      {[
                        { icon: "✦", label: "Generate Email", desc: "Personalized draft based on customer history" },
                        { icon: "📤", label: "Send Now", desc: "One-click delivery via Gmail or SMTP" },
                        { icon: "📅", label: "Schedule Follow-up", desc: "AI picks the optimal time slot" },
                        { icon: "🎨", label: "Change Tone", desc: "Formal · Friendly · Firm · Urgent" },
                        { icon: "📞", label: "Log Call", desc: "Record outcome and auto-update journey" },
                      ].map((a, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "8px 9px", borderRadius: 7, marginBottom: 4, border: "1px solid var(--gray-200)", background: "var(--white)", cursor: "pointer" }}>
                          <span style={{ fontSize: 11, marginTop: 1 }}>{a.icon}</span>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--gray-900)" }}>{a.label}</div>
                            <div style={{ fontSize: 10, color: "var(--gray-400)", marginTop: 1 }}>{a.desc}</div>
                          </div>
                        </div>
                      ))}
                      <div style={{ height: 12 }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 3 && (
              <div className="grid-2" style={{ marginBottom: 12 }}>
                <div className="card">
                  <div className="card-body">
                    <div className="card-title">Live Revenue Intelligence Feed</div>
                    <div className="card-desc">Real-time risk signals from Stripe, HubSpot, and Resend — with urgency levels, AI explanations, and recovery probability on every event.</div>
                  </div>
                  <div className="card-visual" style={{ alignItems: "flex-end" }}>
                    <div style={{ background: "var(--white)", border: "1px solid var(--gray-200)", borderRadius: "10px 10px 0 0", width: "100%", maxWidth: 320, overflow: "hidden" }}>
                      {[
                        { dot: "#ef4444", urgency: "Critical", title: "Acme Corp opened invoice 5× — never replied", ai: "Direct call recommended within 24h.", prob: "62%", action: "Draft email", time: "2m" },
                        { dot: "#f59e0b", urgency: "Watch", title: "Nova LLC stopped engaging after overdue", ai: "Risk of ghosting is rising.", prob: "74%", action: "Schedule call", time: "14m" },
                        { dot: "#22c55e", urgency: "Opportunity", title: "InPay reopened payment link 2× today", ai: "Strong payment intent. Send nudge.", prob: "91%", action: "Send nudge", time: "31m" },
                      ].map((item, i) => (
                        <div key={i} className="feed-item">
                          <div className="feed-dot" style={{ background: item.dot }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                              <span style={{ fontSize: 9, fontWeight: 700, color: item.dot, textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.urgency}</span>
                              <span style={{ fontSize: 9.5, color: "var(--gray-400)" }}>· {item.time} ago</span>
                            </div>
                            <div className="feed-title">{item.title}</div>
                            <div className="feed-sub">✦ {item.ai}</div>
                            <div className="feed-meta">
                              <span className="feed-prob" style={{ color: item.dot }}>{item.prob} recovery</span>
                              <button className="feed-action-btn">{item.action}</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body">
                    <div className="card-title">Surface risks before they become losses</div>
                    <div className="card-desc">inPay continuously monitors for payment risks, engagement drops, and recovery opportunities.</div>
                  </div>
                  <div className="card-visual" style={{ alignItems: "flex-end" }}>
                    <div className="card-window">
                      {[
                        { icon: "⚡", bg: "var(--red-50)", border: "var(--red-100)", c: "var(--red-700)", title: "Payment risks", desc: "Overdue spikes, failed charges, bounced payments" },
                        { icon: "📉", bg: "var(--amber-50)", border: "var(--amber-100)", c: "var(--amber-700)", title: "Engagement drops", desc: "Email open rate decline, link click falloff" },
                        { icon: "✅", bg: "var(--green-50)", border: "var(--green-100)", c: "var(--green-700)", title: "Recovery opportunities", desc: "High payment intent signals worth acting on now" },
                      ].map((item, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "8px 9px", borderRadius: 7, marginBottom: 5, background: item.bg, border: `1px solid ${item.border}` }}>
                          <span style={{ fontSize: 12, marginTop: 1 }}>{item.icon}</span>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 500, color: item.c, marginBottom: 2 }}>{item.title}</div>
                            <div style={{ fontSize: 10.5, color: "var(--gray-500)" }}>{item.desc}</div>
                          </div>
                        </div>
                      ))}
                      <div style={{ height: 12 }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── WHY INPAY (with chat demo) ── */}
        <section className="section" style={{ background: "var(--white)" }}>
          <div className="section-wrap">
            <div className="section-header">
              <div>
                <div className="section-eyebrow">Why inPay</div>
                <h2 className="section-h2">Everything you need to<br /><em>recover more revenue</em></h2>
              </div>
              <p className="section-desc">
                Built for founders and collections teams who need operational edge — not another CRM that just stores contacts.
              </p>
            </div>

            {/* ── CHAT DEMO + BENEFITS SIDE BY SIDE ── */}
            <div className="grid-2" style={{ marginBottom: 12, alignItems: "start" }}>

              {/* LEFT: Chat demo */}
              <div className="demo-chat-wrap">
                <div className="demo-chat-header">
                  <div className="demo-chat-title">
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--gray-900)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "var(--white)", letterSpacing: "-0.02em" }}>iP</div>
                    Collections AI
                    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 5, background: "var(--gray-100)", border: "1px solid var(--gray-200)", marginLeft: 4 }}>
                      <div className="demo-chat-dot" />
                      <span style={{ fontSize: 10.5, color: "var(--gray-500)", fontWeight: 400 }}>Stripe · HubSpot</span>
                    </div>
                  </div>
                  <button
                    className={`demo-play-btn${isPlaying ? " playing" : ""}`}
                    onClick={handlePlayReset}
                  >
                    {isPlaying ? (
                      <>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <rect x="1.5" y="1.5" width="2.5" height="7" rx="1" fill="currentColor"/>
                          <rect x="6" y="1.5" width="2.5" height="7" rx="1" fill="currentColor"/>
                        </svg>
                        Pause
                      </>
                    ) : visibleMessages >= allMessages.length ? (
                      <>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M5 1L5 9M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Replay
                      </>
                    ) : (
                      <>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2.5 1.5L8.5 5L2.5 8.5V1.5Z" fill="currentColor"/>
                        </svg>
                        Play demo
                      </>
                    )}
                  </button>
                </div>

                <div className="demo-chat-body" ref={chatRef}>
                  {/* Empty state hint */}
                  {!isPlaying && visibleMessages < 2 && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center", flex: 1 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--gray-900)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--white)", marginBottom: 14, letterSpacing: "-0.02em" }}>iP</div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 400, color: "var(--gray-900)", letterSpacing: "-0.025em", marginBottom: 8, fontStyle: "italic" }}>See it in action.</div>
                      <div style={{ fontSize: 13, color: "var(--gray-500)", lineHeight: 1.65, marginBottom: 20, maxWidth: 260 }}>Watch how inPay's AI answers real collections questions in seconds.</div>
                      <button
                        className="demo-play-btn"
                        onClick={handlePlayReset}
                        style={{ fontSize: 13, padding: "9px 20px" }}
                      >
                        <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
                          <path d="M2.5 1.5L8.5 5L2.5 8.5V1.5Z" fill="currentColor"/>
                        </svg>
                        Play demo
                      </button>
                    </div>
                  )}

                  {allMessages.slice(0, visibleMessages).map((msg, idx) => (
                    <div key={idx} className="demo-msg-in">
                      {msg.role === "user" ? (
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <div className="demo-user-bubble">{msg.text}</div>
                        </div>
                      ) : (
                        <div className="demo-ai-row">
                          <div className="demo-ai-mark">iP</div>
                          <div className="demo-ai-bubble">
                            <AiMessageText text={msg.text} />
                            {msg.actions && (
                              <div className="demo-ai-actions">
                                {msg.actions.map((a, i) => (
                                  <button key={i} className="demo-ai-action-btn">{a}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Typing indicator — show between messages */}
                  {isPlaying && visibleMessages < allMessages.length && (
                    <div className="demo-ai-row demo-msg-in">
                      <div className="demo-ai-mark">iP</div>
                      <div className="demo-ai-bubble" style={{ padding: "8px 14px" }}>
                        <div className="demo-typing">
                          {[0, 1, 2].map(i => (
                            <span key={i} style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "var(--gray-400)", animation: `demo-dot 1.1s ease-in-out ${i * 0.18}s infinite` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="demo-chat-footer">
                  <div className="demo-input-mock">Ask about customers, invoices, priorities…</div>
                  <button className="btn-nav-solid" onClick={onEnterApp} style={{ marginLeft: 8, flexShrink: 0, fontSize: 12, padding: "7px 14px" }}>Try it →</button>
                </div>
              </div>

              {/* RIGHT: Benefits list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  {
                    icon: "✦",
                    iconBg: "var(--violet-50)",
                    iconColor: "var(--violet-700)",
                    title: "Ask anything in plain English",
                    desc: "\"Who should I call today?\" gets you a prioritized list with context — not a query builder. The AI reasons across Stripe, HubSpot, and Gmail to surface what matters.",
                  },
                  {
                    icon: "⚡",
                    iconBg: "var(--amber-50)",
                    iconColor: "var(--amber-700)",
                    title: "Real-time risk signals",
                    desc: "Live signals fire the moment a customer ghosts, an invoice spikes in risk, or payment intent surges. Act before opportunities slip away.",
                  },
                  {
                    icon: "◎",
                    iconBg: "var(--blue-50)",
                    iconColor: "var(--blue-700)",
                    title: "One-click actions, not just insights",
                    desc: "Draft an email, schedule a call, or send a nudge directly from the recommendation — no tab switching, no copy-paste.",
                  },
                  {
                    icon: "🔒",
                    iconBg: "var(--green-50)",
                    iconColor: "var(--green-700)",
                    title: "Enterprise-grade security",
                    desc: "Role-based access, audit trails, and SOC 2 compliant infrastructure. Your revenue data stays yours.",
                  },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "18px 20px", background: "var(--white)", border: "1px solid var(--gray-200)", borderRadius: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: item.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: item.iconColor, flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--gray-900)", letterSpacing: "-0.025em", marginBottom: 5 }}>{item.title}</div>
                      <div style={{ fontSize: 12.5, color: "var(--gray-500)", lineHeight: 1.65 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom stats row */}
            <div className="grid-3">
              {[
                { icon: "🔒", title: "Enterprise-grade security", desc: "Role-based access, audit trails, and SOC 2 compliant infrastructure." },
                { icon: "⚡", title: "Real-time Risk Feed", desc: "Live signals from Stripe, HubSpot, and Resend — surface payment risks before they turn into losses." },
                { icon: "📊", title: "Revenue Analytics", desc: "Track collection rates, ARPU, and recovery probability with cohort charts." },
              ].map(item => (
                <div key={item.title} className="stat-card">
                  <div className="stat-icon">{item.icon}</div>
                  <div className="stat-title">{item.title}</div>
                  <div className="stat-desc">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <div className="cta-wrap">
          <div className="cta-block">
            <h2 className="cta-h2">Stop chasing.<br /><em>Start collecting.</em></h2>
            <p className="cta-p">Join founders who recover more revenue with less effort using AI-powered collections intelligence.</p>
            <button className="btn-cta" onClick={onEnterApp}>Get started free</button>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="footer">
          <span className="footer-logo">inPay</span>
          <span className="footer-copy">© 2025 inPay. All rights reserved.</span>
          <div className="footer-links">
            {["Privacy", "Terms", "Contact"].map(l => <a key={l} href="#">{l}</a>)}
          </div>
        </footer>

      </div>
    </>
  );
}

// ── Inline bold renderer for AI messages ──────────────────────────────────
function AiMessageText({ text }: { text: string }) {
  const lines = text.split("\n").filter(Boolean);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {lines.map((line, i) => {
        if (/^\d+\./.test(line)) {
          return (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, background: "var(--gray-200)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600, color: "var(--gray-600)", flexShrink: 0, marginTop: 2 }}>
                {line.match(/^(\d+)\./)?.[1]}
              </span>
              <span style={{ fontSize: 12, color: "var(--gray-700)", lineHeight: 1.6 }}>
                <InlineBold text={line.replace(/^\d+\.\s*/, "")} />
              </span>
            </div>
          );
        }
        return (
          <p key={i} style={{ margin: 0, fontSize: 12, color: "var(--gray-700)", lineHeight: 1.65 }}>
            <InlineBold text={line} />
          </p>
        );
      })}
    </div>
  );
}

function InlineBold({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i} style={{ fontWeight: 600, color: "var(--gray-900)" }}>{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}