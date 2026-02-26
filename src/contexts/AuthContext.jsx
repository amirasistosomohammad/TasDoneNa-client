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
      const message =
        validationError ||
        err.data?.message ||
        (err.data?.reason ? `Rejected: ${err.data.reason}` : null) ||
        err.message ||
        "Invalid credentials.";
      return { success: false, error: message, status: err.data?.status };
    }
  };

  const logout = async () => {
    try {
      await api.post("/logout");
    } catch {
      // ignore
    }
    setAuth(null);
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
