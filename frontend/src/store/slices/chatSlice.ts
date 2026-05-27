import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { sendChatMessage } from "../../api/chat.api";

export type Role = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  timestamp: string;
}

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  loading: false,
  error: null,
};

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async (text: string, { dispatch, getState }) => {
    // Optimistically add user message
    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      text,
      timestamp: new Date().toISOString(),
    };
    dispatch(chatSlice.actions.addMessage(userMsg));

    // Build conversation history for context
    const state = (getState() as { chat: ChatState }).chat;
    const history = state.messages
      .slice(-10) // last 10 messages for context window
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.text }));

    const response = await sendChatMessage(text, history);
    const reply = response.reply?.trim() || "I couldn't generate a response. Please try again.";

    const assistantMsg: ChatMessage = {
      id: uid(),
      role: "assistant",
      text: reply,
      timestamp: new Date().toISOString(),
    };

    return assistantMsg;
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload);
    },
    clearChat(state) {
      state.messages = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push(action.payload);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to send message";
        state.messages.push({
          id: uid(),
          role: "assistant",
          text: "Something went wrong. Please try again.",
          timestamp: new Date().toISOString(),
        });
      });
  },
});

export const { addMessage, clearChat } = chatSlice.actions;
export default chatSlice.reducer;