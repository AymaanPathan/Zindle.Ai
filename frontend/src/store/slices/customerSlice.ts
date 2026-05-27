// src/store/slices/customerSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CustomerContact {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  company: string;
  lifecyclestage: string;
  createdate: string;
}

export interface CustomerInvoice {
  id: string;
  number: string;
  status: "paid" | "open" | "uncollectible" | "void";
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  created: number;
  due_date: number;
  status_transitions__paid_at: number | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  // Annotated by backend
  is_overdue: boolean;
  days_overdue: number;
  created_fmt: string;
  due_date_fmt: string;
  paid_at_fmt: string;
}

export interface CustomerEmailEvent {
  source: "hubspot" | "resend";
  type: string;
  created: number | string;
  subject?: string;
  sender?: string;
  link?: string;
  ip_address?: string;
}

export interface CustomerSummary {
  total_invoiced: number;
  total_paid: number;
  total_due: number;
  paid_count: number;
  unpaid_count: number;
  overdue_count: number;
  last_payment_date: string | null;
  risk_level: "healthy" | "medium" | "high" | "critical";
    is_fully_paid: boolean; 
}

export interface CustomerProfile {
  contact: CustomerContact | null;
  invoices: CustomerInvoice[];
  emailEvents: CustomerEmailEvent[];
  summary: CustomerSummary;
}

export interface EmailDraft {
  type: string;
  subject: string;
  body: string;
}

interface CustomerState {
  profile: CustomerProfile | null;
  profileLoading: boolean;
  profileError: string | null;

  draft: EmailDraft | null;
  draftLoading: boolean;
  draftError: string | null;

  sendLoading: boolean;
  sendError: string | null;
  sendSuccess: boolean;
  sentMessageId: string | null;
}

const initialState: CustomerState = {
  profile: null,
  profileLoading: false,
  profileError: null,

  draft: null,
  draftLoading: false,
  draftError: null,

  sendLoading: false,
  sendError: null,
  sendSuccess: false,
  sentMessageId: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const loadCustomerProfile = createAsyncThunk(
  "customer/loadProfile",
  async (email: string) => {
    const { data } = await api.get<CustomerProfile>(
      `/customers/${encodeURIComponent(email)}/profile`
    );
    return data;
  }
);

export const draftCustomerEmail = createAsyncThunk(
  "customer/draftEmail",
  async ({ email, type, customInstruction }: { email: string; type: string; customInstruction?: string }) => {
    const { data } = await api.post<EmailDraft>(
      `/customers/${encodeURIComponent(email)}/draft-email`,
      { type, customInstruction }
    );
    return data;
  }
);

export const sendCustomerEmail = createAsyncThunk(
  "customer/sendEmail",
  async ({ email, subject, body, fromName }: {
    email: string; subject: string; body: string; fromName?: string;
  }) => {
    const { data } = await api.post<{ success: boolean; messageId: string }>(
      `/customers/${encodeURIComponent(email)}/send-email`,
      { subject, body, fromName }
    );
    return data;
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    clearCustomer(state) {
      state.profile = null;
      state.profileError = null;
      state.draft = null;
      state.draftError = null;
      state.sendSuccess = false;
      state.sendError = null;
      state.sentMessageId = null;
    },
    clearDraft(state) {
      state.draft = null;
      state.draftError = null;
    },
    clearSendStatus(state) {
      state.sendSuccess = false;
      state.sendError = null;
      state.sentMessageId = null;
    },
    setDraftBody(state, action) {
      if (state.draft) state.draft.body = action.payload;
    },
    setDraftSubject(state, action) {
      if (state.draft) state.draft.subject = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Profile
      .addCase(loadCustomerProfile.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
        state.profile = null;
      })
      .addCase(loadCustomerProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profile = action.payload;
      })
      .addCase(loadCustomerProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = action.error.message ?? "Failed to load profile";
      })
      // Draft
      .addCase(draftCustomerEmail.pending, (state) => {
        state.draftLoading = true;
        state.draftError = null;
        state.draft = null;
      })
      .addCase(draftCustomerEmail.fulfilled, (state, action) => {
        state.draftLoading = false;
        state.draft = action.payload;
      })
      .addCase(draftCustomerEmail.rejected, (state, action) => {
        state.draftLoading = false;
        state.draftError = action.error.message ?? "Failed to generate draft";
      })
      // Send
      .addCase(sendCustomerEmail.pending, (state) => {
        state.sendLoading = true;
        state.sendError = null;
        state.sendSuccess = false;
      })
      .addCase(sendCustomerEmail.fulfilled, (state, action) => {
        state.sendLoading = false;
        state.sendSuccess = true;
        state.sentMessageId = action.payload.messageId;
      })
      .addCase(sendCustomerEmail.rejected, (state, action) => {
        state.sendLoading = false;
        state.sendError = action.error.message ?? "Failed to send email";
      });
  },
});

export const { clearCustomer, clearDraft, clearSendStatus, setDraftBody, setDraftSubject } = customerSlice.actions;
export default customerSlice.reducer;