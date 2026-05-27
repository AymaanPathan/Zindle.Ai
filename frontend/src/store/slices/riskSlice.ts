import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchRiskAll,
  fetchRiskSummary,
  fetchRiskByEmail,
} from "../../api/risks.api";
import type {
  RiskCustomer,
  RiskDetailCustomer,
  TopRiskCustomer,
} from "../../types";

interface RiskState {
  all: RiskCustomer[];
  summary: {
    totals: {
      all: number;
      critical: number;
      high_risk: number;
      watch: number;
      healthy: number;
    } | null;
    totalAmountAtRisk: number;
    topRiskCustomers: TopRiskCustomer[];
  };
  detail: RiskDetailCustomer | null;
  loadingAll: boolean;
  loadingSummary: boolean;
  loadingDetail: boolean;
  errorAll: string | null;
  errorSummary: string | null;
  errorDetail: string | null;
}

const initialState: RiskState = {
  all: [],
  summary: {
    totals: null,
    totalAmountAtRisk: 0,
    topRiskCustomers: [],
  },
  detail: null,
  loadingAll: false,
  loadingSummary: false,
  loadingDetail: false,
  errorAll: null,
  errorSummary: null,
  errorDetail: null,
};

export const loadRiskAll = createAsyncThunk(
  "risk/loadAll",
  async (withAI: boolean = false) => {
    const res = await fetchRiskAll(withAI);
    return res;
  },
);

export const loadRiskSummary = createAsyncThunk(
  "risk/loadSummary",
  async () => {
    const res = await fetchRiskSummary();
    return res.data;
  },
);

export const loadRiskDetail = createAsyncThunk(
  "risk/loadDetail",
  async (email: string) => {
    const res = await fetchRiskByEmail(email);
    return res.data;
  },
);

const riskSlice = createSlice({
  name: "risk",
  initialState,
  reducers: {
    clearDetail(state) {
      state.detail = null;
    },
  },
  extraReducers: (builder) => {
    // All
    builder
      .addCase(loadRiskAll.pending, (state) => {
        state.loadingAll = true;
        state.errorAll = null;
      })
      .addCase(loadRiskAll.fulfilled, (state, action) => {
        state.loadingAll = false;
        state.all = action.payload.data;
      })
      .addCase(loadRiskAll.rejected, (state, action) => {
        state.loadingAll = false;
        state.errorAll = action.error.message ?? "Failed to load risk data";
      });

    // Summary
    builder
      .addCase(loadRiskSummary.pending, (state) => {
        state.loadingSummary = true;
        state.errorSummary = null;
      })
      .addCase(loadRiskSummary.fulfilled, (state, action) => {
        state.loadingSummary = false;
        state.summary = action.payload;
      })
      .addCase(loadRiskSummary.rejected, (state, action) => {
        state.loadingSummary = false;
        state.errorSummary = action.error.message ?? "Failed to load summary";
      });

    // Detail
    builder
      .addCase(loadRiskDetail.pending, (state) => {
        state.loadingDetail = true;
        state.errorDetail = null;
        state.detail = null;
      })
      .addCase(loadRiskDetail.fulfilled, (state, action) => {
        state.loadingDetail = false;
        state.detail = action.payload;
      })
      .addCase(loadRiskDetail.rejected, (state, action) => {
        state.loadingDetail = false;
        state.errorDetail = action.error.message ?? "Failed to load detail";
      });
  },
});

export const { clearDetail } = riskSlice.actions;
export default riskSlice.reducer;
