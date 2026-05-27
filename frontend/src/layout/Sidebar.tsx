import React from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store/index";
import { setTab } from "../store/slices/uiSlice";

type Tab = "clients" | "activity" | "chat";

const NAV: { id: Tab; label: string; badge?: string; badgeWarm?: boolean; icon: React.ReactNode }[] = [
  {
    id: "clients",
    label: "Clients",
    badge: "24",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1" y="1.5" width="12" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M1 5.5h12" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M4.5 1.5v4M9.5 1.5v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "activity",
    label: "Activity",
    badge: "3",
    badgeWarm: true,
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M1 7h2.5l2-4 2.5 8 2-4H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "chat",
    label: "Ask AI",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M1.5 2.5h11c.28 0 .5.22.5.5v6c0 .28-.22.5-.5.5H8L5.5 12V9.5H2c-.28 0-.5-.22-.5-.5V3c0-.28.22-.5.5-.5z"
          stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

const QUICK = [
  {
    label: "New invoice",
    icon: (
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: "Reports",
    icon: (
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <path d="M2 4.5h10M2 7.5h7M2 10.5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: "History",
    icon: (
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M7 4.5v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap');

  .sb {
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
  }

  .sb-nav-btn {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 6px 10px; border-radius: 8px;
    border: none; background: transparent; cursor: pointer;
    font-size: 13px; font-weight: 400; text-align: left;
    letter-spacing: -0.01em; transition: all 0.1s;
    font-family: var(--sans);
  }
  .sb-nav-btn:hover:not(.active) {
    background: var(--g50);
    color: var(--g900) !important;
  }
  .sb-nav-btn:hover:not(.active) .sb-icon {
    color: var(--g700) !important;
  }

  .sb-quick-btn {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 5px 10px; border-radius: 8px;
    border: none; background: transparent; cursor: pointer;
    font-size: 12.5px; font-weight: 400; text-align: left;
    letter-spacing: -0.01em; transition: all 0.1s;
    font-family: var(--sans); color: var(--g400);
  }
  .sb-quick-btn:hover {
    background: var(--g50);
    color: var(--g700);
  }

  .sb-badge {
    margin-left: auto; flex-shrink: 0;
    font-size: 10px; font-weight: 600; line-height: 16px;
    padding: 1px 6px; border-radius: 100px;
    background: var(--g900); color: #fff;
  }
  .sb-badge-warm {
    background: #fef3c7; color: #92400e;
  }

  .sb-upgrade {
    margin: 0 2px 2px; padding: 9px 10px; border-radius: 9px;
    background: var(--g50); border: 1px solid var(--g200);
    cursor: pointer; transition: all 0.12s;
  }
  .sb-upgrade:hover { border-color: var(--g300); background: #fff; }

  .sb-user {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 8px; border-radius: 8px; cursor: pointer;
    transition: background 0.1s;
  }
  .sb-user:hover { background: var(--g50); }

  .sb-divider {
    height: 1px; background: var(--g100); margin: 0 10px;
  }
`;

export default function Sidebar() {
  const dispatch   = useDispatch<AppDispatch>();
  const activeTab  = useSelector((s: RootState) => s.ui.activeTab ?? "clients");
  const activeView = useSelector((s: RootState) => s.ui.activeView);

  return (
    <aside className="sb" style={{
      width: 200, flexShrink: 0,
      background: "#ffffff",
      borderRight: "1px solid #e5e7eb",
      display: "flex", flexDirection: "column",
    }}>
      <style>{css}</style>

      {/* ── Brand ── */}
      <div style={{
        height: 52, display: "flex", alignItems: "center",
        padding: "0 16px", borderBottom: "1px solid #e5e7eb",
        gap: 9, flexShrink: 0,
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: "#111827",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 9.5L6 2.5L10 9.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="6" cy="6.5" r="1.2" fill="white"/>
          </svg>
        </div>
        <span style={{
          fontSize: 14, fontWeight: 600, color: "#111827",
          letterSpacing: "-0.03em", fontFamily: "var(--sans)",
        }}>inPay</span>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "16px 8px 0", flex: 1, display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>

        {/* Workspace nav */}
        <div>
          <div style={{
            fontSize: "9.5px", fontWeight: 600, color: "#9ca3af",
            textTransform: "uppercase", letterSpacing: "0.1em",
            padding: "0 10px", marginBottom: 4,
          }}>
            Workspace
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {NAV.map((item) => {
              const isActive = activeTab === item.id && activeView === "dashboard";
              return (
                <button
                  key={item.id}
                  onClick={() => dispatch(setTab(item.id))}
                  className={`sb-nav-btn${isActive ? " active" : ""}`}
                  style={{
                    color: isActive ? "#111827" : "#6b7280",
                    fontWeight: isActive ? 500 : 400,
                    background: isActive ? "#f3f4f6" : "transparent",
                  }}
                >
                  <span className="sb-icon" style={{ color: isActive ? "#111827" : "#9ca3af", display: "flex" }}>
                    {item.icon}
                  </span>
                  {item.label}
                  {item.badge && (
                    <span className={`sb-badge${item.badgeWarm ? " sb-badge-warm" : ""}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="sb-divider" />

        {/* Quick links */}
        <div>
          <div style={{
            fontSize: "9.5px", fontWeight: 600, color: "#9ca3af",
            textTransform: "uppercase", letterSpacing: "0.1em",
            padding: "0 10px", marginBottom: 4,
          }}>
            Quick links
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {QUICK.map((item) => (
              <button key={item.label} className="sb-quick-btn">
                <span style={{ display: "flex", color: "#9ca3af" }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Journey indicator */}
        {activeView === "customer" && (
          <div style={{ padding: "0 2px" }}>
            <div style={{
              padding: "8px 10px", borderRadius: 9,
              background: "#f9fafb", border: "1px solid #e5e7eb",
            }}>
              <div style={{
                fontSize: "9.5px", fontWeight: 600, color: "#9ca3af",
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2,
              }}>Viewing</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "#111827", letterSpacing: "-0.01em" }}>
                Payment Journey
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: "10px 8px 12px", borderTop: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Upgrade prompt */}
        <div className="sb-upgrade">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
            <span style={{ fontSize: "9.5px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>Plan</span>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>↗</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#374151", letterSpacing: "-0.01em" }}>Upgrade to Pro</div>
        </div>

        {/* User */}
        <div className="sb-user">
          <div style={{
            width: 26, height: 26, borderRadius: "50%",
            background: "#111827", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, color: "#fff",
          }}>A</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: "#111827", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
              Admin
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              admin@acme.io
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}