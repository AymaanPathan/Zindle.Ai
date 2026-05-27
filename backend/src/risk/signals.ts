// src/risk/signals.ts

export interface StripeSignals {
  daysOverdue: number;
  hasFailedPayment: boolean;
  openInvoiceCount: number;
  totalAmountDue: number;
  previousLatePayments: number;
  paymentSuccessRate: number;   // 0–1, derived from status counts
}

export interface HubSpotSignals {
  daysSinceLastReply: number;
  daysSinceLastOpen?: number;
  openedButNeverReplied: boolean;
  totalIgnoredEmails: number;
  hasActiveMeeting: boolean;
  lifecycleStage: string;
}

export interface AggregatedSignals {
  email: string;
  name?: string;
  company?: string;
  stripe: StripeSignals;
  hubspot: HubSpotSignals;
  collectedAt: string;
}

export interface RiskBreakdown {
  signal: string;
  points: number;
  reason: string;
  source: "stripe" | "hubspot";
}

export interface RiskProfile {
  email: string;
  name?: string;
  company?: string;
  score: number;
  category: "healthy" | "watch" | "high_risk" | "critical";
  breakdown: RiskBreakdown[];
  signals: AggregatedSignals;
  calculatedAt: string;
}