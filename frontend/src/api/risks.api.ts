import api from "../lib/axios";
import type {
  RiskAllResponse,
  RiskSummaryResponse,
  RiskDetailResponse,
} from "../types";

export const fetchRiskAll = async (
  withAI = false,
): Promise<RiskAllResponse> => {
  const { data } = await api.get<RiskAllResponse>("/risk/all", {
    params: withAI ? { ai: true } : {},
  });
  return data;
};

export const fetchRiskSummary = async (): Promise<RiskSummaryResponse> => {
  const { data } = await api.get<RiskSummaryResponse>("/risk/summary");
  return data;
};

export const fetchRiskByEmail = async (
  email: string,
): Promise<RiskDetailResponse> => {
  const { data } = await api.get<RiskDetailResponse>(
    `/risk/${encodeURIComponent(email)}`,
  );
  return data;
};
