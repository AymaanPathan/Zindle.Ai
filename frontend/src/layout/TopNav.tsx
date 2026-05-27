import React from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store/index";
import { setTab } from "../store/slices/uiSlice";

type Tab = "clients" | "activity" | "chat";

const NAV: { id: Tab; label: string }[] = [
  { id: "clients",  label: "Clients"  },
  { id: "activity", label: "Activity" },
  { id: "chat",     label: "Ask AI"   },
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap');

  .tn {
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
    position: sticky; top: 0; z-index: 50;
    height: 52px;
    border-bottom: 1px solid var(--g200);
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(24px) saturate(180%);
    display: flex; align-items: center;
    padding: 0 32px;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .tn-left {
    display: flex; align-items: center; gap: 28px;
  }

  /* Brand — identical to landing nav-logo */
  .tn-logo {
    display: flex; align-items: center; gap: 8px;
  }
  .tn-logo-mark {
    width: 22px; height: 22px; border-radius: 6px;
    background: var(--g900);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .tn-wordmark {
    font-size: 15px; font-weight: 600; color: var(--g900);
    letter-spacing: -0.03em; font-family: var(--sans);
  }

  .tn-divider {
    width: 1px; height: 18px; background: var(--g200); flex-shrink: 0;
  }

  /* Nav links — identical to landing .nav-links a */
  .tn-nav {
    display: flex; align-items: center; gap: 28px;
  }
  .tn-btn {
    padding: 0; border: none; background: transparent; cursor: pointer;
    font-size: 13.5px; font-weight: 400; color: var(--g500);
    letter-spacing: -0.01em; transition: color 0.12s;
    font-family: var(--sans);
    text-decoration: none;
  }
  .tn-btn:hover:not(.active) {
    color: var(--g900);
  }
  .tn-btn.active {
    color: var(--g900);
    font-weight: 500;
  }

  /* Right side */
  .tn-right {
    display: flex; align-items: center; gap: 6px;
  }

  /* Ghost button — matches landing .btn-nav-ghost */
  .tn-ghost {
    padding: 5px 12px; border-radius: 7px; border: none;
    background: transparent; color: var(--g500); font-size: 13px;
    font-family: var(--sans); font-weight: 400; cursor: pointer;
    transition: all 0.12s; letter-spacing: -0.01em;
  }
  .tn-ghost:hover { color: var(--g900); background: var(--g100); }

  /* Solid button — matches landing .btn-nav-solid */
  .tn-solid {
    padding: 6px 14px; border-radius: 7px; border: none;
    background: var(--g900); color: var(--w); font-size: 13px;
    font-family: var(--sans); font-weight: 500; cursor: pointer;
    letter-spacing: -0.01em; transition: opacity 0.12s;
  }
  .tn-solid:hover { opacity: 0.85; }
`;

export default function TopNav() {
  const dispatch   = useDispatch<AppDispatch>();
  const activeTab  = useSelector((s: RootState) => s.ui.activeTab ?? "clients");
  const activeView = useSelector((s: RootState) => s.ui.activeView);

  return (
    <nav className="tn">
      <style>{css}</style>

      <div className="tn-left">
        {/* Brand */}
        <div className="tn-logo">
          <div className="tn-logo-mark">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 9.5L6 2.5L10 9.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="6" cy="6.5" r="1.2" fill="white"/>
            </svg>
          </div>
          <span className="tn-wordmark">inPay</span>
        </div>

        <div className="tn-divider" />

        {/* Nav links */}
        <nav className="tn-nav">
          {NAV.map((item) => {
            const isActive = activeTab === item.id && activeView === "dashboard";
            return (
              <button
                key={item.id}
                onClick={() => dispatch(setTab(item.id))}
                className={`tn-btn${isActive ? " active" : ""}`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

   
    </nav>
  );
}