import api from "../lib/axios";

export interface ChatResponse {
  success: boolean;
  reply: string;
}

export const sendChatMessage = async (
  message: string,
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<ChatResponse> => {
  const { data } = await api.post<ChatResponse>("/chat", { message, history });
  return data;
};