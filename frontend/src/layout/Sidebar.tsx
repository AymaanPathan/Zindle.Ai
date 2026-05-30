import React from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store/index";
import { setTab } from "../store/slices/uiSlice";

type Tab = "clients" | "activity" | "chat";

const NAV: { id: Tab; label: string; badge?: string; badgeWarm?: boolean }[] = [
  { id: "clients",  label: "Clients" },
  { id: "activity", label: "Activity"},
  { id: "chat",     label: "Ask AI" },
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');

  .sb {
    --g50:  #f9fafb;
    --g100: #f3f4f6;
    --g200: #e5e7eb;
    --g300: #d1d5db;
    --g400: #9ca3af;
    --g500: #6b7280;
    --g600: #4b5563;
    --g700: #374151;
    --g800: #1f2937;
    --g900: #111827;
    --accent: #18181b;
    --sans: 'Geist', -apple-system, system-ui, sans-serif;
    font-family: var(--sans);
    -webkit-font-smoothing: antialiased;
  }

  .sb-nav-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 5px 8px;
    border-radius: 6px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 13px;
    font-weight: 400;
    text-align: left;
    letter-spacing: -0.01em;
    transition: background 0.1s, color 0.1s;
    font-family: var(--sans);
    color: var(--g500);
    line-height: 1.4;
    gap: 8px;
  }
  .sb-nav-btn:hover:not(.active) {
    background: var(--g100);
    color: var(--g900);
  }
  .sb-nav-btn.active {
    background: var(--g100);
    color: var(--g900);
    font-weight: 500;
  }

  .sb-nav-left {
    display: flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
  }

  .sb-quick-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    width: 100%;
    padding: 5px 8px;
    border-radius: 6px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 12.5px;
    font-weight: 400;
    text-align: left;
    letter-spacing: -0.01em;
    transition: background 0.1s, color 0.1s;
    font-family: var(--sans);
    color: var(--g400);
  }
  .sb-quick-btn:hover {
    background: var(--g100);
    color: var(--g700);
  }

  .sb-badge {
    flex-shrink: 0;
    font-size: 10px;
    font-weight: 600;
    line-height: 1;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--g200);
    color: var(--g600);
    letter-spacing: 0;
    font-family: var(--sans);
  }
  .sb-badge-warm {
    background: #fef3c7;
    color: #b45309;
  }

  .sb-section-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--g400);
    letter-spacing: 0.01em;
    padding: 0 8px;
    margin-bottom: 2px;
    font-family: var(--sans);
  }

  .sb-user-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.1s;
    width: 100%;
    border: none;
    background: transparent;
    text-align: left;
  }
  .sb-user-row:hover {
    background: var(--g100);
  }

  .sb-upgrade-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 7px 8px;
    border-radius: 6px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-family: var(--sans);
    transition: background 0.1s;
    text-align: left;
  }
  .sb-upgrade-btn:hover {
    background: var(--g100);
  }
`;

// Minimal dot icon — just a subtle square glyph, like Linear
function NavDot({ active }: { active: boolean }) {
  return (
    <div style={{
      width: 6,
      height: 6,
      borderRadius: 2,
      background: active ? "#18181b" : "#d1d5db",
      flexShrink: 0,
      transition: "background 0.15s",
    }} />
  );
}

export default function Sidebar() {
  const dispatch   = useDispatch<AppDispatch>();
  const activeTab  = useSelector((s: RootState) => s.ui.activeTab ?? "clients");
  const activeView = useSelector((s: RootState) => s.ui.activeView);

  return (
    <aside className="sb" style={{
      width: 220,
      flexShrink: 0,
      height: "100vh",
      background: "#ffffff",
      borderRight: "1px solid #e5e7eb",
      display: "flex",
      flexDirection: "column",
      userSelect: "none",
    }}>
      <style>{css}</style>

      {/* ── Brand ── */}
      <div style={{
        height: 48,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        flexShrink: 0,
        gap: 8,
      }}>
        {/* Wordmark-style logo — clean, no toy icon */}
        <div style={{
          width: 20,
          height: 20,
          borderRadius: 5,
          background: "#18181b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect x="1.5" y="1.5" width="3" height="7" rx="1" fill="white" opacity="0.9"/>
            <rect x="5.5" y="3.5" width="3" height="5" rx="1" fill="white" opacity="0.55"/>
          </svg>
        </div>
        <span style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: "#18181b",
          letterSpacing: "-0.03em",
          fontFamily: "var(--sans)",
        }}>inPay</span>
      </div>

      {/* ── Body ── */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "8px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}>

        {/* Main nav */}
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {NAV.map((item) => {
            const isActive = activeTab === item.id && activeView === "dashboard";
            return (
              <button
                key={item.id}
                onClick={() => dispatch(setTab(item.id))}
                className={`sb-nav-btn${isActive ? " active" : ""}`}
              >
                <div className="sb-nav-left">
                  <NavDot active={isActive} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`sb-badge${item.badgeWarm ? " sb-badge-warm" : ""}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#f3f4f6", margin: "0 -2px" }} />

   

        {/* Viewing indicator */}
        {activeView === "customer" && (
          <div style={{
            padding: "8px 10px",
            borderRadius: 8,
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}>
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 2,
              fontFamily: "var(--sans)",
            }}>
              Viewing
            </div>
            <div style={{
              fontSize: 12.5,
              fontWeight: 500,
              color: "#111827",
              letterSpacing: "-0.01em",
              fontFamily: "var(--sans)",
            }}>
              Customer profile
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}