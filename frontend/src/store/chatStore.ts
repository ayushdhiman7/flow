import { create } from 'zustand';

interface Channel {
  id: string;
  name?: string;
  type: 'channel' | 'dm';
  members: string[];
  lastMessageAt?: string;
  unreadCount: number;
}

interface Message {
  id: string;
  channelId: string;
  user: { id: string; name: string; email: string; avatar?: string };
  content: string;
  replyTo?: { id: string; content: string; user: { id: string; name: string } };
  attachments: any[];
  createdAt: string;
  isDeleted: boolean;
}

interface ChatState {
  channels: Channel[];
  currentChannel: Channel | null;
  messages: Message[];
  hasMoreMessages: boolean;
  nextCursor: string | null;
  isLoading: boolean;
  setChannels: (channels: Channel[]) => void;
  addChannel: (channel: Channel) => void;
  updateChannel: (id: string, data: Partial<Channel>) => void;
  removeChannel: (id: string) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  setMessages: (messages: Message[], hasMore: boolean, nextCursor: string | null) => void;
  prependMessages: (messages: Message[], hasMore: boolean, nextCursor: string | null) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, data: Partial<Message>) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  incrementUnread: (channelId: string) => void;
  markAsRead: (channelId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  channels: [],
  currentChannel: null,
  messages: [],
  hasMoreMessages: false,
  nextCursor: null,
  isLoading: false,
  setChannels: (channels) => set({ channels }),
  addChannel: (channel) => set((state) => ({ channels: [channel, ...state.channels] })),
  updateChannel: (id, data) => set((state) => ({ channels: state.channels.map((c) => (c.id === id ? { ...c, ...data } : c)) })),
  removeChannel: (id) => set((state) => ({ channels: state.channels.filter((c) => c.id !== id) })),
  setCurrentChannel: (channel) => set({ currentChannel: channel, messages: [], hasMoreMessages: false, nextCursor: null }),
  setMessages: (messages, hasMore, nextCursor) => set({ messages, hasMoreMessages: hasMore, nextCursor }),
  prependMessages: (messages, hasMore, nextCursor) => set((state) => ({
    messages: [...messages.reverse(), ...state.messages],
    hasMoreMessages: hasMore,
    nextCursor,
  })),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, data) => set((state) => ({ messages: state.messages.map((m) => (m.id === id ? { ...m, ...data } : m)) })),
  setLoading: (isLoading) => set({ isLoading }),
  clearMessages: () => set({ messages: [], hasMoreMessages: false, nextCursor: null }),
  incrementUnread: (channelId) => set((state) => ({ channels: state.channels.map((c) => (c.id === channelId ? { ...c, unreadCount: c.unreadCount + 1 } : c)) })),
  markAsRead: (channelId) => set((state) => ({ channels: state.channels.map((c) => (c.id === channelId ? { ...c, unreadCount: 0 } : c)) })),
}));