import React, { useState, useEffect, useCallback } from "react";
import { FaCog, FaLock, FaSpinner, FaImage, FaSave, FaEye, FaEyeSlash, FaDatabase, FaDownload, FaClock, FaCalendarCheck } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { api } from "../../services/api.js";
import { showToast } from "../../services/notificationService.js";
import "./Settings.css";

/**
 * Settings component for Central Administrative Officer
 * Adapted from TheMidTaskApp-client CentralAdminSettings
 * Updated to use current project's API structure and color scheme
 */
export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("password");

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLetter: false,
    hasNumber: false,
  });
  const [showPasswordCriteria, setShowPasswordCriteria] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [systemSettings, setSystemSettings] = useState({
    app_name: "",
    logo_url: null,
  });
  const [logoError, setLogoError] = useState(false);
  const [systemSettingsLoading, setSystemSettingsLoading] = useState(false);
  const [systemForm, setSystemForm] = useState({ app_name: "" });
  const [systemErrors, setSystemErrors] = useState({});
  const [systemSaving, setSystemSaving] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);

  const [backupLoading, setBackupLoading] = useState(false);
  const [backupSchedule, setBackupSchedule] = useState({
    frequency: "off",
    run_at_time: "02:00",
    timezone: "Asia/Manila",
    last_run_at: null,
    next_run_at: null,
    has_latest_file: false,
  });
  const [backupScheduleLoading, setBackupScheduleLoading] = useState(false);
  const [backupScheduleSaving, setBackupScheduleSaving] = useState(false);
  const [backupScheduleLoaded, setBackupScheduleLoaded] = useState(false);
  const [backupScheduleDirty, setBackupScheduleDirty] = useState(false);
  const [backupScheduleForm, setBackupScheduleForm] = useState({
    frequency: "off",
    run_at_time: "02:00",
    timezone: "Asia/Manila",
  });
  const [backupList, setBackupList] = useState([]);
  const [backupListLoading, setBackupListLoading] = useState(false);
  const [backupLatestLoading, setBackupLatestLoading] = useState(false);
  const [backupDownloadingFilename, setBackupDownloadingFilename] = useState(null);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));

    if (name === "new_password") {
      if (value.length > 0) {
        setShowPasswordCriteria(true);
      } else {
        setShowPasswordCriteria(false);
      }
      const validation = {
        minLength: value.length >= 8,
        hasLetter: /[A-Za-z]/.test(value),
        hasNumber: /[0-9]/.test(value),
      };
      setPasswordValidation(validation);
    }

    // Clear error when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validatePassword = (pwd) => {
    if (!pwd) return false;
    const validation = {
      minLength: pwd.length >= 8,
      hasLetter: /[A-Za-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
    };
    setPasswordValidation(validation);
    return validation.minLength && validation.hasLetter && validation.hasNumber;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!passwordForm.current_password) next.current_password = "Current password is required.";
    if (!passwordForm.new_password) next.new_password = "New password is required.";
    else if (!validatePassword(passwordForm.new_password)) {
      next.new_password = "Password must be at least 8 characters and include a letter and a number.";
    }
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      next.new_password_confirmation = "Passwords do not match.";
    }
    setPasswordErrors(next);
    if (Object.keys(next).length > 0) return;

    setPasswordLoading(true);
    try {
      await api.put("/user/password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        new_password_confirmation: passwordForm.new_password_confirmation,
      });
      setPasswordForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
      setPasswordErrors({});
      showToast.success("Password changed successfully.");
    } catch (err) {
      const msg =
        err?.data?.errors?.current_password?.[0] ||
        (err?.data?.errors ? Object.values(err.data.errors).flat().join(" ") : null) ||
        err?.message ||
        "Failed to change password.";
      showToast.error(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Load branding only when this tab is open — avoids duplicate /settings traffic with Layout + context
  // and refetches fresh data each time the admin returns to System Branding.
  useEffect(() => {
    if (activeTab !== "branding") return undefined;
    let cancelled = false;
    const loadBranding = async () => {
      setSystemSettingsLoading(true);
      setLogoError(false);
      try {
        const res = await api.get("/settings");
        if (cancelled) return;
        setSystemSettings({
          app_name: res?.app_name || "",
          logo_url: res?.logo_url || null,
        });
        setSystemForm({
          app_name: res?.app_name || "",
        });
      } catch (err) {
        if (!cancelled) {
          showToast.error(err?.message || "Failed to load system settings.");
        }
      } finally {
        if (!cancelled) setSystemSettingsLoading(false);
      }
    };
    loadBranding();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const handleSystemChange = (e) => {
    const { name, value } = e.target;
    setSystemForm((prev) => ({ ...prev, [name]: value }));
    if (systemErrors[name]) setSystemErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSystemSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!systemForm.app_name?.trim()) next.app_name = "Application name is required.";
    setSystemErrors(next);
    if (Object.keys(next).length > 0) return;

    setSystemSaving(true);
    try {
      const res = await api.put("/admin/settings", {
        app_name: systemForm.app_name.trim(),
      });
      setSystemSettings({
        app_name: res?.app_name || systemForm.app_name,
        logo_url: res?.logo_url || systemSettings.logo_url,
      });
      setSystemForm({
        app_name: res?.app_name || systemForm.app_name,
      });
      window.dispatchEvent(new CustomEvent("tasdonena-settings-updated"));
      showToast.success("System settings updated successfully.");
    } catch (err) {
      const msg =
        err?.data?.errors?.app_name?.[0] ||
        (err?.data?.errors ? Object.values(err.data.errors).flat().join(" ") : null) ||
        err?.message ||
        "Failed to update system settings.";
      showToast.error(msg);
    } finally {
      setSystemSaving(false);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast.error("Image must be 2MB or less.");
      return;
    }
    if (!/^image\/(jpeg|jpg|png|gif|webp|svg)$/i.test(file.type)) {
      showToast.error("Use JPEG, PNG, GIF, WebP, or SVG.");
      return;
    }
    setLogoLoading(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await api.upload("/admin/settings/logo", fd);
      setSystemSettings((prev) => ({
        ...prev,
        logo_url: res?.logo_url || prev.logo_url,
      }));
      setLogoError(false); // Reset error state on successful upload
      window.dispatchEvent(new CustomEvent("tasdonena-settings-updated"));
      showToast.success("Logo updated successfully.");
    } catch (err) {
      const msg =
        err?.data?.errors?.logo?.[0] || err?.message || "Failed to upload logo.";
      showToast.error(msg);
    } finally {
      setLogoLoading(false);
      e.target.value = "";
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPasswordErrors({});
    setSystemErrors({});
  };

  const fetchBackupSchedule = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setBackupScheduleLoading(true);
    try {
      const data = await api.get("/admin/backup/schedule");
      setBackupSchedule({
        frequency: data.frequency ?? "off",
        run_at_time: data.run_at_time ?? "02:00",
        timezone: "Asia/Manila",
        last_run_at: data.last_run_at ?? null,
        next_run_at: data.next_run_at ?? null,
        has_latest_file: !!data.has_latest_file,
      });
      // Don't overwrite the form while the user is editing.
      if (!backupScheduleDirty) {
        setBackupScheduleForm({
          frequency: data.frequency ?? "off",
          run_at_time: data.run_at_time ?? "02:00",
          timezone: "Asia/Manila",
        });
      }
      setBackupScheduleLoaded(true);
    } catch (err) {
      if (!silent) showToast.error(err?.message || "Failed to load backup schedule.");
    } finally {
      if (!silent) setBackupScheduleLoading(false);
    }
  }, [backupScheduleDirty]);

  const fetchBackupList = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setBackupListLoading(true);
    try {
      const data = await api.get("/admin/backup/list");
      setBackupList(Array.isArray(data?.backups) ? data.backups : []);
    } catch (err) {
      if (!silent) showToast.error(err?.message || "Failed to load backup list.");
      setBackupList([]);
    } finally {
      if (!silent) setBackupListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "backup" && user?.role === "admin") {
      fetchBackupSchedule();
      fetchBackupList();
    }
  }, [activeTab, user?.role, fetchBackupSchedule, fetchBackupList]);

  // Auto-refresh backup history while Backup tab is open (keeps table updated without flicker).
  useEffect(() => {
    if (!(activeTab === "backup" && user?.role === "admin")) return undefined;
    const id = setInterval(() => {
      fetchBackupList({ silent: true });
    }, 5000);
    return () => clearInterval(id);
  }, [activeTab, user?.role, fetchBackupList]);

  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const baseUrl = api.baseUrl;
      const url = `${baseUrl}/api/admin/backup`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/sql, */*",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Backup failed.");
      }
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^";\n]+)"?/);
      const filename = match ? match[1].trim() : `tasdonena-backup-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.sql`;
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
      showToast.success("SQL backup downloaded successfully.");
    } catch (err) {
      showToast.error(err?.message || "Failed to download backup.");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleBackupScheduleChange = (e) => {
    const { name, value } = e.target;
    setBackupScheduleDirty(true);
    setBackupScheduleForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBackupScheduleSubmit = async (e) => {
    e.preventDefault();
    setBackupScheduleSaving(true);
    try {
      const data = await api.put("/admin/backup/schedule", {
        frequency: backupScheduleForm.frequency,
        run_at_time: backupScheduleForm.run_at_time,
      });
      setBackupSchedule((prev) => ({
        ...prev,
        frequency: data.frequency ?? prev.frequency,
        run_at_time: data.run_at_time ?? prev.run_at_time,
        timezone: data.timezone ?? prev.timezone,
        next_run_at: data.next_run_at ?? prev.next_run_at,
      }));
      setBackupScheduleDirty(false);
      // Silent refresh so the table updates quickly without UI flicker.
      fetchBackupList({ silent: true });
      showToast.success("Backup schedule updated.");
    } catch (err) {
      showToast.error(err?.message || "Failed to update schedule.");
    } finally {
      setBackupScheduleSaving(false);
    }
  };

  const handleDownloadLatestBackup = async () => {
    setBackupLatestLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const baseUrl = api.baseUrl;
      const url = `${baseUrl}/api/admin/backup/download/latest`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/sql, */*",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "No backup file available.");
      }
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^";\n]+)"?/);
      const filename = match ? match[1].trim() : "tasdonena-backup-latest.sql";
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
      showToast.success("Latest scheduled backup downloaded.");
    } catch (err) {
      showToast.error(err?.message || "Failed to download latest backup.");
    } finally {
      setBackupLatestLoading(false);
    }
  };

  const handleDownloadBackupFile = async (filename) => {
    setBackupDownloadingFilename(filename);
    try {
      const token = localStorage.getItem("access_token");
      const baseUrl = api.baseUrl;
      const url = `${baseUrl}/api/admin/backup/download/file/${encodeURIComponent(filename)}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/sql, */*",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Download failed.");
      }
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^";\n]+)"?/);
      const downloadName = match ? match[1].trim() : filename;
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
      showToast.success("Backup downloaded.");
    } catch (err) {
      showToast.error(err?.message || "Failed to download backup.");
    } finally {
      setBackupDownloadingFilename(null);
    }
  };

  const formatScheduleDate = (iso) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return iso;
    }
  };

  const normalizeLogoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    // API returns /api/settings/logo (streamed by Laravel); prepend API origin (VITE_API_URL root).
    const baseUrl = api.baseUrl.replace(/\/$/, "");
    return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
  };

  if (!user) return null;

  const roleLabel = user?.role === "admin" ? "Administrator" : user?.role || "User";

  return (
    <div className="container-fluid px-3 px-md-4">
      <div className="system-settings-container page-enter">
        {/* Page header — centered, gear + title + subtitle */}
        <div className="system-settings-header mt-4 mb-3">
        <div className="system-settings-header-icon-wrap">
          <FaCog className="system-settings-header-gear" />
        </div>
        <h1 className="system-settings-header-title">Settings</h1>
        <p className="system-settings-header-subtitle">
          {user?.name || "User"} • {roleLabel}
        </p>
        <p className="system-settings-header-desc">
          Manage account security, system configuration, and data backup.
        </p>
      </div>

      {/* Two-column layout: left = menu, right = content */}
      <div className="system-settings-row mb-4">
        {/* Left card — Settings menu */}
        <div className="system-settings-card system-settings-card-left">
          <h2 className="system-settings-menu-title">Settings Menu</h2>
          <nav className="system-settings-nav">
            <button
              className={`system-settings-nav-btn ${activeTab === "password" ? "active" : ""}`}
              onClick={() => handleTabChange("password")}
            >
              <FaLock className="system-settings-nav-icon" />
              <div className="system-settings-nav-text">
                <span className="system-settings-nav-label">Change Password</span>
                <span className="system-settings-nav-desc">Modify account credentials</span>
              </div>
            </button>

            <button
              className={`system-settings-nav-btn ${activeTab === "branding" ? "active" : ""}`}
              onClick={() => handleTabChange("branding")}
            >
              <FaImage className="system-settings-nav-icon" />
              <div className="system-settings-nav-text">
                <span className="system-settings-nav-label">System Branding</span>
                <span className="system-settings-nav-desc">Configure application branding</span>
              </div>
            </button>

            {user?.role === "admin" && (
              <button
                className={`system-settings-nav-btn ${activeTab === "backup" ? "active" : ""}`}
                onClick={() => handleTabChange("backup")}
              >
                <FaDatabase className="system-settings-nav-icon" />
                <div className="system-settings-nav-text">
                  <span className="system-settings-nav-label">Data Backup</span>
                  <span className="system-settings-nav-desc">Export system data for security</span>
                </div>
              </button>
            )}
          </nav>
        </div>

        {/* Right card — tab content */}
        <div className="system-settings-card system-settings-card-right">
          <div className="system-settings-content-body">
            {activeTab === "password" && (
              <div className="system-settings-tab-panel tab-transition-enter">
                <h2 className="system-settings-card-title">
                  <FaLock className="system-settings-card-title-icon" />
                  Change Administrator Password
                </h2>
                <div className="system-settings-admin-note">
                  Administrator note: You can change your password here. Keep it secure.
                </div>

                <form className="system-settings-form" onSubmit={handlePasswordSubmit}>
                  <div className="system-settings-form-group">
                    <label className="system-settings-label">
                      Current Password <span className="system-settings-required">*</span>
                    </label>
                    <div className="system-settings-input-wrap">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        name="current_password"
                        className={`system-settings-input ${passwordErrors.current_password ? "error" : ""}`}
                        value={passwordForm.current_password}
                        onChange={handlePasswordChange}
                        disabled={passwordLoading}
                      />
                      <button
                        type="button"
                        className="system-settings-input-toggle"
                        onClick={() =>
                          !passwordLoading && setShowCurrentPassword(!showCurrentPassword)
                        }
                        disabled={passwordLoading}
                        aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                      >
                        {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {passwordErrors.current_password && (
                      <div className="system-settings-error">{passwordErrors.current_password}</div>
                    )}
                  </div>

                  <div className="system-settings-form-group">
                    <label className="system-settings-label">
                      New Password <span className="system-settings-required">*</span>
                    </label>
                    <div className="system-settings-input-wrap">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="new_password"
                        className={`system-settings-input ${passwordErrors.new_password ? "error" : ""}`}
                        value={passwordForm.new_password}
                        onChange={handlePasswordChange}
                        disabled={passwordLoading}
                      />
                      <button
                        type="button"
                        className="system-settings-input-toggle"
                        onClick={() =>
                          !passwordLoading && setShowNewPassword(!showNewPassword)
                        }
                        disabled={passwordLoading}
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {showPasswordCriteria && passwordForm.new_password && (
                      <ul className="system-settings-password-hints">
                        <li className={passwordValidation.minLength ? "valid" : ""}>
                          At least 8 characters
                        </li>
                        <li className={passwordValidation.hasLetter ? "valid" : ""}>
                          Contains a letter
                        </li>
                        <li className={passwordValidation.hasNumber ? "valid" : ""}>
                          Contains a number
                        </li>
                      </ul>
                    )}
                    {passwordErrors.new_password && (
                      <div className="system-settings-error">{passwordErrors.new_password}</div>
                    )}
                  </div>

                  <div className="system-settings-form-group">
                    <label className="system-settings-label">
                      Confirm New Password <span className="system-settings-required">*</span>
                    </label>
                    <div className="system-settings-input-wrap">
                      <input
                        type="password"
                        name="new_password_confirmation"
                        className={`system-settings-input ${passwordErrors.new_password_confirmation ? "error" : ""}`}
                        value={passwordForm.new_password_confirmation}
                        onChange={handlePasswordChange}
                        disabled={passwordLoading}
                      />
                    </div>
                    {passwordErrors.new_password_confirmation && (
                      <div className="system-settings-error">
                        {passwordErrors.new_password_confirmation}
                      </div>
                    )}
                  </div>

                  <div className="system-settings-form-footer">
                    <button
                      type="submit"
                      className="system-settings-btn-primary"
                      disabled={passwordLoading}
                    >
                      {passwordLoading ? (
                        <>
                          <FaSpinner className="spinner" />
                          Changing Password…
                        </>
                      ) : (
                        <>
                          <FaSave />
                          Change Administrator Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "branding" && (
              <div className="system-settings-tab-panel tab-transition-enter">
                <h2 className="system-settings-card-title">
                  <FaImage className="system-settings-card-title-icon" />
                  System Branding
                </h2>
                {systemSettingsLoading ? (
                  <div className="system-settings-loading">
                    <FaSpinner className="spinner" />
                    Loading branding…
                  </div>
                ) : (
                  <>
                    <div className="system-settings-branding-preview-wrap">
                      <label className="system-settings-label">Logo</label>
                      <div className="system-settings-logo-row">
                        <div className="system-settings-logo-preview">
                          {systemSettings.logo_url && !logoError ? (
                            <img
                              key={systemSettings.logo_url}
                              src={normalizeLogoUrl(systemSettings.logo_url)}
                              alt="System logo"
                              onLoad={() => {
                                setLogoError(false);
                              }}
                              onError={() => {
                                setLogoError(true);
                              }}
                            />
                          ) : (
                            <div className="system-settings-logo-placeholder">
                              <FaImage />
                            </div>
                          )}
                        </div>
                        <div>
                          <input
                            type="file"
                            id="logo-upload"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                            className="system-settings-logo-input"
                            onChange={handleLogoChange}
                            disabled={logoLoading}
                          />
                          <label htmlFor="logo-upload" className="system-settings-logo-btn">
                            {logoLoading ? (
                              <>
                                <FaSpinner className="spinner" />
                                Uploading…
                              </>
                            ) : systemSettings.logo_url ? (
                              "Change logo"
                            ) : (
                              "Upload logo"
                            )}
                          </label>
                          <span className="system-settings-logo-hint">
                            PNG, JPG, WEBP, SVG up to 2MB.
                          </span>
                        </div>
                      </div>
                    </div>

                    <form className="system-settings-form" onSubmit={handleSystemSubmit}>
                      <div className="system-settings-form-group">
                        <label className="system-settings-label">
                          Application name <span className="system-settings-required">*</span>
                        </label>
                        <input
                          type="text"
                          name="app_name"
                          className={`system-settings-input ${systemErrors.app_name ? "error" : ""}`}
                          value={systemForm.app_name}
                          onChange={handleSystemChange}
                          disabled={systemSaving}
                        />
                        {systemErrors.app_name && (
                          <div className="system-settings-error">{systemErrors.app_name}</div>
                        )}
                      </div>

                      <div className="system-settings-form-footer">
                        <button
                          type="submit"
                          className="system-settings-btn-primary"
                          disabled={systemSaving}
                        >
                          {systemSaving ? (
                            <>
                              <FaSpinner className="spinner" />
                              Saving…
                            </>
                          ) : (
                            <>
                              <FaSave />
                              Save Branding
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            )}

            {activeTab === "backup" && user?.role === "admin" && (
              <div className="system-settings-tab-panel tab-transition-enter">
                <h2 className="system-settings-card-title">
                  <FaDatabase className="system-settings-card-title-icon" />
                  Data Backup
                </h2>
                <p className="system-settings-card-desc system-settings-backup-desc">
                  Security &amp; compliance: Create full database (SQL) backups for disaster recovery and audit. Manual backup downloads a fresh SQL dump; automated backup runs on a schedule and stores a copy on the server. Store backups securely per your organization&apos;s retention policy.
                </p>

                <div className="system-settings-backup-section">
                  <h3 className="system-settings-backup-section-title">
                    <FaDownload className="system-settings-backup-section-icon" />
                    Manual backup
                  </h3>
                  <p className="system-settings-card-desc">
                    Download a complete SQL dump of the database now. Use for one-off backups or before major changes.
                  </p>
                  <div className="system-settings-backup-schedule-footer">
                    <button
                      type="button"
                      className="system-settings-btn-secondary"
                      onClick={handleDownloadBackup}
                      disabled={backupLoading}
                    >
                      {backupLoading ? (
                        <>
                          <FaSpinner className="spinner" />
                          Generating SQL backup…
                        </>
                      ) : (
                        <>
                          <FaDownload />
                          Download SQL backup now
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="system-settings-backup-section">
                  <h3 className="system-settings-backup-section-title">
                    <FaClock className="system-settings-backup-section-icon" />
                    Automated backup schedule
                  </h3>
                  <p className="system-settings-card-desc">
                    Schedule automatic SQL backups. The system runs backups at the configured time and keeps the latest file available for download.
                  </p>
                  {backupScheduleLoading ? (
                    <div className="system-settings-loading">
                      <FaSpinner className="spinner" />
                      Loading schedule…
                    </div>
                  ) : (
                    <form
                      className="system-settings-backup-schedule-form"
                      onSubmit={handleBackupScheduleSubmit}
                    >
                      <div className="system-settings-backup-schedule-row">
                        <div className="system-settings-backup-form-group">
                          <label className="system-settings-label">Frequency</label>
                          <select
                            name="frequency"
                            className="system-settings-input system-settings-select"
                            value={backupScheduleForm.frequency}
                            onChange={handleBackupScheduleChange}
                            disabled={backupScheduleSaving}
                          >
                            <option value="off">Off</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                          </select>
                        </div>
                        <div className="system-settings-backup-form-group">
                          <label className="system-settings-label">Run at (PH time)</label>
                          <input
                            type="time"
                            name="run_at_time"
                            className="system-settings-input"
                            value={backupScheduleForm.run_at_time}
                            onChange={handleBackupScheduleChange}
                            disabled={backupScheduleSaving}
                          />
                        </div>
                      </div>

                      <div className="system-settings-backup-status-row">
                        <div className="system-settings-backup-status-item">
                          <FaCalendarCheck className="system-settings-backup-status-icon" />
                          <span className="system-settings-backup-status-label">Last backup:</span>
                          <span className="system-settings-backup-status-value">
                            {formatScheduleDate(backupSchedule.last_run_at)}
                          </span>
                        </div>
                        <div className="system-settings-backup-status-item">
                          <FaClock className="system-settings-backup-status-icon" />
                          <span className="system-settings-backup-status-label">Next backup:</span>
                          <span className="system-settings-backup-status-value">
                            {backupSchedule.frequency === "off" ? "—" : formatScheduleDate(backupSchedule.next_run_at)}
                          </span>
                        </div>
                      </div>

                      <div className="system-settings-backup-schedule-footer">
                        <button
                          type="submit"
                          className="system-settings-btn-primary"
                          disabled={backupScheduleSaving}
                        >
                          {backupScheduleSaving ? (
                            <>
                              <FaSpinner className="spinner" />
                              Saving…
                            </>
                          ) : (
                            <>
                              <FaSave />
                              Save schedule
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                <div className="system-settings-backup-table-wrap">
                  <h3 className="system-settings-backup-table-title">
                    Automated backup history
                  </h3>
                  <p className="system-settings-card-desc system-settings-backup-table-desc">
                    SQL files created by the scheduled backup. Download any file for your records.
                  </p>
                  {backupListLoading ? (
                    <div className="system-settings-backup-table-loading">
                      <FaSpinner className="spinner" />
                      Loading backup history…
                    </div>
                  ) : backupList.length === 0 ? (
                    <div className="system-settings-backup-table-empty">
                      No automated backups yet. Enable a schedule above and wait for the first run, or use &quot;Download SQL backup now&quot; for a manual backup.
                    </div>
                  ) : (
                    <div className="system-settings-backup-table-scroll">
                      <table className="system-settings-backup-table">
                        <thead>
                          <tr>
                            <th>Backup date</th>
                            <th>Download</th>
                          </tr>
                        </thead>
                        <tbody>
                          {backupList.map((item) => (
                            <tr key={item.filename}>
                              <td className="system-settings-backup-table-date">
                                {formatScheduleDate(item.created_at)}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="system-settings-backup-table-download-btn"
                                  onClick={() => handleDownloadBackupFile(item.filename)}
                                  disabled={backupDownloadingFilename === item.filename}
                                  aria-label={`Download backup from ${formatScheduleDate(item.created_at)}`}
                                >
                                  {backupDownloadingFilename === item.filename ? (
                                    <>
                                      <FaSpinner className="spinner" />
                                      Downloading…
                                    </>
                                  ) : (
                                    <>
                                      <FaDownload />
                                      Download
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
