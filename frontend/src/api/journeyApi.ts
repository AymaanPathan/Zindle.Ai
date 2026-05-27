// src/lib/api/journeyApi.ts
// Dedicated API for the full journey endpoint.
// The journey response is far richer than simple client data — it includes
// risk scoring, AI analysis, detected patterns, and a full event timeline.

import api from "../lib/axios"; // adjust path to your axios instance

// ─── Event ────────────────────────────────────────────────────────────────────

export interface JourneyEvent {
  id: string;
  type: string;
  label: string;
  source: "stripe" | "resend" | "hubspot" | string;
  timestamp: string;
  status: string;
  metadata?: Record<string, unknown>;
}

// ─── Pattern ──────────────────────────────────────────────────────────────────

export interface JourneyPattern {
  code: string;
  label: string;
  description: string;
  severity: "critical" | "warning" | "info";
  relatedEventIds: string[];
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export interface JourneySummary {
  totalInvoices: number;
  totalPaid: number;
  totalDue: number;
  paidCount: number;
  overdueCount: number;
  emailsSent: number;
  emailsOpened: number;
  linksClicked: number;
  followUpCount: number;
  isGhosted: boolean;
  daysSinceLastContact: number;
  paymentSuccessRate: number;
}

// ─── AI block ─────────────────────────────────────────────────────────────────

export interface JourneyAI {
  situation: string;
  journeyNarrative: string;
  patternInsights: string[];
  actions: string[];
  urgency: "low" | "medium" | "high" | "critical";
}

// ─── Full response ─────────────────────────────────────────────────────────────

export interface JourneyResponse {
  customerEmail: string;
  riskScore: number;
  riskCategory: "healthy" | "watch" | "high_risk" | "critical";
  summary: JourneySummary;
  patterns: JourneyPattern[];
  ai: JourneyAI;
  events: JourneyEvent[];
}

// ─── API call ──────────────────────────────────────────────────────────────────

/**
 * Fetch the full journey for a customer by email.
 * GET /clients/journey?email=<email>
 */
export const fetchJourney = async (email: string): Promise<JourneyResponse> => {
  const { data } = await api.get<JourneyResponse>(
    `/clients/journey?email=${encodeURIComponent(email)}`
  );
  return data;
};