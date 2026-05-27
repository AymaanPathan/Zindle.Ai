
export type RiskLevel = "high" | "medium" | "low";

export interface Client {
  invoice_id: string;
  customer_email: string;

  amount_due: number;
  amount_paid: number;
  amount: number; 

  status: string;
  created: string;
  due_date: string;

  days_overdue: number;

  client_name?: string;
  risk_score?: number;
}

export interface ClientsApiResponse {
  success: boolean;
  count: number;
  data: Client[];
}

// Derives risk level from days_overdue (primary) or risk_score (fallback)
export function getRiskLevel(riskScoreOrDays?: number): RiskLevel {
  if (riskScoreOrDays === undefined || riskScoreOrDays === null) return "low";
  if (riskScoreOrDays >= 30) return "high";
  if (riskScoreOrDays >= 15) return "medium";
  return "low";
}

export function getRiskFromClient(client: Client): RiskLevel {
  // Prefer days_overdue for risk badge coloring
  if (client.days_overdue >= 30) return "high";
  if (client.days_overdue >= 15) return "medium";
  return "low";
}