import api from "../lib/axios";
import type { JourneyEvent } from "../store/slices/clientSlice";
import type { ClientsResponse } from "../types";

export const fetchClients = async (): Promise<ClientsResponse> => {
  const { data } = await api.get<ClientsResponse>("/clients");
  return data;
};

export interface JourneyResponse {
  clientId: string;
  customerEmail: string;
  events: JourneyEvent[];
}
 

export const fetchClientJourney = async (
  clientId: string,
): Promise<JourneyResponse> => {
  const { data } = await api.get<JourneyResponse>(
    `/clients/${encodeURIComponent(clientId)}/journey`,
  );
  return data;
};
 