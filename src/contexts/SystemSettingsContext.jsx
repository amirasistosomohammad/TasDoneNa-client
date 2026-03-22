import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api.js";

const SystemSettingsContext = createContext(null);

const normalizeLogoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  // Backend uses GET /api/settings/logo so images work without a public /storage symlink.
  const baseUrl = api.baseUrl.replace(/\/$/, "");
  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
};

export const SystemSettingsProvider = ({ children }) => {
  const [systemSettings, setSystemSettings] = useState({
    app_name: "",
    logo_url: null,
    tagline: "",
  });
  const [loading, setLoading] = useState(true);
  const [logoTimestamp, setLogoTimestamp] = useState(Date.now());

  const loadSettings = async (withLoading = false) => {
    if (withLoading) setLoading(true);
    try {
      const res = await api.get("/settings");
      setSystemSettings({
        app_name: res?.app_name || "",
        logo_url: res?.logo_url || null,
        tagline: res?.tagline || "",
      });
      // Bust <img> cache whenever settings reload (logo URL includes ?v= from server; t= adds another layer).
      setLogoTimestamp(Date.now());
    } catch (err) {
      console.error("Failed to load system settings:", err);
      setSystemSettings((prev) => ({
        app_name: prev.app_name || "",
        logo_url: prev.logo_url || null,
        tagline: prev.tagline || "",
      }));
    } finally {
      if (withLoading) setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    // Initial load
    loadSettings(true);

    const handleSettingsUpdated = () => {
      if (!cancelled) {
        loadSettings(false);
      }
    };

    window.addEventListener("tasdonena-settings-updated", handleSettingsUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("tasdonena-settings-updated", handleSettingsUpdated);
    };
  }, []);

  const value = {
    appName: systemSettings.app_name || "TasDoneNa",
    logoUrl: systemSettings.logo_url,
    tagline: systemSettings.tagline,
    loading,
    logoTimestamp,
    normalizeLogoUrl,
  };

  return <SystemSettingsContext.Provider value={value}>{children}</SystemSettingsContext.Provider>;
};

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error("useSystemSettings must be used within SystemSettingsProvider");
  }
  return context;
};

export default SystemSettingsContext;
