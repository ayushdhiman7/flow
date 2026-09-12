import { api } from "@/api/client";

export const onboardingService = {
  async updateProfile({ name, avatar }) {
    const payload = {};
    if (name !== undefined) payload.name = name;
    if (avatar !== undefined) payload.avatar = avatar;
    const data = await api.put("/auth/me", payload);
    return data.user || data;
  },

  async createWorkspace({ name, slug }) {
    const payload = { name };
    if (slug) payload.slug = slug;
    const data = await api.post("/workspaces", payload);
    // backend returns { workspace } or workspace directly depending on controller
    return data.workspace || data;
  },

  async getWorkspaces() {
    const data = await api.get("/workspaces");
    // backend returns { workspaces } array
    return data.workspaces || data || [];
  },

  async getMe() {
    const data = await api.get("/auth/me");
    return data.user || data;
  },
};

// Helpers for local persistence (per-user)
const STORAGE_PREFIX = "flow_onboarding";

function storageKey(userId) {
  return userId ? `${STORAGE_PREFIX}:${userId}` : `${STORAGE_PREFIX}:anon`;
}

export function saveOnboardingLocal(userId, payload) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(payload));
  } catch { /* ignore */ }
}

export function loadOnboardingLocal(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearOnboardingLocal(userId) {
  try {
    localStorage.removeItem(storageKey(userId));
  } catch { /* ignore */ }
}

export function isOnboardingCompletedLocal(userId) {
  const data = loadOnboardingLocal(userId);
  return !!(data && data.completed);
}
