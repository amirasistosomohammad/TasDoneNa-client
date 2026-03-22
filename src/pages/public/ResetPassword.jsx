import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaArrowLeft,
} from "react-icons/fa";
import { showAlert, showToast } from "../../services/notificationService.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useSystemSettings } from "../../contexts/SystemSettingsContext.jsx";
import LoginBackground from "../../assets/login-bg.png";
import Logo from "../../assets/logo.png";
import TextLogo from "../../assets/logo-text.png";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLetter: false,
    hasNumber: false,
  });
  const [showPasswordCriteria, setShowPasswordCriteria] = useState(false);

  const navigate = useNavigate();
  const { resetPassword } = useAuth();
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

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    const emailParam = searchParams.get("email");
    if (tokenParam) setToken(tokenParam);
    if (emailParam) setEmail(emailParam);
    if (!tokenParam || !emailParam) {
      showAlert.error(
        "Invalid link",
        "This password reset link is invalid or has expired. Please request a new one."
      );
      navigate("/forgot-password", { replace: true });
    }
  }, [searchParams, navigate]);

  const validatePassword = (value) => {
    const validation = {
      minLength: value.length >= 8,
      hasLetter: /[A-Za-z]/.test(value),
      hasNumber: /[0-9]/.test(value),
    };
    setPasswordValidation(validation);
    return validation.minLength && validation.hasLetter && validation.hasNumber;
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    validatePassword(value);
    if (value.length > 0) setShowPasswordCriteria(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      showAlert.error("Fields required", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      showAlert.error("Passwords do not match", "Please make sure both passwords are the same.");
      return;
    }
    if (!validatePassword(password)) {
      showAlert.error(
        "Invalid password",
        "Password must be at least 8 characters and include a letter and a number."
      );
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ email: email.trim(), token, password, password_confirmation: confirmPassword });
      showToast.success("Your password has been reset. Please sign in with your new password.");
      navigate("/login", { replace: true });
    } catch (error) {
      const msg =
        error.data?.message ||
        (error.data?.errors?.token ? error.data.errors.token[0] : null) ||
        (error.data?.errors?.password ? error.data.errors.password[0] : null) ||
        "Invalid or expired reset link. Please request a new one.";
      showAlert.error("Reset failed", msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center position-relative">
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

      <div
        className="position-relative bg-white rounded-4 shadow-lg p-4 p-sm-5 w-100 mx-3 mx-sm-0"
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
                  alt={appName}
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
          Reset password
        </h5>
        <p
          className="text-center small mb-4"
          style={{ color: theme.textSecondary, lineHeight: 1.4 }}
        >
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="form-label fw-semibold mb-2 small" style={{ color: theme.textSecondary }}>
            Email
          </label>
          <input
            type="email"
            className="form-control mb-3 fw-semibold"
            value={email}
            readOnly
            style={{
              backgroundColor: "var(--input-bg)",
              color: "var(--input-text)",
              borderColor: theme.borderColor,
            }}
          />

          <label className="form-label fw-semibold mb-2 small" style={{ color: theme.textSecondary }}>
            New password
          </label>
          <div className="input-group mb-2 position-relative">
            <span className="input-group-text bg-light border-end-0">
              <FaLock style={{ color: theme.textSecondary }} size={16} />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              className="form-control border-start-0 fw-semibold"
              placeholder="New password"
              value={password}
              onChange={handlePasswordChange}
              onFocus={() => setShowPasswordCriteria(true)}
              disabled={loading}
              style={{
                backgroundColor: "var(--input-bg)",
                color: "var(--input-text)",
                borderColor: theme.borderColor,
              }}
              required
              minLength={8}
            />
            <span className="input-group-text bg-light border-start-0">
              <button
                type="button"
                className="btn btn-sm p-0 border-0 bg-transparent text-muted"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </span>
          </div>

          <div
            className={`password-criteria-wrapper${showPasswordCriteria ? " password-criteria-visible" : ""}`}
          >
            <div className="password-criteria-inner">
              <div className="password-criteria-content">
                <ul>
                  <li className={passwordValidation.minLength ? "text-success" : "text-muted"}>
                    • At least 8 characters
                  </li>
                  <li className={passwordValidation.hasLetter ? "text-success" : "text-muted"}>
                    • Contains a letter
                  </li>
                  <li className={passwordValidation.hasNumber ? "text-success" : "text-muted"}>
                    • Contains a number
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <label className="form-label fw-semibold mb-2 small mt-3" style={{ color: theme.textSecondary }}>
            Confirm password
          </label>
          <div className="input-group mb-2">
            <span className="input-group-text bg-light border-end-0">
              <FaLock style={{ color: theme.textSecondary }} size={16} />
            </span>
            <input
              type={showConfirmPassword ? "text" : "password"}
              className={`form-control border-start-0 fw-semibold${confirmPassword && password !== confirmPassword ? " is-invalid" : ""}`}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              style={{
                backgroundColor: "var(--input-bg)",
                color: "var(--input-text)",
                borderColor:
                  confirmPassword && password !== confirmPassword ? "#dc3545" : theme.borderColor,
              }}
              required
              minLength={8}
            />
            <span className="input-group-text bg-light border-start-0">
              <button
                type="button"
                className="btn btn-sm p-0 border-0 bg-transparent text-muted"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </span>
          </div>
          <div className={`invalid-feedback-wrapper mb-3${confirmPassword && password !== confirmPassword ? " invalid-feedback-visible" : ""}`}>
            <div className="invalid-feedback d-block small mt-1 text-danger">
              {confirmPassword && password !== confirmPassword ? "Passwords do not match" : "\u00A0"}
            </div>
          </div>

          <button
            type="submit"
            className="btn-login w-100 py-2 fw-semibold shadow-sm d-flex align-items-center justify-content-center mb-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <FaSpinner className="spinner me-2" />
                Resetting...
              </>
            ) : (
              "Reset password"
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
  );
};

export default ResetPassword;
