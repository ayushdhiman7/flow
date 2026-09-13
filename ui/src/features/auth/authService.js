import { api, apiFetch } from "@/api/client";

export const authService = {
  async signUp({ name, email, password }) {
    // backend expects { name, email, password }
    const data = await api.post("/auth/register", { name, email, password });
    // returns { user, accessToken } + sets httpOnly cookies
    return data;
  },

  async signIn({ email, password }) {
    const data = await api.post("/auth/login", { email, password });
    return data;
  },

  async logout() {
    const data = await api.post("/auth/logout", {});
    return data;
  },

  async getMe() {
    const data = await api.get("/auth/me");
    // backend returns { user }
    return data.user || data;
  },

  async refresh() {
    // Uses refreshToken cookie
    const data = await api.post("/auth/refresh", {});
    return data;
  },

  async forgotPassword({ email }) {
    // Backend currently does NOT have this endpoint.
    // We attempt /auth/forgot-password if it exists, otherwise we throw a clear error
    // Do NOT fake email sending. Show appropriate message.
    const data = await api.post("/auth/forgot-password", { email });
    return data;
  },

  async updateProfile(payload) {
    const data = await api.put("/auth/me", payload);
    return data.user || data;
  },

  async uploadAvatar(file) {
    const form = new FormData();
    form.append("avatar", file);
    const data = await apiFetch("/auth/me/avatar", { method: "POST", body: form });
    return data.user || data;
  },
};
