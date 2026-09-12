import { api } from "@/api/client";

export const notesService = {
  async fetchNotes(workspaceId, params = {}) {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.isPinned) qs.set("isPinned", params.isPinned);
    const q = qs.toString() ? `?${qs.toString()}` : "";
    const data = await api.get(`/workspaces/${workspaceId}/notes${q}`);
    return data.notes || data || [];
  },
  async fetchNote(workspaceId, id) {
    const data = await api.get(`/workspaces/${workspaceId}/notes/${id}`);
    return data.note || data;
  },
  async createNote(workspaceId, payload) {
    const data = await api.post(`/workspaces/${workspaceId}/notes`, payload);
    return data.note || data;
  },
  async updateNote(workspaceId, id, payload) {
    const data = await api.put(`/workspaces/${workspaceId}/notes/${id}`, payload);
    return data.note || data;
  },
  async deleteNote(workspaceId, id) {
    const data = await api.delete(`/workspaces/${workspaceId}/notes/${id}`);
    return data;
  },
};
