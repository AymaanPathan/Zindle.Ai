// src/store/slices/uiSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  activeView: "dashboard" | "journey" | "customer";
  selectedEmail: string | null;
  selectedCustomerEmail: string | null;
  activeTab: "clients" | "activity" | "chat";
}

const initialState: UiState = {
  activeView: "dashboard",
  selectedEmail: null,
  selectedCustomerEmail: null,
  activeTab: "clients",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openJourney(state, action: PayloadAction<string>) {
      state.activeView = "journey";
      state.selectedEmail = action.payload;
    },
    closJourney(state) {
      state.activeView = "dashboard";
      state.selectedEmail = null;
    },
    openCustomer(state, action: PayloadAction<string>) {
      state.activeView = "customer";
      state.selectedCustomerEmail = action.payload;
    },
    closeCustomer(state) {
      // Return to whichever tab was active before
      state.activeView = "dashboard";
      state.selectedCustomerEmail = null;
    },
    setTab(state, action: PayloadAction<"clients" | "activity" | "chat">) {
      state.activeTab = action.payload;
      state.activeView = "dashboard";
      state.selectedEmail = null;
      state.selectedCustomerEmail = null;
    },
  },
});

export const { openJourney, closJourney, openCustomer, closeCustomer, setTab } = uiSlice.actions;
export default uiSlice.reducer;