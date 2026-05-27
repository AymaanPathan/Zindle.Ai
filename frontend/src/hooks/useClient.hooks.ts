import { useEffect } from "react";
import type { Client, RiskLevel } from "../types/client.types";
import { getRiskLevel } from "../types/client.types";
import { fetchClients, useAppDispatch, useAppSelector } from "../store/store";

export interface UseClientsReturn {
  clients: Client[];
  loading: boolean;
  error: string | null;
  selectedClientEmail: string | null;
  refetch: () => void;
  totalOverdue: number;
  highRiskCount: number;
  getClientRisk: (client: Client) => RiskLevel;
}

export function useClients(): UseClientsReturn {
  const dispatch = useAppDispatch();
  const { data: clients, loading, error, selectedClientEmail } =
    useAppSelector((state) => state.clients);

  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  const refetch = () => {
    dispatch(fetchClients());
  };

  const totalOverdue = clients.reduce((sum, c) => sum + (c.amount ?? 0), 0);

  const highRiskCount = clients.filter(
    (c) => getRiskLevel(c.risk_score) === "high"
  ).length;

  const getClientRisk = (client: Client): RiskLevel =>
    getRiskLevel(client.risk_score);

  return {
    clients,
    loading,
    error,
    selectedClientEmail,
    refetch,
    totalOverdue,
    highRiskCount,
    getClientRisk,
  };
}