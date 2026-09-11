import api from './client';

export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data: { name?: string; avatar?: string }) =>
    api.put('/auth/me', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/me/password', data),
};

export const workspaceApi = {
  list: () => api.get('/workspaces'),
  create: (data: { name: string; slug?: string }) =>
    api.post('/workspaces', data),
  get: (id: string) => api.get(`/workspaces/${id}`),
  update: (id: string, data: { name?: string; settings?: object }) =>
    api.put(`/workspaces/${id}`, data),
  delete: (id: string) => api.delete(`/workspaces/${id}`),
  inviteMember: (id: string, data: { email: string; role: 'admin' | 'member' }) =>
    api.post(`/workspaces/${id}/members`, data),
  updateMember: (id: string, userId: string, role: 'admin' | 'member') =>
    api.put(`/workspaces/${id}/members/${userId}`, { role }),
  removeMember: (id: string, userId: string) =>
    api.delete(`/workspaces/${id}/members/${userId}`),
};

export const boardApi = {
  list: (workspaceId: string) => api.get(`/workspaces/${workspaceId}/boards`),
  create: (workspaceId: string, data: { name: string; description?: string; background?: string; visibility?: 'private' | 'workspace' }) =>
    api.post(`/workspaces/${workspaceId}/boards`, data),
  get: (id: string) => api.get(`/boards/${id}`),
  getFull: (id: string) => api.get(`/boards/${id}/full`),
  getStats: (id: string) => api.get(`/boards/${id}/stats`),
  update: (id: string, data: { name?: string; description?: string; background?: string; visibility?: 'private' | 'workspace' }) =>
    api.put(`/boards/${id}`, data),
  delete: (id: string) => api.delete(`/boards/${id}`),
  addMember: (id: string, userId: string) => api.post(`/boards/${id}/members`, { userId }),
  removeMember: (id: string, userId: string) => api.delete(`/boards/${id}/members/${userId}`),
};

export const listApi = {
  list: (boardId: string) => api.get(`/boards/${boardId}/lists`),
  create: (boardId: string, data: { name: string; position?: number }) =>
    api.post(`/boards/${boardId}/lists`, data),
  get: (id: string) => api.get(`/lists/${id}`),
  update: (id: string, data: { name?: string; position?: number; isArchived?: boolean }) =>
    api.put(`/lists/${id}`, data),
  delete: (id: string) => api.delete(`/lists/${id}`),
  reorder: (boardId: string, listIds: string[]) =>
    api.post(`/boards/${boardId}/lists/reorder`, { listIds }),
};

export const cardApi = {
  list: (listId: string, cursor?: string, limit = 20) =>
    api.get(`/lists/${listId}/cards`, { params: { cursor, limit } }),
  create: (listId: string, data: { title: string; description?: string; position?: number; assignees?: string[]; labels?: string[]; dueDate?: string; startDate?: string }) =>
    api.post(`/lists/${listId}/cards`, data),
  get: (id: string) => api.get(`/cards/${id}`),
  update: (id: string, data: { title?: string; description?: string; assignees?: string[]; labels?: string[]; dueDate?: string | null; startDate?: string | null; isArchived?: boolean }) =>
    api.put(`/cards/${id}`, data),
  move: (id: string, data: { listId: string; position: number }) =>
    api.patch(`/cards/${id}/move`, data),
  delete: (id: string) => api.delete(`/cards/${id}`),
  addAssignees: (id: string, userIds: string[]) =>
    api.post(`/cards/${id}/assignees`, { userIds }),
  removeAssignee: (id: string, assigneeId: string) =>
    api.delete(`/cards/${id}/assignees/${assigneeId}`),
};

export const chatApi = {
  list: (workspaceId: string) => api.get(`/workspaces/${workspaceId}/channels`),
  create: (workspaceId: string, data: { name?: string; type?: 'channel' | 'dm'; memberIds: string[] }) =>
    api.post(`/workspaces/${workspaceId}/channels`, data),
  createDM: (workspaceId: string, userId: string) =>
    api.post(`/workspaces/${workspaceId}/channels/dm`, { userId }),
  get: (id: string) => api.get(`/channels/${id}`),
  getMessages: (id: string, cursor?: string, limit = 50) =>
    api.get(`/channels/${id}/messages`, { params: { cursor, limit } }),
  sendMessage: (id: string, data: { content: string; replyTo?: string }) =>
    api.post(`/channels/${id}/messages`, data),
};