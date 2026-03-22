import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope, FaSpinner, FaArrowLeft } from "react-icons/fa";
import { showAlert, showToast } from "../../services/notificationService.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useSystemSettings } from "../../contexts/SystemSettingsContext.jsx";
import LoginBackground from "../../assets/login-bg.png";
import Logo from "../../assets/logo.png";
import TextLogo from "../../assets/logo-text.png";
import AuthFooter from "../../components/public/AuthFooter.jsx";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const { appName, logoUrl, loading: settingsLoading, normalizeLogoUrl, logoTimestamp } = useSystemSettings();

  const theme = {
    primary: "#f54286",
    primaryDark: "#d5326f",
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

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      showToast.success(
        "If an account exists with this email, a password reset link has been sent. Please check your inbox."
      );
      navigate("/login", { replace: true });
    } catch (error) {
      setError(error.data?.message || "An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    if (error) {
      setError("");
    }
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
        <div
          className="position-relative bg-white rounded-4 shadow-lg p-4 p-sm-5 w-100 mx-3 mx-sm-0 auth-form-card"
          style={{
            maxWidth: "420px",
            border: `1px solid ${theme.borderColor}`,
            animation: "fadeIn 0.6s ease-in-out",
          }}
        >
        <div className="text-center mb-4">
          {settingsLoading ? (
            <div className="d-flex align-items-center justify-content-center gap-2">
              <div className="login-logo-skeleton" style={{ width: "56px", height: "56px", borderRadius: "8px" }} />
              <div className="login-text-logo-skeleton" style={{ width: "120px", height: "32px", borderRadius: "4px" }} />
            </div>
          ) : (
            <>
              {logoUrl ? (
                <img
                  key={logoUrl + logoTimestamp}
                  src={normalizeLogoUrl(logoUrl) + (logoUrl.includes('?') ? '&' : '?') + `t=${logoTimestamp}`}
                  alt={`${appName}`}
                  style={{ height: "56px", transition: "opacity 0.3s ease", animation: "fadeIn 0.4s ease-out" }}
                  onError={(e) => {
                    e.target.src = Logo;
                  }}
                />
              ) : (
                <img src={Logo} alt={appName} style={{ height: "56px" }} />
              )}
              <img src={TextLogo} alt={appName} className="ms-2" style={{ height: "32px" }} />
            </>
          )}
        </div>

        <h5 className="fw-bolder text-center mb-2" style={{ color: theme.textPrimary }}>
          Forgot password?
        </h5>
        <p
          className="text-center small mb-4"
          style={{ color: theme.textSecondary, lineHeight: 1.4 }}
        >
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="form-label fw-semibold mb-2 small" style={{ color: theme.textSecondary }}>
            Email
          </label>
          <div className="input-group mb-4">
            <span className="input-group-text bg-light border-end-0">
              <FaEnvelope style={{ color: theme.textSecondary }} size={16} />
            </span>
            <input
              type="email"
              className={`form-control border-start-0 fw-semibold${error ? " is-invalid" : ""}`}
              placeholder="you@example.com"
              value={email}
              onChange={handleInputChange}
              disabled={loading}
              style={{
                backgroundColor: "var(--input-bg)",
                color: "var(--input-text)",
                borderColor: error ? "#dc3545" : theme.borderColor,
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = theme.primary;
                e.target.style.boxShadow = "0 0 0 3px rgba(245, 66, 134, 0.25)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = error ? "#dc3545" : theme.borderColor;
                e.target.style.boxShadow = "none";
              }}
              required
            />
          </div>
          <div className={`invalid-feedback-wrapper${error ? " invalid-feedback-visible" : ""}`}>
            <div className="invalid-feedback d-block small mt-1 text-danger">
              {error || "\u00A0"}
            </div>
          </div>

          <button
            type="submit"
            className="btn-login w-100 py-2 fw-semibold shadow-sm d-flex align-items-center justify-content-center mb-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <FaSpinner className="me-2 spinner" />
                Sending...
              </>
            ) : (
              "Send reset link"
            )}
          </button>

          <div className="text-center">
            <Link
              to="/login"
              className="small fw-bold d-inline-flex align-items-center tas-auth-link"
            >
              <FaArrowLeft className="me-1" style={{ fontSize: "0.85rem" }} />
              Back to sign in
            </Link>
          </div>
        </form>
        </div>
      </div>

      {/* Footer */}
      <AuthFooter />
    </div>
  );
};

export default ForgotPassword;
