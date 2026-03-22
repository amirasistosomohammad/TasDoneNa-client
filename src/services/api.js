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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** User-facing message for proxy / cold-start issues (DigitalOcean, etc.). */
function messageForStatus(status, data) {
  const fromApi = data?.message;
  if (status === 504 || status === 502) {
    return (
      fromApi ||
      "The server took too long to respond. Wait a few seconds and try again (the app may be waking up after idle)."
    );
  }
  if (status === 503) {
    return fromApi || "Service temporarily unavailable. Please try again shortly.";
  }
  return fromApi || "Request failed";
}

export const api = {
  baseUrl: getBaseUrl(),

  async request(endpoint, options = {}) {
    const { params: queryParams, retryOnGatewayError, ...fetchOptions } = options;
    let path = `${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    if (queryParams && Object.keys(queryParams).length > 0) {
      const qs = new URLSearchParams(queryParams).toString();
      path += (path.includes("?") ? "&" : "?") + qs;
    }
    const url = `${this.baseUrl.replace(/\/$/, "")}/api${path}`;
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...fetchOptions.headers,
    };
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const method = (fetchOptions.method || "GET").toUpperCase();
    const allowGatewayRetry =
      method === "GET" && retryOnGatewayError !== false;
    const maxAttempts = allowGatewayRetry ? 2 : 1;

    let res = null;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      res = await fetch(url, { ...fetchOptions, headers });
      if (
        allowGatewayRetry &&
        attempt < maxAttempts - 1 &&
        [502, 503, 504].includes(res.status)
      ) {
        await sleep(800 * (attempt + 1));
        continue;
      }
      break;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(messageForStatus(res.status, data));
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  },

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "GET" });
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: "POST", body: JSON.stringify(body) });
  },

  upload(endpoint, formData) {
    const url = `${this.baseUrl.replace(/\/$/, "")}/api${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const headers = { Accept: "application/json" };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const fetchOpts = { method: "POST", body: formData, headers };
    // Longer than default fetch; gateway/proxy may still timeout first (raise limits on DO if needed).
    if (typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
      fetchOpts.signal = AbortSignal.timeout(180000);
    }
    return fetch(url, fetchOpts)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          let message = data.message || "Upload failed";
          if (res.status === 504 || res.status === 502) {
            message =
              "Server timed out while uploading. Try a smaller image or retry in a moment.";
          }
          const err = new Error(message);
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data;
      })
      .catch((e) => {
        if (e?.name === "TimeoutError" || e?.name === "AbortError") {
          const err = new Error(
            "Upload timed out. Try again, use a smaller image, or check your connection."
          );
          err.status = 408;
          throw err;
        }
        throw e;
      });
  },

  put(endpoint, body) {
    return this.request(endpoint, { method: "PUT", body: JSON.stringify(body) });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  },
};

export default api;
