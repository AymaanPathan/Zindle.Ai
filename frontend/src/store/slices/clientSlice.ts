import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/axios";

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string | null;
  lifecycle: string | null;
  createdAt: string;
  invoiceCount: number;
  totalInvoiced: number;
  totalDue: number;
  totalPaid: number;           // ← add
  paidInvoiceCount: number;    // ← add
  openInvoiceCount: number;    // ← add
  paymentRate: number | null;  // ← add
  isFullyPaid: boolean;        // ← add
  lastPaymentAt: number | null;
  earliestOpenDueDate: number | null;
  riskLevel: "healthy" | "medium" | "high" | "critical"; // ← add
}
export interface JourneyEvent {
  id: string;
  type: string;
  label: string;
  source: string;
  timestamp: string;
  status: string;
  metadata?: Record<string, unknown>;
}

interface ClientsState {
  list: Client[];
  loading: boolean;
  error: string | null;
  journey: {
    events: JourneyEvent[];
    customerEmail: string | null;
    loading: boolean;
    error: string | null;
  };
}

const initialState: ClientsState = {
  list: [],
  loading: false,
  error: null,
  journey: {
    events: [],
    customerEmail: null,
    loading: false,
    error: null,
  },
};

export const loadClients = createAsyncThunk("clients/load", async () => {
  const { data } = await api.get<Client[]>("/clients");
  return data;
});

export const loadJourney = createAsyncThunk(
  "clients/loadJourney",
  async (email: string) => {
    const { data } = await api.get<{ customerEmail: string; events: JourneyEvent[] }>(
      `/clients/journey?email=${encodeURIComponent(email)}`
    );
    return data;
  }
);

const clientsSlice = createSlice({
  name: "clients",
  initialState,
  reducers: {
    clearJourney(state) {
      state.journey = initialState.journey;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadClients.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(loadClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to load clients";
      })
      .addCase(loadJourney.pending, (state) => {
        state.journey.loading = true;
        state.journey.error = null;
      })
      .addCase(loadJourney.fulfilled, (state, action) => {
        state.journey.loading = false;
        state.journey.events = action.payload.events;
        state.journey.customerEmail = action.payload.customerEmail;
      })
      .addCase(loadJourney.rejected, (state, action) => {
        state.journey.loading = false;
        state.journey.error = action.error.message ?? "Failed to load journey";
      });
  },
});

export const { clearJourney } = clientsSlice.actions;
export default clientsSlice.reducer;