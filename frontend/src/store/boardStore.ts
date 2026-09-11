import { create } from 'zustand';

interface List {
  id: string;
  name: string;
  position: number;
  cards: Card[];
  isArchived: boolean;
}

interface Card {
  id: string;
  listId: string;
  title: string;
  description?: string;
  position: number;
  assignees: User[];
  labels: string[];
  dueDate?: string;
  startDate?: string;
  isArchived: boolean;
  createdBy: string;
  attachments: Attachment[];
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface BoardState {
  currentBoard: { id: string; name: string; background?: string } | null;
  lists: List[];
  isLoading: boolean;
  setBoard: (board: { id: string; name: string; background?: string }) => void;
  setLists: (lists: List[]) => void;
  addList: (list: List) => void;
  updateList: (id: string, data: Partial<List>) => void;
  deleteList: (id: string) => void;
  reorderLists: (listIds: string[]) => void;
  addCard: (listId: string, card: Card) => void;
  updateCard: (cardId: string, data: Partial<Card>) => void;
  moveCard: (cardId: string, newListId: string, newPosition: number) => void;
  deleteCard: (cardId: string) => void;
  addAssignee: (cardId: string, user: User) => void;
  removeAssignee: (cardId: string, userId: string) => void;
  setLoading: (loading: boolean) => void;
  clearBoard: () => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  currentBoard: null,
  lists: [],
  isLoading: false,
  setBoard: (board) => set({ currentBoard: board }),
  setLists: (lists) => set({ lists }),
  addList: (list) => set((state) => ({ lists: [...state.lists, list].sort((a, b) => a.position - b.position) })),
  updateList: (id, data) => set((state) => ({ lists: state.lists.map((l) => (l.id === id ? { ...l, ...data } : l)) })),
  deleteList: (id) => set((state) => ({ lists: state.lists.filter((l) => l.id !== id) })),
  reorderLists: (listIds) => set((state) => ({
    lists: listIds.map((id, index) => {
      const list = state.lists.find((l) => l.id === id);
      return list ? { ...list, position: index * 1000 } : null;
    }).filter(Boolean) as List[],
  })),
  addCard: (listId, card) => set((state) => ({
    lists: state.lists.map((l) => (l.id === listId ? { ...l, cards: [...l.cards, card].sort((a, b) => a.position - b.position) } : l)),
  })),
  updateCard: (cardId, data) => set((state) => ({
    lists: state.lists.map((l) => ({
      ...l,
      cards: l.cards.map((c) => (c.id === cardId ? { ...c, ...data } : c)),
    })),
  })),
  moveCard: (cardId, newListId, newPosition) => set((state) => {
    let card: Card | null = null;
    const newLists = state.lists.map((l) => {
      if (l.id === newListId) {
        return { ...l, cards: [...l.cards, { ...card!, position: newPosition }].sort((a, b) => a.position - b.position) };
      }
      const filtered = l.cards.filter((c) => {
        if (c.id === cardId) {
          card = c;
          return false;
        }
        return true;
      });
      return { ...l, cards: filtered };
    });
    return { lists: newLists };
  }),
  deleteCard: (cardId) => set((state) => ({
    lists: state.lists.map((l) => ({ ...l, cards: l.cards.filter((c) => c.id !== cardId) })),
  })),
  addAssignee: (cardId, user) => set((state) => ({
    lists: state.lists.map((l) => ({
      ...l,
      cards: l.cards.map((c) => (c.id === cardId ? { ...c, assignees: [...c.assignees, user] } : c)),
    })),
  })),
  removeAssignee: (cardId, userId) => set((state) => ({
    lists: state.lists.map((l) => ({
      ...l,
      cards: l.cards.map((c) => (c.id === cardId ? { ...c, assignees: c.assignees.filter((u) => u.id !== userId) } : c)),
    })),
  })),
  setLoading: (isLoading) => set({ isLoading }),
  clearBoard: () => set({ currentBoard: null, lists: [] }),
}));