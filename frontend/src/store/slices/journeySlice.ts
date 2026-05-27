
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchJourney } from "../../api/journeyApi";
import type {
  JourneyResponse,
  JourneyEvent,
  JourneyPattern,
  JourneySummary,
  JourneyAI,
} from "../../api/journeyApi";

// re-export types so consumers can import from one place
export type {
  JourneyResponse,
  JourneyEvent,
  JourneyPattern,
  JourneySummary,
  JourneyAI,
};

// ─── State ────────────────────────────────────────────────────────────────────

interface JourneyState {
  data: JourneyResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: JourneyState = {
  data: null,
  loading: false,
  error: null,
};

// ─── Thunk ────────────────────────────────────────────────────────────────────

export const loadJourney = createAsyncThunk(
  "journey/load",
  async (email: string) => {
    return await fetchJourney(email);
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const journeySlice = createSlice({
  name: "journey",
  initialState,
  reducers: {
    clearJourney(state) {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadJourney.pending, (state) => {
        state.loading = true;
        state.error = null;
        // keep stale data visible while refreshing
      })
      .addCase(loadJourney.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(loadJourney.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to load journey";
      });
  },
});

export const { clearJourney } = journeySlice.actions;
export default journeySlice.reducer;