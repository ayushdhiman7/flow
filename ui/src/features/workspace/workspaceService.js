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
  async joinByCode(code) {
    const data = await api.post("/workspaces/join-by-code", { code: code.trim().toLowerCase() });
    return data; // { message, workspace, status pending }
  },
  async getJoinRequests(workspaceId) {
    const data = await api.get(`/workspaces/${workspaceId}/requests`);
    return data.requests || data || [];
  },
  async handleJoinRequest(workspaceId, requestId, action) {
    const data = await api.post(`/workspaces/${workspaceId}/requests/${requestId}/handle`, { action });
    return data.workspace || data;
  },
};
