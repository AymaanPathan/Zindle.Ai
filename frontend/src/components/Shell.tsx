import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store/index";
import AppShell from "../layout/AppShell";
import Dashboard from "../pages/Dashboard";
import Activity from "../pages/Activity";
import Chat from "../pages/Chat";
import CustomerProfile from "../pages/Customer";
import JourneyView from "../components/Journey/JourneyView";
import LandingPage from "../pages/LandingPage";
import { closJourney } from "../store/slices/uiSlice";
import { useState } from "react";

export default function Shell() {
  const dispatch              = useDispatch();
  const activeView            = useSelector((s: RootState) => s.ui.activeView);
  const activeTab             = useSelector((s: RootState) => s.ui.activeTab ?? "clients");
  const selectedEmail         = useSelector((s: RootState) => s.ui.selectedEmail);
  const selectedCustomerEmail = useSelector((s: RootState) => s.ui.selectedCustomerEmail);

  const [showLanding, setShowLanding] = useState(true);

  if (showLanding) {
    return <LandingPage onEnterApp={() => setShowLanding(false)} />;
  }

  if (activeView === "journey" && selectedEmail) {
    return (
      <AppShell>
        <JourneyView
          email={selectedEmail}
          onClose={() => dispatch(closJourney())}
        />
      </AppShell>
    );
  }

  if (activeView === "customer" && selectedCustomerEmail) {
    return (
      <AppShell>
        <CustomerProfile />
      </AppShell>
    );
  }

  return (
    <AppShell>
      {activeTab === "chat"     && <Chat />}
      {activeTab === "activity" && <Activity />}
      {activeTab === "clients"  && <Dashboard />}
    </AppShell>
  );
}