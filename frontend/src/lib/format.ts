import type { RiskCategory } from "../types";

export const formatCurrency = (cents: number): string => {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(dollars);
};

export const formatDate = (timestamp: string | number): string => {
  const ts =
    typeof timestamp === "string" ? parseInt(timestamp, 10) : timestamp;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(ts * 1000));
};

export const formatRelativeDate = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const riskCategoryConfig: Record<
  RiskCategory,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  critical: {
    label: "Critical",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    dot: "bg-red-500",
  },
  high_risk: {
    label: "High Risk",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    dot: "bg-orange-500",
  },
  watch: {
    label: "Watch",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    dot: "bg-yellow-400",
  },
  healthy: {
    label: "Healthy",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    dot: "bg-emerald-500",
  },
};

export const scoreToGrade = (score: number): string => {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High Risk";
  if (score >= 30) return "Watch";
  return "Healthy";
};

export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

export const sourceIcon: Record<string, string> = {
  stripe: "💳",
  posthog: "📊",
  hubspot: "🔗",
};
