import React from "react";
import Sidebar from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "row",
      height: "100vh",
      width: "100vw",
      overflow: "hidden",
      backgroundColor: "#fafafa",
      fontFamily: "'Geist', system-ui, sans-serif",
    }}>
      <Sidebar />
      <div style={{ flex: 1, overflow: "auto", minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}