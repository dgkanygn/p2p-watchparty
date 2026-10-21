import { create } from 'zustand';
import type { ChatMessage } from '../types';

const MAX_CHAT_MESSAGES = 100;

interface ChatStore {
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  addMessage: (msg) =>
    set((state) => {
      const updated = [...state.messages, msg];
      if (updated.length > MAX_CHAT_MESSAGES) {
        return { messages: updated.slice(updated.length - MAX_CHAT_MESSAGES) };
      }
      return { messages: updated };
    }),
  clearChat: () => set({ messages: [] }),
}));
