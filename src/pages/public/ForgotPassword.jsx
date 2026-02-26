import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope, FaSpinner, FaArrowLeft } from "react-icons/fa";
import { showAlert, showToast } from "../../services/notificationService.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import LoginBackground from "../../assets/login-bg.png";
import Logo from "../../assets/logo.png";
import TextLogo from "../../assets/logo-text.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  const navigate = useNavigate();
  const { forgotPassword } = useAuth();

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
      showAlert.error("Email required", "Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email.trim());
      showToast.success(
        "If an account exists with this email, a password reset link has been sent. Please check your inbox."
      );
      navigate("/login", { replace: true });
    } catch (error) {
      showAlert.error(
        "Error",
        error.data?.message || "An error occurred. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center position-relative">
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
      <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark opacity-50" />

      <div
        className="position-relative bg-white rounded-4 shadow-lg p-4 p-sm-5 w-100 mx-3 mx-sm-0"
        style={{
          maxWidth: "420px",
          border: `1px solid ${theme.borderColor}`,
          animation: "fadeIn 0.6s ease-in-out",
        }}
      >
        <div className="text-center mb-4">
          <img src={Logo} alt="TasDoneNa" style={{ height: "56px" }} />
          <img src={TextLogo} alt="TasDoneNa" className="ms-2" style={{ height: "32px" }} />
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
              className="form-control border-start-0 fw-semibold"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={{
                backgroundColor: "var(--input-bg)",
                color: "var(--input-text)",
                borderColor: theme.borderColor,
              }}
              required
            />
          </div>

          <button
            type="submit"
            className="btn w-100 py-2 fw-semibold rounded-3 mb-3"
            style={{
              backgroundColor: theme.primary,
              color: "#fff",
              border: "none",
              boxShadow: "0 4px 12px rgba(245, 66, 134, 0.3)",
            }}
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
              className="small fw-semibold d-inline-flex align-items-center text-decoration-none"
              style={{
                color: theme.textSecondary,
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.textSecondary;
              }}
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

export default ForgotPassword;
