"use client";
import React, { useState, useEffect } from "react";

interface LandingPageProps {
  onEnterApp: () => void;
}

export default function LandingPage({ onEnterApp }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

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
        .nav-logo {
          font-weight: 600; font-size: 15px; color: var(--gray-900);
          letter-spacing: -0.03em; text-decoration: none;
        }
        .nav-links {
          display: flex; align-items: center; gap: 32px;
          position: absolute; left: 50%; transform: translateX(-50%);
        }
        .nav-links a {
          font-size: 13.5px; font-weight: 400; color: var(--gray-500);
          text-decoration: none; letter-spacing: -0.01em; transition: color 0.12s;
        }
        .nav-links a:hover { color: var(--gray-900); }
        .nav-actions { display: flex; align-items: center; gap: 6px; }
        .btn-nav-ghost {
          padding: 5px 12px; border-radius: 7px; border: none;
          background: transparent; color: var(--gray-500); font-size: 13px;
          font-family: var(--font-sans); font-weight: 400; cursor: pointer;
          transition: all 0.12s; letter-spacing: -0.01em;
        }
        .btn-nav-ghost:hover { color: var(--gray-900); background: var(--gray-100); }
        .btn-nav-solid {
          padding: 6px 14px; border-radius: 7px; border: none;
          background: var(--gray-900); color: var(--white); font-size: 13px;
          font-family: var(--font-sans); font-weight: 500; cursor: pointer;
          letter-spacing: -0.01em; transition: opacity 0.12s;
        }
        .btn-nav-solid:hover { opacity: 0.85; }

        /* ─── HERO ─── */
        .hero {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 140px 32px 100px; text-align: center;
          background: var(--white);
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 12px 4px 8px; border-radius: 100px;
          border: 1px solid var(--gray-200); background: var(--white);
          font-size: 12px; font-weight: 500; color: var(--gray-500);
          margin-bottom: 28px; letter-spacing: -0.01em;
        }
        .hero-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--green-500);
          box-shadow: 0 0 0 3px rgba(34,197,94,0.18);
        }
        .hero-h1 {
          font-family: var(--font-display);
          font-size: clamp(48px, 7vw, 88px);
          font-weight: 400; line-height: 1.04;
          letter-spacing: -0.03em; color: var(--gray-900);
          max-width: 820px; margin-bottom: 22px;
        }
        .hero-h1 em { font-style: italic; }
        .hero-sub {
          font-size: 16.5px; line-height: 1.7; color: var(--gray-500);
          max-width: 440px; font-weight: 400; letter-spacing: -0.01em;
          margin-bottom: 36px;
        }
        .hero-ctas {
          display: flex; gap: 8px; align-items: center; margin-bottom: 80px;
        }
        .btn-primary {
          padding: 10px 22px; border-radius: 8px; border: none;
          background: var(--gray-900); color: var(--white);
          font-size: 13.5px; font-family: var(--font-sans); font-weight: 500;
          cursor: pointer; letter-spacing: -0.02em; transition: opacity 0.12s;
        }
        .btn-primary:hover { opacity: 0.82; }
        .btn-secondary {
          padding: 10px 22px; border-radius: 8px;
          border: 1px solid var(--gray-200); background: var(--white);
          color: var(--gray-600); font-size: 13.5px; font-family: var(--font-sans);
          font-weight: 400; cursor: pointer; letter-spacing: -0.02em;
          transition: all 0.12s;
        }
        .btn-secondary:hover { background: var(--gray-50); border-color: var(--gray-300); }

        /* ─── HERO PREVIEW ─── */
        .preview-frame {
          width: 100%; max-width: 960px;
          border: 1px solid var(--gray-200); border-radius: 20px;
          padding: 5px; background: var(--gray-50);
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.06);
        }
        .preview-inner {
          border-radius: 16px; overflow: hidden;
          border: 1px solid var(--gray-200); background: var(--white);
          display: flex; height: 400px;
        }
        .preview-sidebar {
          width: 168px; flex-shrink: 0;
          background: var(--gray-50); border-right: 1px solid var(--gray-200);
          padding: 14px 0;
        }
        .sidebar-brand {
          display: flex; align-items: center; gap: 7px;
          padding: 0 12px 12px; border-bottom: 1px solid var(--gray-200);
          margin-bottom: 6px;
        }
        .sidebar-brand-mark {
          width: 20px; height: 20px; border-radius: 5px;
          background: var(--gray-900); display: flex; align-items: center;
          justify-content: center; font-size: 8px; font-weight: 700;
          color: var(--white); letter-spacing: -0.02em; flex-shrink: 0;
        }
        .sidebar-brand-name {
          font-size: 12px; font-weight: 600; color: var(--gray-900);
          letter-spacing: -0.025em;
        }
        .sidebar-item {
          display: flex; align-items: center; gap: 7px;
          padding: 6px 12px; font-size: 11.5px; color: var(--gray-500);
          cursor: pointer; transition: all 0.1s; border-radius: 0;
        }
        .sidebar-item.active {
          background: var(--white); color: var(--gray-900); font-weight: 500;
          border-right: 2px solid var(--gray-900);
        }
        .sidebar-item:hover:not(.active) { background: var(--gray-100); color: var(--gray-700); }
        .preview-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .preview-topbar {
          height: 42px; border-bottom: 1px solid var(--gray-200);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 18px; flex-shrink: 0; background: var(--white);
        }
        .topbar-title { font-size: 12px; font-weight: 500; color: var(--gray-900); letter-spacing: -0.025em; }
        .topbar-actions { display: flex; gap: 10px; }
        .topbar-action { font-size: 11px; color: var(--gray-400); cursor: pointer; transition: color 0.1s; }
        .topbar-action:hover { color: var(--gray-600); }

        /* activity feed in preview */
        .feed-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 18px; border-bottom: 1px solid var(--gray-100);
          transition: background 0.08s; cursor: default;
        }
        .feed-item:hover { background: var(--gray-50); }
        .feed-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
        .feed-title { font-size: 11.5px; font-weight: 500; color: var(--gray-900); line-height: 1.4; margin-bottom: 2px; }
        .feed-sub { font-size: 10.5px; color: var(--gray-400); line-height: 1.4; margin-bottom: 5px; }
        .feed-meta { display: flex; align-items: center; gap: 8px; }
        .feed-prob { font-size: 10px; font-weight: 600; }
        .feed-action-btn {
          padding: 1px 8px; border-radius: 4px;
          border: 1px solid var(--gray-200); background: var(--white);
          font-size: 10px; font-weight: 400; cursor: pointer;
          color: var(--gray-500); font-family: var(--font-sans); transition: all 0.1s;
        }
        .feed-action-btn:hover { border-color: var(--gray-300); color: var(--gray-700); }
        .feed-time { font-size: 10px; color: var(--gray-400); flex-shrink: 0; }

        /* ─── SECTIONS ─── */
        .section { padding: 96px 32px; }
        .section-wrap { max-width: 1080px; margin: 0 auto; }
        .section-eyebrow {
          font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
          color: var(--gray-400); text-transform: uppercase; margin-bottom: 10px;
        }
        .section-h2 {
          font-family: var(--font-display);
          font-size: clamp(32px, 4vw, 50px);
          font-weight: 400; line-height: 1.1;
          letter-spacing: -0.03em; color: var(--gray-900); margin-bottom: 12px;
        }
        .section-h2 em { font-style: italic; }
        .section-desc {
          font-size: 14.5px; line-height: 1.7; color: var(--gray-500);
          max-width: 360px; font-weight: 400; letter-spacing: -0.01em;
        }
        .section-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 48px; margin-bottom: 48px;
        }

        /* ─── TABS ─── */
        .tab-bar {
          display: inline-flex; gap: 2px; margin-bottom: 36px;
          background: var(--gray-100); border-radius: 10px; padding: 3px;
        }
        .tab-btn {
          padding: 7px 18px; border-radius: 8px; border: none;
          background: transparent; font-size: 13px; font-family: var(--font-sans);
          font-weight: 400; color: var(--gray-500); cursor: pointer;
          transition: all 0.15s; letter-spacing: -0.01em;
        }
        .tab-btn.active {
          background: var(--white); color: var(--gray-900); font-weight: 500;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 1px rgba(0,0,0,0.04);
        }
        .tab-btn:hover:not(.active) { color: var(--gray-700); }

        /* ─── GRID ─── */
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
        .grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }

        /* ─── CARDS ─── */
        .card {
          background: var(--white); border: 1px solid var(--gray-200);
          border-radius: 16px; overflow: hidden;
        }
        .card-body { padding: 24px 24px 0; }
        .card-title {
          font-size: 14px; font-weight: 500; color: var(--gray-900);
          letter-spacing: -0.025em; margin-bottom: 6px;
        }
        .card-desc {
          font-size: 12.5px; line-height: 1.65; color: var(--gray-500);
          margin-bottom: 20px; font-weight: 400; max-width: 300px;
        }
        .card-visual { display: flex; justify-content: center; }
        .card-window {
          background: var(--white); border: 1px solid var(--gray-200);
          border-radius: 10px 10px 0 0; padding: 14px 16px 0;
          width: 100%; max-width: 320px;
        }
        .card-window-title {
          font-size: 11px; font-weight: 600; color: var(--gray-900);
          letter-spacing: -0.025em; margin-bottom: 12px;
        }

        /* ─── TIMELINE ─── */
        .tl-row { display: flex; gap: 9px; margin-bottom: 8px; position: relative; }
        .tl-dot {
          width: 18px; height: 18px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 7px; flex-shrink: 0; z-index: 1; border: 1.5px solid;
        }
        .tl-label { font-size: 11px; font-weight: 500; color: var(--gray-900); }
        .tl-sub { font-size: 9.5px; color: var(--gray-400); margin-top: 1px; }
        .tl-line {
          position: absolute; left: 8px; top: 20px; bottom: -8px;
          width: 1px; background: var(--gray-200);
        }

        /* ─── INSIGHT CARDS ─── */
        .insight-card {
          border-radius: 9px; padding: 10px 12px; margin-bottom: 7px;
        }
        .insight-tag {
          font-size: 9px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; margin-bottom: 5px;
          display: flex; align-items: center; gap: 5px;
        }
        .insight-text { font-size: 11px; line-height: 1.55; }

        /* ─── CHAT ─── */
        .chat-bubble {
          border-radius: 10px; padding: 9px 12px;
          font-size: 11px; line-height: 1.55; max-width: 230px;
        }
        .chat-user { background: var(--gray-100); color: var(--gray-600); align-self: flex-end; }
        .chat-ai {
          background: var(--green-50); color: var(--green-700);
          border: 1px solid var(--green-100);
        }

        /* ─── ACTION PILL ─── */
        .action-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 6px; font-size: 10.5px;
          font-weight: 500; font-family: var(--font-sans); cursor: pointer;
          border: 1px solid var(--gray-200); background: var(--white);
          color: var(--gray-700); transition: all 0.1s;
        }
        .action-pill:hover { background: var(--gray-50); border-color: var(--gray-300); }
        .action-pill-dark {
          background: var(--gray-900); color: var(--white);
          border-color: var(--gray-900);
        }
        .action-pill-dark:hover { opacity: 0.85; }

        /* ─── CHIP ─── */
        .chip {
          padding: 3px 9px; border-radius: 5px; font-size: 9.5px;
          font-weight: 500; cursor: pointer; font-family: var(--font-sans); border: none;
        }
        .chip-dark { background: var(--gray-900); color: var(--white); }
        .chip-light { background: var(--white); color: var(--gray-500); border: 1px solid var(--gray-200); }

        /* ─── SIDE-BY-SIDE CARD ─── */
        .split-card {
          background: var(--white); border: 1px solid var(--gray-200);
          border-radius: 16px; display: flex; overflow: hidden; min-height: 180px;
        }
        .split-card-body {
          flex: 1; padding: 24px 20px 24px 24px;
          display: flex; flex-direction: column; justify-content: flex-start;
        }
        .split-card-visual {
          width: 200px; flex-shrink: 0; display: flex;
          align-items: center; justify-content: center;
          padding: 20px 16px; background: var(--gray-50);
          border-left: 1px solid var(--gray-200);
        }

        /* ─── STAT CARDS ─── */
        .stat-card {
          background: var(--white); border: 1px solid var(--gray-200);
          border-radius: 16px; padding: 22px 20px;
          display: flex; flex-direction: column;
        }
        .stat-icon {
          width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--gray-200);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; margin-bottom: 12px;
        }
        .stat-title {
          font-size: 13px; font-weight: 500; color: var(--gray-900);
          letter-spacing: -0.02em; margin-bottom: 4px;
        }
        .stat-desc { font-size: 12px; color: var(--gray-500); line-height: 1.6; }

        /* ─── BENEFIT CARD ─── */
        .benefit-card {
          background: var(--white); border: 1px solid var(--gray-200);
          border-radius: 16px; padding: 22px 20px;
          display: flex; flex-direction: column; min-height: 240px;
        }
        .benefit-title {
          font-size: 13.5px; font-weight: 500; color: var(--gray-900);
          letter-spacing: -0.025em; margin-bottom: 5px;
        }
        .benefit-desc {
          font-size: 12px; color: var(--gray-500); line-height: 1.62;
          margin-bottom: 18px;
        }

        /* ─── INTEGRATION BADGE ─── */
        .int-badge {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 10px; border-radius: 8px; margin-bottom: 5px;
          background: var(--white); border: 1px solid var(--gray-200);
        }
        .int-name { font-size: 11.5px; font-weight: 500; color: var(--gray-900); }
        .int-sub { font-size: 10px; color: var(--gray-400); }
        .int-status {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--green-500); margin-left: auto; flex-shrink: 0;
        }

        /* ─── CTA ─── */
        .cta-wrap { margin: 0 32px 72px; }
        .cta-block {
          background: var(--gray-950); border-radius: 20px;
          padding: 80px 48px; text-align: center;
        }
        .cta-h2 {
          font-family: var(--font-display);
          font-size: clamp(36px, 4.5vw, 60px); font-weight: 400;
          color: var(--white); letter-spacing: -0.03em; line-height: 1.08; margin-bottom: 14px;
        }
        .cta-h2 em { font-style: italic; }
        .cta-p {
          font-size: 14.5px; color: rgba(255,255,255,0.45);
          max-width: 360px; margin: 0 auto 32px; line-height: 1.7;
        }
        .btn-cta {
          padding: 10px 24px; border-radius: 8px;
          background: var(--white); color: var(--gray-900);
          font-size: 13.5px; font-family: var(--font-sans); font-weight: 500;
          border: none; cursor: pointer; letter-spacing: -0.02em; transition: opacity 0.12s;
        }
        .btn-cta:hover { opacity: 0.88; }

        /* ─── FOOTER ─── */
        .footer {
          padding: 24px 32px; border-top: 1px solid var(--gray-200);
          display: flex; align-items: center; justify-content: space-between;
        }
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

          {/* Preview frame */}
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

            {/* TABS */}
            <div className="tab-bar">
              {tabs.map((t, i) => (
                <button key={t} className={`tab-btn${activeTab === i ? " active" : ""}`} onClick={() => setActiveTab(i)}>
                  {t}
                </button>
              ))}
            </div>

            {/* ── JOURNEY TAB ── */}
            {activeTab === 0 && (
              <>
                <div className="grid-2" style={{ marginBottom: 12 }}>
                  {/* Journey timeline card */}
                  <div className="card">
                    <div className="card-body">
                      <div className="card-title">Invoice Journey Graph</div>
                      <div className="card-desc">Click any customer to open a full relationship timeline — reconstructed from CRM, email, and invoice data. Every interaction becomes a node.</div>
                    </div>
                    <div className="card-visual" style={{ alignItems: "flex-end" }}>
                      <div className="card-window">
                        <div className="card-window-title">Acme Corp · Payment Journey</div>
                        {[
                          { icon: "✓", label: "Deal Closed", sub: "Mar 2 · CRM synced", bg: "var(--green-50)", bc: "var(--green-500)", c: "var(--green-600)" },
                          { icon: "📄", label: "Contract Signed", sub: "Mar 4 · DocuSign event", bg: "var(--green-50)", bc: "var(--green-500)", c: "var(--green-600)" },
                          { icon: "→", label: "Invoice Sent · ₹1,20,000", sub: "Mar 5 · via Stripe", bg: "var(--blue-50)", bc: "var(--blue-500)", c: "var(--blue-700)" },
                          { icon: "◈", label: "Email Opened (3×)", sub: "Mar 8 — late night · AI: watch", bg: "var(--amber-50)", bc: "var(--amber-500)", c: "var(--amber-700)" },
                          { icon: "◉", label: "Link Clicked 3×", sub: "Mar 9 · high intent", bg: "var(--amber-50)", bc: "var(--amber-500)", c: "var(--amber-700)" },
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

                  {/* AI Insights card */}
                  <div className="card">
                    <div className="card-body">
                      <div className="card-title">AI Insights at every node</div>
                      <div className="card-desc">Each node includes AI-generated insights, quick actions, and contextual recommendations — replacing static CRM records with live intelligence.</div>
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
                            <div className="insight-tag" style={{ color: ins.tagClr }}>
                              <span>{ins.icon}</span>{ins.tag}
                            </div>
                            <div className="insight-text" style={{ color: "var(--gray-700)" }}>{ins.text}</div>
                          </div>
                        ))}
                        <div style={{ height: 14 }} />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── ASK AI TAB ── */}
            {activeTab === 1 && (
              <div className="grid-2" style={{ marginBottom: 12 }}>
                <div className="card">
                  <div className="card-body">
                    <div className="card-title">AI Collections Assistant</div>
                    <div className="card-desc">Ask operational questions in plain English. The agent joins Stripe, HubSpot, and Gmail — combining overdue invoices, engagement, payment history, and risk signals.</div>
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
                            <strong>Call Acme Corp first.</strong> ₹1,20,000 overdue, 18 days late. Email opened but no reply in 6 days. Historically responds best to direct calls.
                            <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
                              <button className="chip chip-dark">Call now</button>
                              <button className="chip chip-light">Draft email</button>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <div className="chat-bubble chat-user" style={{ fontSize: 10.5 }}>Which customers are most likely to churn?</div>
                        </div>
                        <div style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--gray-900)", color: "var(--white)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>AI</div>
                          <div className="chat-bubble chat-ai" style={{ fontSize: 10.5 }}>Nova LLC and Orbit Tech show highest churn probability. Engagement dropped sharply after invoices became overdue.</div>
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
                        "Which customers stopped opening emails?",
                        "What's our average recovery time by segment?",
                      ].map((q, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 7,
                          padding: "7px 9px", borderRadius: 7, marginBottom: 4,
                          background: "var(--gray-50)", border: "1px solid var(--gray-200)", cursor: "pointer",
                          transition: "background 0.1s",
                        }}>
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

            {/* ── ACTIONS TAB ── */}
            {activeTab === 2 && (
              <div className="grid-2" style={{ marginBottom: 12 }}>
                <div className="card">
                  <div className="card-body">
                    <div className="card-title">AI-Powered Next Steps</div>
                    <div className="card-desc">After recommendations are generated, inPay suggests executable next steps — personalized emails, optimal call times, and the right channel.</div>
                  </div>
                  <div className="card-visual" style={{ alignItems: "flex-end" }}>
                    <div className="card-window">
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gray-900)", marginBottom: 2, letterSpacing: "-0.02em" }}>Acme Corp · Next Steps</div>
                      <div style={{ fontSize: 10, color: "var(--gray-400)", marginBottom: 12 }}>₹1,20,000 overdue · 18 days</div>
                      <div style={{ background: "var(--green-50)", border: "1px solid var(--green-100)", borderRadius: 9, padding: "9px 11px", marginBottom: 7 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--green-700)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>✦ AI Draft Ready</div>
                        <div style={{ fontSize: 10.5, color: "var(--gray-700)", lineHeight: 1.5, marginBottom: 8 }}>
                          "Hi Rahul, following up on Invoice #042 for ₹1,20,000 due March 5. I noticed you've reviewed it — happy to answer any questions..."
                        </div>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          <button className="action-pill action-pill-dark">Send Now</button>
                          <button className="action-pill">Edit Draft</button>
                          <button className="action-pill">Change Tone</button>
                        </div>
                      </div>
                      <div style={{ background: "var(--blue-50)", border: "1px solid var(--blue-100)", borderRadius: 9, padding: "9px 11px", marginBottom: 7 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--blue-700)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>📞 Call Suggested</div>
                        <div style={{ fontSize: 10.5, color: "var(--gray-700)", lineHeight: 1.5, marginBottom: 7 }}>Tomorrow at 11:30 AM — highest historical response rate for this customer.</div>
                        <button className="action-pill">Schedule Follow-up</button>
                      </div>
                      <div style={{ background: "var(--violet-50)", border: "1px solid var(--violet-100)", borderRadius: 9, padding: "8px 11px", marginBottom: 7 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--violet-700)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>◎ Channel Recommendation</div>
                        <div style={{ fontSize: 10.5, color: "var(--gray-700)" }}>Email selected — 3× higher response rate than SMS for Acme Corp.</div>
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
                      <div style={{ fontSize: 9.5, color: "var(--gray-400)", marginBottom: 10 }}>Inline actions on every recommendation</div>
                      {[
                        { icon: "✦", label: "Generate Email", desc: "Personalized draft based on customer history" },
                        { icon: "📤", label: "Send Now", desc: "One-click delivery via Gmail or SMTP" },
                        { icon: "📅", label: "Schedule Follow-up", desc: "AI picks the optimal time slot" },
                        { icon: "🎨", label: "Change Tone", desc: "Formal · Friendly · Firm · Urgent" },
                        { icon: "📞", label: "Log Call", desc: "Record outcome and auto-update journey" },
                      ].map((a, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "flex-start", gap: 9,
                          padding: "8px 9px", borderRadius: 7, marginBottom: 4,
                          border: "1px solid var(--gray-200)", background: "var(--white)",
                          cursor: "pointer", transition: "background 0.1s",
                        }}>
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

            {/* ── ACTIVITY TAB ── */}
            {activeTab === 3 && (
              <div className="grid-2" style={{ marginBottom: 12 }}>
                <div className="card">
                  <div className="card-body">
                    <div className="card-title">Live Revenue Intelligence Feed</div>
                    <div className="card-desc">Real-time risk signals from Stripe, HubSpot, and Resend — with urgency levels, AI explanations, recommended actions, and recovery probability on every event.</div>
                  </div>
                  <div className="card-visual" style={{ alignItems: "flex-end" }}>
                    <div style={{ background: "var(--white)", border: "1px solid var(--gray-200)", borderRadius: "10px 10px 0 0", width: "100%", maxWidth: 320, overflow: "hidden" }}>
                      {[
                        { dot: "#ef4444", urgency: "Critical", title: "Acme Corp opened invoice 5× — never replied", ai: "Direct call recommended within 24h.", prob: "62%", action: "Draft email", time: "2m" },
                        { dot: "#f59e0b", urgency: "Watch", title: "Nova LLC stopped engaging after overdue", ai: "Risk of ghosting is rising.", prob: "74%", action: "Schedule call", time: "14m" },
                        { dot: "#22c55e", urgency: "Opportunity", title: "InPay reopened payment link 2× today", ai: "Strong payment intent. Send nudge.", prob: "91%", action: "Send nudge", time: "31m" },
                        { dot: "#f59e0b", urgency: "Watch", title: "Orbit Tech email at 11:30 PM again", ai: "Late-night pattern. Call tomorrow AM.", prob: "58%", action: "Call AM", time: "1h" },
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
                      <div style={{ height: 4 }} />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <div className="card-title">Surface risks before they become losses</div>
                    <div className="card-desc">inPay continuously monitors for payment risks, engagement drops, and recovery opportunities — so nothing slips through.</div>
                  </div>
                  <div className="card-visual" style={{ alignItems: "flex-end" }}>
                    <div className="card-window">
                      <div style={{ fontSize: 9.5, color: "var(--gray-400)", marginBottom: 10 }}>What the feed tracks</div>
                      {[
                        { icon: "⚡", bg: "var(--red-50)", border: "var(--red-100)", c: "var(--red-700)", title: "Payment risks", desc: "Overdue spikes, failed charges, bounced payments" },
                        { icon: "📉", bg: "var(--amber-50)", border: "var(--amber-100)", c: "var(--amber-700)", title: "Engagement drops", desc: "Email open rate decline, link click falloff" },
                        { icon: "💸", bg: "var(--red-50)", border: "var(--red-100)", c: "var(--red-700)", title: "Revenue threats", desc: "High-value invoices at risk of ghosting" },
                        { icon: "✅", bg: "var(--green-50)", border: "var(--green-100)", c: "var(--green-700)", title: "Recovery opportunities", desc: "High payment intent signals worth acting on now" },
                      ].map((item, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "flex-start", gap: 9,
                          padding: "8px 9px", borderRadius: 7, marginBottom: 5,
                          background: item.bg, border: `1px solid ${item.border}`,
                        }}>
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

            {/* Bottom row: integrations + payments */}
            <div className="grid-2">
              <div className="split-card">
                <div className="split-card-body">
                  <div className="card-title">Coral joins across your stack</div>
                  <div className="card-desc" style={{ maxWidth: "none" }}>inPay connects Stripe, HubSpot, and Gmail in real time — no manual exports, no stale data.</div>
                </div>
                <div className="split-card-visual">
                  <div style={{ width: "100%" }}>
                    {[
                      { name: "Stripe", icon: "💳", sub: "Payments & invoices" },
                      { name: "HubSpot", icon: "🧡", sub: "CRM & deal data" },
                      { name: "Gmail", icon: "📧", sub: "Email engagement" },
                      { name: "Resend", icon: "📨", sub: "Delivery & opens" },
                    ].map((item, i) => (
                      <div key={i} className="int-badge">
                        <span style={{ fontSize: 13 }}>{item.icon}</span>
                        <div>
                          <div className="int-name">{item.name}</div>
                          <div className="int-sub">{item.sub}</div>
                        </div>
                        <div className="int-status" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="split-card">
                <div className="split-card-body">
                  <div className="card-title">One-click payment links</div>
                  <div className="card-desc" style={{ maxWidth: "none" }}>Share secure payment links with OTP verification — saved info, zero friction, high conversion.</div>
                </div>
                <div className="split-card-visual">
                  <div style={{ background: "var(--white)", border: "1px solid var(--gray-200)", borderRadius: 10, padding: "14px", width: "100%" }}>
                    <div style={{ fontSize: 10, color: "var(--gray-400)", marginBottom: 5 }}>acme@corp.com</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-900)", marginBottom: 3, letterSpacing: "-0.025em" }}>Pay Invoice #INV-042</div>
                    <div style={{ fontSize: 10.5, color: "var(--gray-500)", marginBottom: 10 }}>Enter the code sent to your phone</div>
                    <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                      {["8", "", "", "", ""].map((v, i) => (
                        <div key={i} style={{
                          width: 30, height: 34, borderRadius: 6,
                          border: `1.5px solid ${i === 0 ? "var(--gray-900)" : "var(--gray-200)"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 600, color: "var(--gray-900)",
                          background: "var(--white)",
                        }}>{v}</div>
                      ))}
                    </div>
                    <div style={{ fontSize: 9.5, color: "var(--gray-400)" }}>Powered by inPay</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── BENEFITS ── */}
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

            <div className="grid-2" style={{ marginBottom: 12 }}>
              {/* Workflow automation */}
              <div className="benefit-card">
                <div className="benefit-title">Workflow Automation</div>
                <div className="benefit-desc">Trigger agents from overdue events, chain tools with conditions, escalate automatically when risk rises.</div>
                <div style={{ marginTop: "auto" }}>
                  <div style={{ background: "var(--white)", border: "1px solid var(--gray-200)", borderRadius: 10, padding: "14px" }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--gray-900)", marginBottom: 3, letterSpacing: "-0.025em" }}>AI inPay Workflow</div>
                    <div style={{ fontSize: 10.5, color: "var(--gray-400)", marginBottom: 10 }}>Overdue → Risk check → Auto-draft</div>
                    <div style={{ display: "flex", marginBottom: 8 }}>
                      {["👤", "💼", "🤖", "📊"].map((e, i) => (
                        <div key={i} style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--gray-100)", border: "2px solid var(--white)", marginLeft: i > 0 ? -6 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>{e}</div>
                      ))}
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--gray-400)" }}>Overdue review · Risk escalation · Auto-draft</div>
                  </div>
                </div>
              </div>

              {/* Omnichannel */}
              <div className="benefit-card">
                <div className="benefit-title">Omnichannel Messaging</div>
                <div className="benefit-desc">Send campaigns across email, WhatsApp, and SMS — every reply lands in one unified inbox.</div>
                <div style={{ marginTop: "auto" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 700, flexShrink: 0 }}>R</div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--gray-900)", marginBottom: 4 }}>Rahul Mehta</div>
                      <div style={{ background: "var(--gray-100)", borderRadius: "0 8px 8px 8px", padding: "8px 10px", fontSize: 11.5, color: "var(--gray-700)", lineHeight: 1.5 }}>
                        Follow-up sent to Acme — payment expected by EOD.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

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