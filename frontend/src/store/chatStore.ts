import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
}

interface ChatState {
  threads: ChatThread[];
  activeThreadId: string | null;
  createThread: () => void;
  selectThread: (id: string) => void;
  sendMessage: (content: string) => void;
}

function uid(): string {
  return crypto.randomUUID();
}

export const useChatStore = create<ChatState>((set, get) => ({
  threads: [],
  activeThreadId: null,

  createThread: () => {
    const thread: ChatThread = {
      id: uid(),
      title: "New chat",
      messages: [],
    };
    set((state) => ({
      threads: [thread, ...state.threads],
      activeThreadId: thread.id,
    }));
  },

  selectThread: (id) => set({ activeThreadId: id }),

  sendMessage: (content) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const { activeThreadId } = get();
    if (!activeThreadId) return;

    const now = new Date().toISOString();
    const userMessage: ChatMessage = {
      id: uid(),
      role: "user",
      content: trimmed,
      createdAt: now,
    };
    const reply: ChatMessage = {
      id: uid(),
      role: "assistant",
      content: "Placeholder reply — wire me up to the EffectNode agent.",
      createdAt: now,
    };

    set((state) => ({
      threads: state.threads.map((thread) =>
        thread.id === activeThreadId
          ? {
              ...thread,
              title:
                thread.messages.length === 0 ? trimmed.slice(0, 32) : thread.title,
              messages: [...thread.messages, userMessage, reply],
            }
          : thread,
      ),
    }));
  },
}));
