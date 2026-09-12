const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getBaseUrl() {
  // Ensure no trailing slash duplication and ensure /api prefix if needed
  let url = API_URL.replace(/\/$/, "");
  // If user provides "http://localhost:3000" we need to add /api
  // If they provide "http://localhost:3000/api" keep it
  if (!url.endsWith("/api")) {
    url = `${url}/api`;
  }
  return url;
}

export const API_BASE = getBaseUrl();

async function parseJsonSafe(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

function getErrorMessage(data, fallback) {
  if (!data) return fallback;
  if (data.error) return data.error;
  if (data.message) return data.message;
  if (data.details && Array.isArray(data.details) && data.details.length > 0) {
    // join first details message
    return data.details[0].message || data.error || fallback;
  }
  return fallback;
}

export async function apiFetch(path, { method = "GET", body, headers = {}, credentials = "include", ...rest } = {}) {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials,
    ...rest,
  };

  if (body !== undefined) {
    opts.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, opts);
  } catch (err) {
    // network error
    const error = new Error("Network error. Please check your connection.");
    error.status = 0;
    error.original = err;
    throw error;
  }

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    const message = getErrorMessage(data, `Request failed (${res.status})`);
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    // Handle validation details passthrough for forms
    if (data.details) {
      error.details = data.details;
    }
    if (data.code) {
      error.code = data.code;
    }
    throw error;
  }

  return data;
}

// Convenience methods
export const api = {
  get: (path, opts) => apiFetch(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => apiFetch(path, { ...opts, method: "POST", body }),
  put: (path, body, opts) => apiFetch(path, { ...opts, method: "PUT", body }),
  delete: (path, opts) => apiFetch(path, { ...opts, method: "DELETE" }),
};
