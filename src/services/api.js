/**
 * TasDoneNa API client.
 * Base URL: VITE_API_URL or http://localhost:8000
 */

const getBaseUrl = () =>
  import.meta.env.VITE_API_URL ||
  (import.meta.env.VITE_LARAVEL_API
    ? import.meta.env.VITE_LARAVEL_API.replace(/\/api\/?$/, "")
    : "http://localhost:8000");

const getToken = () => localStorage.getItem("access_token");

export const api = {
  baseUrl: getBaseUrl(),

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/api${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    };
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || "Request failed");
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  },

  get(endpoint) {
    return this.request(endpoint, { method: "GET" });
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: "POST", body: JSON.stringify(body) });
  },

  put(endpoint, body) {
    return this.request(endpoint, { method: "PUT", body: JSON.stringify(body) });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  },
};

export default api;
