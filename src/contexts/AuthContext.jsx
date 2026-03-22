import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../services/api.js";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("access_token") || null);
  const [loading, setLoading] = useState(true);

  const setAuth = useCallback((newToken, newUser) => {
    if (newToken) {
      localStorage.setItem("access_token", newToken);
      setToken(newToken);
    } else {
      localStorage.removeItem("access_token");
      setToken(null);
    }
    setUser(newUser || null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/logout");
    } catch {
      // ignore
    }
    setAuth(null);
  }, [setAuth]);

  const refreshUser = useCallback(async (prefetchedUser = null) => {
    if (!token) return null;
    // After avatar/logo upload, API already returns full user — merge to skip an extra GET /user
    // (avoids failures when uploads succeed but /user is slow or times out behind the gateway).
    if (prefetchedUser != null && typeof prefetchedUser === "object") {
      setUser((prev) => ({ ...(prev || {}), ...prefetchedUser }));
      return prefetchedUser;
    }
    try {
      const data = await api.get("/user");
      setUser(data.user);
      return data.user;
    } catch {
      return null;
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    api
      .get("/user")
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        setAuth(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, setAuth]);

  // Real-time status polling: Check user status periodically for approval/rejection updates
  useEffect(() => {
    // Only poll for non-admin users who are authenticated
    if (!token || !user || user?.role === "admin") {
      return;
    }

    // Slower interval + pause while tab is hidden — reduces parallel API load on small DO instances (504s).
    const POLL_INTERVAL = 15000;
    let pollInterval = null;
    let isMounted = true;

    const checkStatus = async () => {
      if (!isMounted || document.visibilityState !== "visible") return;

      try {
        const data = await api.get("/user");
        const newUser = data.user;
        const previousStatus = user?.status;
        const newStatus = newUser?.status;

        if (!isMounted) return;

        // Status changed to "approved" - update user state dynamically
        if (previousStatus === "pending" && newStatus === "approved") {
          setUser(newUser);
          // Dispatch event for components that listen to status changes
          window.dispatchEvent(new CustomEvent("user-status-approved", { detail: { user: newUser } }));
        }
        // Status changed to "rejected" - automatically logout
        else if (previousStatus !== "rejected" && newStatus === "rejected") {
          // Stop polling before logout
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          // Show notification before logout
          window.dispatchEvent(
            new CustomEvent("user-status-rejected", {
              detail: {
                reason: newUser?.rejection_reason || "Your account has been rejected by an administrator.",
              },
            })
          );
          // Logout user
          logout();
        }
        // Status changed to "deactivated" - automatically logout
        else if (previousStatus !== "deactivated" && newUser?.is_active === false && user?.is_active === true) {
          // Stop polling before logout
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          // Show notification before logout
          window.dispatchEvent(
            new CustomEvent("user-status-deactivated", {
              detail: {
                reason: newUser?.deactivation_reason || "Your account has been deactivated.",
              },
            })
          );
          // Logout user
          logout();
        }
        // Update user if status changed (for other status changes)
        else if (previousStatus !== newStatus) {
          setUser(newUser);
        }
      } catch (error) {
        // If unauthorized or token expired, stop polling
        if (error.status === 401 || error?.data?.status === 401) {
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          if (isMounted) {
            setAuth(null);
          }
        }
        // Silently handle other errors and continue polling
      }
    };

    const startPolling = () => {
      if (pollInterval) return;
      pollInterval = setInterval(checkStatus, POLL_INTERVAL);
    };

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkStatus();
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (document.visibilityState === "visible") {
      startPolling();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Cleanup: Stop polling when component unmounts or dependencies change
    return () => {
      isMounted = false;
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [token, user, setAuth, logout]);

  const register = async (formData) => {
    const data = await api.post("/register", {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      password_confirmation: formData.confirmPassword,
      employee_id: formData.employee_id,
      position: formData.position,
      division: formData.division,
      school_name: formData.school_name,
    });
    return { success: true, message: data.message, email: data.email };
  };

  const verifyEmail = (email, otp) => api.post("/verify-email", { email, otp });

  const resendOtp = (email) => api.post("/resend-otp", { email });

  const forgotPassword = (email) =>
    api.post("/forgot-password", { email });

  const resetPassword = ({ email, token, password, password_confirmation }) =>
    api.post("/reset-password", { email, token, password, password_confirmation });

  const login = async (email, password) => {
    try {
      const data = await api.post("/login", { email, password });
      setAuth(data.token, data.user);
      return { success: true, user: data.user };
    } catch (err) {
      // Prefer validation error (e.g. "Invalid credentials.") so we don't leak account status
      const validationError = err.data?.errors?.email?.[0];
      let message =
        validationError ||
        err.data?.message ||
        err.message ||
        "Invalid credentials.";
      if ((err.data?.status === "rejected" || err.data?.status === "deactivated") && err.data?.reason) {
        message = message + (message.endsWith(".") ? " " : ". ") + err.data.reason;
      }
      return { success: false, error: message, status: err.data?.status };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    register,
    verifyEmail,
    resendOtp,
    forgotPassword,
    resetPassword,
    setAuth,
    refreshUser,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
