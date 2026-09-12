import { api, apiFetch } from "@/api/client";

export const boardService = {
  // Boards - workspace scoped
  async getBoards(workspaceId) {
    const data = await api.get(`/workspaces/${workspaceId}/boards`);
    return data.boards || data || [];
  },
  async createBoard(workspaceId, payload) {
    const data = await api.post(`/workspaces/${workspaceId}/boards`, payload);
    return data.board || data;
  },
  async getBoardFull(workspaceId, boardId) {
    const data = await api.get(`/workspaces/${workspaceId}/boards/${boardId}/full`);
    return data;
  },
  async deleteBoard(workspaceId, boardId) {
    const data = await api.delete(`/workspaces/${workspaceId}/boards/${boardId}`);
    return data;
  },

  // Lists - board scoped: /api/boards/:boardId/lists
  async getLists(boardId) {
    const data = await api.get(`/boards/${boardId}/lists`);
    return data.lists || data || [];
  },
  async createList(boardId, payload) {
    const data = await api.post(`/boards/${boardId}/lists`, payload);
    return data.list || data;
  },
  async updateList(boardId, listId, payload) {
    // boardId required for route mounting
    const data = await api.put(`/boards/${boardId}/lists/${listId}`, payload);
    return data.list || data;
  },
  async deleteList(boardId, listId) {
    const data = await api.delete(`/boards/${boardId}/lists/${listId}`);
    return data;
  },
  async reorderLists(boardId, listIds) {
    const data = await api.post(`/boards/${boardId}/lists/reorder`, { listIds });
    return data.lists || data;
  },

  // Cards - list scoped: /api/lists/:listId/cards and /api/lists/:listId/cards/:id/move
  async createCard(listId, payload) {
    const data = await api.post(`/lists/${listId}/cards`, payload);
    return data.card || data;
  },
  async getCards(listId) {
    const data = await api.get(`/lists/${listId}/cards`);
    // returns { cards, hasMore, nextCursor }
    return data;
  },
  async updateCard(listId, cardId, payload) {
    // card update is PUT /lists/:listId/cards/:id
    const data = await api.put(`/lists/${listId}/cards/${cardId}`, payload);
    return data.card || data;
  },
  async deleteCard(listId, cardId) {
    const data = await api.delete(`/lists/${listId}/cards/${cardId}`);
    return data;
  },
  async moveCard({ cardId, fromListId, toListId, position }) {
    // PATCH /lists/:listId/cards/:id/move - spec says PATCH /cards/:id/move but actual mount is lists prefix
    // Try patch via lists route first, fallback to generic /cards
    try {
      const data = await apiFetch(`/lists/${fromListId}/cards/${cardId}/move`, { method: "PATCH", body: { listId: toListId, position } });
      return data.card || data;
    } catch (e) {
      if (e.status === 404) {
        // try generic cards route
        const data = await apiFetch(`/cards/${cardId}/move`, { method: "PATCH", body: { listId: toListId, position } });
        return data.card || data;
      }
      throw e;
    }
  },
};
