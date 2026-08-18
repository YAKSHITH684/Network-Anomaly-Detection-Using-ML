// api.js — thin fetch() wrapper around the backend JSON API.

const Api = (() => {
  async function request(path, options = {}) {
    const base = getApiBase();
    const headers = options.headers ? { ...options.headers } : {};
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let res;
    try {
      res = await fetch(base + path, { ...options, headers });
    } catch (err) {
      throw new Error(
        `Could not reach the backend at ${base}. Check the API URL in Settings and that the backend is running. (${err.message})`
      );
    }

    let body = null;
    const text = await res.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { error: text };
      }
    }

    if (!res.ok) {
      const message = (body && body.error) || `Request failed (HTTP ${res.status})`;
      const error = new Error(message);
      error.status = res.status;
      throw error;
    }

    return body;
  }

  return {
    health: () => request("/api/health"),

    login: (username, password) =>
      request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      }),

    logout: () => request("/api/auth/logout", { method: "POST" }),

    state: () => request("/api/state"),

    uploadDataset: (file) => {
      const fd = new FormData();
      fd.append("file", file);
      return request("/api/dataset/upload", { method: "POST", body: fd });
    },

    preprocess: () => request("/api/dataset/preprocess", { method: "POST" }),

    trainModel: (modelName) =>
      request(`/api/models/train/${encodeURIComponent(modelName)}`, { method: "POST" }),

    graphs: () => request("/api/models/graphs"),

    predict: (file) => {
      const fd = new FormData();
      fd.append("file", file);
      return request("/api/predict", { method: "POST", body: fd });
    },

    chat: (message, history) =>
      request("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      }),
  };
})();
