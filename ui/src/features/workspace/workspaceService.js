import { api } from "@/api/client";

export const workspaceService = {
  async getWorkspaces() {
    const data = await api.get("/workspaces");
    return data.workspaces || data || [];
  },
  async getWorkspace(id) {
    const data = await api.get(`/workspaces/${id}`);
    return data.workspace || data;
  },
  async createWorkspace({ name, slug }) {
    const payload = { name };
    if (slug) payload.slug = slug;
    const data = await api.post("/workspaces", payload);
    return data.workspace || data;
  },
  async updateWorkspace(id, payload) {
    const data = await api.put(`/workspaces/${id}`, payload);
    return data.workspace || data;
  },
};
