export type JourneyEventStatus =
  | "completed"
  | "pending"
  | "ghosted"
  | "skipped"
  | "warning";

export type JourneyEventSource =
  | "stripe"
  | "hubspot"
  | "resend"
  | "posthog"
  | "crm"
  | "system"; // synthesised events (e.g. ghosted detection)

export type JourneyEventType =
  | "contact_created"
  | "deal_closed"
  | "invoice_created"
  | "invoice_sent"
  | "invoice_paid"
  | "invoice_overdue"
  | "invoice_partially_paid"
  | "email_sent"
  | "email_delivered"
  | "email_bounced"
  | "email_opened"
  | "email_clicked"
  | "follow_up_sent"
  | "ghosted"
  | "payment_failed";

export interface JourneyEvent {
  id: string;
  type: JourneyEventType;
  label: string;
  source: JourneyEventSource;
  timestamp?: string;
  status: JourneyEventStatus;
  metadata?: Record<string, any>;
}

export interface CustomerJourney {
  customerEmail: string;
  events: JourneyEvent[];
  summary: JourneySummary;
}

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
  daysSinceLastContact: number | null;
  paymentSuccessRate: number; // 0–1
}