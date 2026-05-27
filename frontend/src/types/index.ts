// ─── Invoice Types ───────────────────────────────────────────────────────────

export interface Invoice {
  invoice_id: string;
  customer_email: string;
  amount_due: number;
  amount_paid: number;
  amount: number;
  status: "open" | "void" | "draft" | "paid" | "uncollectible";
  created: string;
  due_date?: string;
  days_overdue: number;
}

export interface ClientsResponse {
  success: boolean;
  count: number;
  data: Invoice[];
}

// ─── Risk Types ───────────────────────────────────────────────────────────────

export type RiskCategory = "critical" | "high_risk" | "watch" | "healthy";

export interface RiskSignalBreakdown {
  signal: string;
  points: number;
  reason: string;
  source: "stripe" | "posthog" | "hubspot";
}

export interface StripeSignals {
  daysOverdue: number;
  hasFailedPayment: boolean;
  openInvoiceCount: number;
  totalAmountDue: number;
  previousLatePayments: number;
  paymentSuccessRate: number;
}

export interface PosthogSignals {
  usageDropPercent: number;
  daysSinceLastActive: number;
  activeFeatureCount: number;
  sessionCountThisMonth: number;
  sessionCountLastMonth: number;
  hasAbandoned: boolean;
}

export interface HubspotSignals {
  daysSinceLastReply: any;
  openedButNeverReplied: boolean;
  totalIgnoredEmails: number;
  hasActiveMeeting: boolean;
  lifecycleStage: string;
}

export interface RiskSignals {
  stripe: StripeSignals;
  posthog: PosthogSignals;
  hubspot: HubspotSignals;
}

export interface RiskAI {
  situation: string;
  actions: string[];
  urgency: "immediate" | "high" | "medium" | "low";
}

export interface RiskCustomer {
  riskScore: null;
  email: string;
  name: string;
  company?: string;
  score: number;
  category: RiskCategory;
  breakdown: RiskSignalBreakdown[];
  totalAmountDue: number;
  daysOverdue: number;
  usageDropPercent: number;
  daysSinceLastActive: number;
  calculatedAt: string;
  ai?: RiskAI;
}

export interface RiskDetailCustomer extends RiskCustomer {
  signals: RiskSignals;
}

export interface RiskAllResponse {
  success: boolean;
  summary: {
    total: number;
    critical: number;
    high_risk: number;
    watch: number;
    healthy: number;
    totalAmountAtRisk: number;
  };
  data: RiskCustomer[];
}

export interface TopRiskCustomer {
  totalDue: null;
  riskLevel: any;
  riskScore: null;
  email: string;
  name: string;
  company: string;
  score: number;
  category: RiskCategory;
  topReason: string;
  totalAmountDue: number;
}

export interface RiskSummaryResponse {
  success: boolean;
  data: {
    totals: {
      all: number;
      critical: number;
      high_risk: number;
      watch: number;
      healthy: number;
    };
    totalAmountAtRisk: number;
    topRiskCustomers: TopRiskCustomer[];
  };
}

export interface RiskDetailResponse {
  success: boolean;
  data: RiskDetailCustomer;
}

// ─── UI State Types ───────────────────────────────────────────────────────────

export type ActiveView = "dashboard" | "invoices" | "risk" | "customer";

export interface UIState {
  activeView: ActiveView;
  selectedCustomerEmail: string | null;
  sidebarCollapsed: boolean;
}
