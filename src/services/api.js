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

  /**
   * GET binary export (e.g. Excel). Triggers browser download; throws like request() on JSON errors.
   */
  download(endpoint, fallbackFilename = "download") {
    const token = getToken();
    const url = `${this.baseUrl.replace(/\/$/, "")}/api${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    return fetch(url, {
      method: "GET",
      headers: {
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream, application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).then(async (res) => {
      const ct = res.headers.get("Content-Type") || "";
      if (!res.ok) {
        const data = ct.includes("json") ? await res.json().catch(() => ({})) : {};
        const err = new Error(data.message || `Download failed (${res.status})`);
        err.status = res.status;
        err.data = data;
        throw err;
      }
      if (ct.includes("application/json")) {
        const data = await res.json().catch(() => ({}));
        const err = new Error(data.message || "Unexpected response");
        err.data = data;
        throw err;
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") || "";
      let filename = fallbackFilename;
      const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(cd);
      const plain = /filename="([^"]+)"/i.exec(cd);
      const plain2 = /filename=([^;\s]+)/i.exec(cd);
      const raw = star?.[1]?.trim() || plain?.[1]?.trim() || plain2?.[1]?.trim();
      if (raw) {
        try {
          filename = decodeURIComponent(raw.replace(/^"|"$/g, ""));
        } catch {
          filename = raw.replace(/^"|"$/g, "");
        }
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
    });
  },

  /**
   * POST JSON then receive binary (e.g. Excel). Same error handling as download().
   */
  downloadPost(endpoint, body, fallbackFilename = "download") {
    const token = getToken();
    const url = `${this.baseUrl.replace(/\/$/, "")}/api${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const fetchOpts = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream, application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body ?? {}),
    };
    if (typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
      fetchOpts.signal = AbortSignal.timeout(180000);
    }
    return fetch(url, fetchOpts).then(async (res) => {
      const ct = res.headers.get("Content-Type") || "";
      if (!res.ok) {
        const data = ct.includes("json") ? await res.json().catch(() => ({})) : {};
        const err = new Error(data.message || `Download failed (${res.status})`);
        err.status = res.status;
        err.data = data;
        throw err;
      }
      if (ct.includes("application/json")) {
        const data = await res.json().catch(() => ({}));
        const err = new Error(data.message || "Unexpected response");
        err.data = data;
        throw err;
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") || "";
      let filename = fallbackFilename;
      const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(cd);
      const plain = /filename="([^"]+)"/i.exec(cd);
      const plain2 = /filename=([^;\s]+)/i.exec(cd);
      const raw = star?.[1]?.trim() || plain?.[1]?.trim() || plain2?.[1]?.trim();
      if (raw) {
        try {
          filename = decodeURIComponent(raw.replace(/^"|"$/g, ""));
        } catch {
          filename = raw.replace(/^"|"$/g, "");
        }
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
    });
  },

  /**
   * Period accomplishment Excel: POST queues generation (202), poll status, then GET download.
   * Avoids gateway timeouts on slow Excel builds (e.g. DigitalOcean App Platform).
   */
  async generateAccomplishmentReportExport(body, fallbackFilename = "download") {
    const data = await this.post("/accomplishment-reports/export", body);
    const token = data?.export_token;
    if (!token || typeof token !== "string") {
      const err = new Error("Unexpected response from server.");
      err.data = data;
      throw err;
    }
    const interval = Math.min(Math.max(Number(data.poll_interval_ms) || 500, 250), 2000);
    const maxWaitMs = 180_000;
    const start = Date.now();
    while (true) {
      if (Date.now() - start > maxWaitMs) {
        const err = new Error(
          "Report generation is taking too long. Try again in a moment (or retry after the app wakes from idle)."
        );
        err.status = 408;
        throw err;
      }
      let st;
      try {
        st = await this.get(`/accomplishment-reports/export/${encodeURIComponent(token)}/status`);
      } catch (e) {
        if (e?.status === 410) {
          throw e;
        }
        await sleep(interval);
        continue;
      }
      if (st.status === "ready") {
        break;
      }
      if (st.status === "failed") {
        const err = new Error(st.message || "Could not build the report.");
        err.data = st;
        throw err;
      }
      if (st.status === "expired") {
        const err = new Error(
          st.message || "This export expired. Generate the report again."
        );
        err.status = 410;
        throw err;
      }
      await sleep(interval);
    }
    return this.download(
      `/accomplishment-reports/export/${encodeURIComponent(token)}/download`,
      fallbackFilename
    );
  },
};

export default api;
