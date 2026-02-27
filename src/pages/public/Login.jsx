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
import { showToast } from "../../services/notificationService.js";
import LoginBackground from "../../assets/login-bg.png";
import Logo from "../../assets/logo.png";
import TextLogo from "../../assets/logo-text.png";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

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

        if (isRejected || isDeactivated) {
          await Swal.fire({
            title: isRejected ? "Account rejected" : "Account deactivated",
            html: `<p class="mb-0">${result.error || (isRejected ? "Your account has been rejected and you cannot sign in." : "Your account has been deactivated and you cannot sign in.")}</p>`,
            icon: "error",
            confirmButtonText: "OK",
            confirmButtonColor: "#f54286",
            allowOutsideClick: false,
            customClass: { popup: "login-status-popup", title: "login-status-title" },
          });
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

      {/* Form Content */}
      <div
        className="bg-white rounded-4 shadow-lg p-4 p-sm-5 w-100 mx-4 mx-sm-0 position-relative"
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
              <img
                src={Logo}
                alt="TasDoneNa Logo"
                style={{
                  width: "90px",
                  height: "90px",
                  objectFit: "contain",
                }}
              />
            </div>

            {/* Right: Text Logo + Description */}
            <div className="login-logo-text d-flex flex-column justify-content-center align-items-center align-items-sm-start text-center text-sm-start">
              <img
                src={TextLogo}
                alt="TasDoneNa Text Logo"
                style={{
                  width: "100%",
                  height: "auto",
                  objectFit: "contain",
                  marginBottom: "0.2rem",
                }}
              />
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
              className="small fw-semibold text-decoration-none"
              style={{
                color: theme.textSecondary,
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = theme.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = theme.textSecondary;
              }}
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
            style={{ color: theme.textSecondary }}
          >
            Don&apos;t have an account?{" "}
            <Link to="/register" className="fw-bold tas-auth-link">
              Register here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
