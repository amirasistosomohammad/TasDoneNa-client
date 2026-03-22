import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSpinner,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useSystemSettings } from "../../contexts/SystemSettingsContext.jsx";
import { showToast } from "../../services/notificationService.js";
import LoginBackground from "../../assets/login-bg.png";
import Logo from "../../assets/logo.png";
import TextLogo from "../../assets/logo-text.png";
import AuthFooter from "../../components/public/AuthFooter.jsx";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const { appName, logoUrl, loading: settingsLoading, normalizeLogoUrl, logoTimestamp } = useSystemSettings();

  // TasDoneNa theme colors (mirrors BRIMS structure)
  const theme = {
    primary: "#f54286",
    primaryDark: "#d5326f",
    primaryLight: "#ff6fa5",
    textPrimary: "#243047",
    textSecondary: "#6b7280",
    backgroundLight: "#f5f7fb",
    backgroundWhite: "#ffffff",
    borderColor: "#e5e7eb",
  };

  useEffect(() => {
    const img = new Image();
    img.src = LoginBackground;
    img.onload = () => setBackgroundLoaded(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      showToast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(form.email, form.password);

      if (result.success) {
        showToast.success(`Welcome back, ${result.user.name}!`);

        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        const status = result.status;
        const errText = (result.error || "").toLowerCase();
        const isRejected = status === "rejected" || errText.includes("rejected");
        const isDeactivated = status === "deactivated" || errText.includes("deactivated");

        if (isRejected) {
          // Import the rejection modal dynamically
          const { showAccountRejectionModal } = await import("../../components/AccountRejectionModal.jsx");
          // Extract rejection reason from error message
          // Format from AuthContext: "Your account has been rejected. [reason]"
          let rejectionReason = "";
          const errorMsg = result.error || "";
          // Try to extract reason after common rejection messages
          const rejectionPatterns = [
            /Your account has been rejected\.\s*(.+)/i,
            /Account rejected\.\s*(.+)/i,
            /rejected\.\s*(.+)/i,
          ];
          
          for (const pattern of rejectionPatterns) {
            const match = errorMsg.match(pattern);
            if (match && match[1]) {
              rejectionReason = match[1].trim();
              break;
            }
          }
          
          // If no pattern matched, check if the whole message is just the reason
          if (!rejectionReason && errorMsg && !errorMsg.toLowerCase().includes("account has been rejected")) {
            rejectionReason = errorMsg.trim();
          }
          
          await showAccountRejectionModal(rejectionReason);
        } else if (isDeactivated) {
          // Import the deactivated modal dynamically
          const { showAccountDeactivatedModal } = await import("../../components/AccountDeactivatedModal.jsx");
          // Extract deactivation reason from error message
          // Format from AuthContext: "Your account has been deactivated. [reason]"
          let deactivationReason = "";
          const errorMsg = result.error || "";
          // Try to extract reason after common deactivation messages
          const deactivationPatterns = [
            /Your account has been deactivated\.\s*(.+)/i,
            /Account deactivated\.\s*(.+)/i,
            /deactivated\.\s*(.+)/i,
          ];
          
          for (const pattern of deactivationPatterns) {
            const match = errorMsg.match(pattern);
            if (match && match[1]) {
              deactivationReason = match[1].trim();
              break;
            }
          }
          
          // If no pattern matched, check if the whole message is just the reason
          if (!deactivationReason && errorMsg && !errorMsg.toLowerCase().includes("account has been deactivated")) {
            deactivationReason = errorMsg.trim();
          }
          
          await showAccountDeactivatedModal(deactivationReason);
        } else {
          showToast.error(result.error || "Invalid credentials.");
        }
      }
    } catch (error) {
      showToast.error(
        "Unable to connect to the server. Please check your internet connection and try again.",
      );
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="auth-page-container d-flex flex-column position-relative">
      {/* Background Image with Blur Effect */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          backgroundImage: `url(${LoginBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: theme.backgroundLight,
          filter: backgroundLoaded ? "blur(0px)" : "blur(10px)",
          transition: "filter 0.5s ease-in-out",
        }}
      />

      {/* Main Content Area */}
      <div className="auth-page-content-wrapper flex-grow-1 d-flex align-items-center justify-content-center position-relative">
        {/* Form Content */}
        <div
          className="bg-white rounded-4 shadow-lg p-4 p-sm-5 w-100 mx-4 mx-sm-0 position-relative auth-form-card"
          style={{
            maxWidth: "420px",
            border: `1px solid ${theme.borderColor}`,
            animation: "fadeIn 0.6s ease-in-out",
          }}
        >
        {/* Logo Section */}
        <div className="text-center mb-3">
          <div className="login-logo-row d-flex flex-column flex-sm-row align-items-center justify-content-center mx-auto">
            {/* Left: Logo Image */}
            <div className="login-logo-img d-flex align-items-center justify-content-center mb-2 mb-sm-0 me-sm-1">
              {settingsLoading ? (
                <div
                  className="login-logo-skeleton"
                  style={{
                    width: "90px",
                    height: "90px",
                    borderRadius: "8px",
                  }}
                />
              ) : logoUrl ? (
                <img
                  key={logoUrl + logoTimestamp}
                  src={normalizeLogoUrl(logoUrl) + (logoUrl.includes('?') ? '&' : '?') + `t=${logoTimestamp}`}
                  alt={`${appName} Logo`}
                  style={{
                    width: "90px",
                    height: "90px",
                    objectFit: "contain",
                    transition: "opacity 0.3s ease",
                    animation: "fadeIn 0.4s ease-out",
                  }}
                  onError={(e) => {
                    e.target.src = Logo;
                  }}
                />
              ) : (
                <img
                  src={Logo}
                  alt={`${appName} Logo`}
                  style={{
                    width: "90px",
                    height: "90px",
                    objectFit: "contain",
                  }}
                />
              )}
            </div>

            {/* Right: Text Logo + Description */}
            <div className="login-logo-text d-flex flex-column justify-content-center align-items-center align-items-sm-start text-center text-sm-start">
              {settingsLoading ? (
                <div
                  className="login-text-logo-skeleton"
                  style={{
                    width: "200px",
                    height: "32px",
                    borderRadius: "4px",
                    marginBottom: "0.2rem",
                  }}
                />
              ) : (
                <img
                  src={TextLogo}
                  alt={`${appName} Text Logo`}
                  style={{
                    width: "100%",
                    height: "auto",
                    objectFit: "contain",
                    marginBottom: "0.2rem",
                  }}
                />
              )}
              <p
                className="fw-bolder login-logo-subtitle"
                style={{ color: theme.primary }}
              >
                A To Do List Management System for Public School Administrative
                Personnel
              </p>
            </div>
          </div>
        </div>

        {/* Title */}
        <h5
          className="text-center fw-bolder fs-4"
          style={{
            marginTop: "1.25rem",
            marginBottom: "1.25rem",
            color: theme.primary,
          }}
        >
          Log in to your account
        </h5>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <label
            htmlFor="email"
            className="mb-1 fw-semibold"
            style={{ fontSize: ".9rem", color: theme.textSecondary }}
          >
            Email
          </label>
          <div className="mb-3 position-relative">
            <FaEnvelope
              className="position-absolute top-50 translate-middle-y text-muted ms-3"
              size={16}
            />
            <input
              type="email"
              name="email"
              className="form-control ps-5 fw-semibold"
              placeholder="Email"
              value={form.email}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              style={{
                backgroundColor: "var(--input-bg)",
                color: "var(--input-text)",
                border: "1px solid var(--input-border)",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = theme.primary;
                e.target.style.boxShadow = "0 0 0 3px rgba(245, 66, 134, 0.25)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--input-border)";
                e.target.style.boxShadow = "none";
              }}
              id="email"
            />
          </div>

          {/* Password */}
          <label
            htmlFor="password"
            className="mb-1 fw-semibold"
            style={{ fontSize: ".9rem", color: theme.textSecondary }}
          >
            Password
          </label>
          <div className="mb-3 position-relative">
            <FaLock
              className="position-absolute top-50 translate-middle-y text-muted ms-3"
              size={16}
            />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              className="form-control ps-5 pe-5 fw-semibold"
              placeholder="Password"
              value={form.password}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              style={{
                backgroundColor: "var(--input-bg)",
                color: "var(--input-text)",
                border: "1px solid var(--input-border)",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = theme.primary;
                e.target.style.boxShadow = "0 0 0 3px rgba(245, 66, 134, 0.25)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--input-border)";
                e.target.style.boxShadow = "none";
              }}
              id="password"
            />
            <span
              onClick={() => !isSubmitting && setShowPassword(!showPassword)}
              className="position-absolute top-50 end-0 translate-middle-y me-3 text-muted"
              style={{ cursor: isSubmitting ? "not-allowed" : "pointer" }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Forgot password */}
          <div className="text-end mb-3">
            <Link
              to="/forgot-password"
              className="small fw-bold tas-auth-link"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-login w-100 py-2 fw-semibold shadow-sm d-flex align-items-center justify-content-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="spinner me-2" />
                Signing In...
              </>
            ) : (
              "Sign in"
            )}
          </button>

          {/* Register Link */}
          <p
            className="text-center mt-3 small fw-semibold"
            style={{ color: theme.primary }}
          >
            Don&apos;t have an account?{" "}
            <Link to="/register" className="fw-bold tas-auth-link">
              Register here
            </Link>
          </p>
        </form>
        </div>
      </div>

      {/* Footer */}
      <AuthFooter />
    </div>
  );
};

export default Login;
