import { api } from "@/api/client";

export const chatService = {
  async getChannels(workspaceId) {
    const data = await api.get(`/workspaces/${workspaceId}/channels`);
    return data.channels || data || [];
  },
  async getAllDMs(workspaces) {
    // aggregate DMs across all workspaces where user is member
    const results = await Promise.all(workspaces.map(ws => 
      api.get(`/workspaces/${ws._id}/channels`).then(d => d.channels || d || []).catch(()=>[])
    ));
    const all = results.flat();
    // return unique DMs only
    const dmMap = new Map();
    all.filter(c=>c.type==="dm").forEach(c=> dmMap.set(c._id, c));
    return Array.from(dmMap.values());
  },
  async createChannel(workspaceId, payload) {
    const data = await api.post(`/workspaces/${workspaceId}/channels`, payload);
    return data.channel || data;
  },
  async getChannel(workspaceId, channelId) {
    const data = await api.get(`/workspaces/${workspaceId}/channels/${channelId}`);
    return data.channel || data;
  },
  async createDM(workspaceId, userId) {
    const data = await api.post(`/workspaces/${workspaceId}/channels/dm`, { userId });
    return data.channel || data;
  },
  async createDMByCode(workspaceId, chatCode) {
    const data = await api.post(`/workspaces/${workspaceId}/channels/dm-by-code`, { chatCode });
    return data.channel || data;
  },
  async getUserByCode(code) {
    const data = await api.get(`/auth/by-code/${code}`);
    return data.user || data;
  },
  async getMessages(workspaceId, channelId, { cursor, limit } = {}) {
    const qs = new URLSearchParams();
    if (cursor) qs.set("cursor", cursor);
    if (limit) qs.set("limit", String(limit));
    const q = qs.toString() ? `?${qs.toString()}` : "";
    const data = await api.get(`/workspaces/${workspaceId}/channels/${channelId}/messages${q}`);
    // backend returns {messages,hasMore,nextCursor}
    return data;
  },
  async sendMessage(workspaceId, channelId, payload) {
    const data = await api.post(`/workspaces/${workspaceId}/channels/${channelId}/messages`, payload);
    return data.message || data;
  },
};
