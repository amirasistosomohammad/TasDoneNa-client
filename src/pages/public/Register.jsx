import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUser,
  FaBuilding,
  FaIdCard,
  FaMapMarkerAlt,
  FaSpinner,
  FaCheck,
  FaExclamationTriangle,
  FaArrowLeft,
} from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { showAlert, showToast } from "../../services/notificationService.js";
import LoginBackground from "../../assets/login-bg.png";
import Logo from "../../assets/logo.png";
import TextLogo from "../../assets/logo-text.png";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLetter: false,
    hasNumber: false,
  });
  const [showPasswordCriteria, setShowPasswordCriteria] = useState(false);
  const [step, setStep] = useState("form"); // 'form' | 'otp'
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef([]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    employee_id: "",
    position: "",
    division: "",
    school_name: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { register: registerUser, verifyEmail, resendOtp, login } = useAuth();

  // TasDoneNa theme colors
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (step === "otp") {
      // Smoothly scroll to top so OTP panel is fully visible
      window.scrollTo({ top: 0, behavior: "smooth" });

      // After the slide animation finishes, focus the first OTP input
      if (otpInputRefs.current[0]) {
        const t = setTimeout(() => otpInputRefs.current[0]?.focus(), 350);
        return () => clearTimeout(t);
      }
    }
  }, [step]);

  const handleOtpDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value.slice(-1);
    setOtpDigits(next);
    setOtpError("");
    if (value && index < 5) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pasted)) {
      const arr = pasted.split("").concat(Array(6 - pasted.length).fill(""));
      setOtpDigits(arr.slice(0, 6));
      setOtpError("");
      const last = Math.min(pasted.length - 1, 5);
      otpInputRefs.current[last]?.focus();
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    const otpString = otpDigits.join("");
    if (otpString.length !== 6) {
      setOtpError("Please enter the complete 6-digit code.");
      return;
    }
    setVerifyLoading(true);
    setOtpError("");
    try {
      await verifyEmail(form.email.trim(), otpString);
      const loginResult = await login(form.email.trim(), form.password);
      if (loginResult.success) {
        showToast.success("Email verified. Welcome!");
        navigate("/dashboard", { replace: true });
      } else {
        showToast.success("Email verified. Please sign in.");
        navigate("/login", { replace: true });
      }
    } catch (err) {
      const msg =
        err.data?.message ||
        (err.data?.errors?.otp ? err.data.errors.otp[0] : null) ||
        err.message ||
        "Verification failed.";
      setOtpError(msg);
      setOtpDigits(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setResendLoading(true);
    setOtpError("");
    try {
      await resendOtp(form.email.trim());
      setResendCooldown(60);
      showToast.success("A new code has been sent to your email.");
    } catch (err) {
      const msg =
        err.data?.message ||
        err.message ||
        "Failed to resend code. Please try again.";
      setOtpError(msg);
    } finally {
      setResendLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Show password criteria when user types in password field
    if (name === "password" && value.length > 0) {
      setShowPasswordCriteria(true);
    }

    // Clear error for this field when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Basic email format check in real-time (temporary – allows any domain)
    if (name === "email" && value) {
      validateEmailFormat(value);
    }

    if (name === "password") {
      validatePassword(value);
    }
  };

  const validateEmailFormat = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      setFieldErrors((prev) => ({
        ...prev,
        email: "Please enter a valid email address",
      }));
      return false;
    } else {
      setFieldErrors((prev) => ({ ...prev, email: "" }));
      return true;
    }
  };

  const validatePassword = (value) => {
    const validation = {
      minLength: value.length >= 8,
      hasLetter: /[A-Za-z]/.test(value),
      hasNumber: /[0-9]/.test(value),
    };
    setPasswordValidation(validation);
    return validation;
  };

  const validateForm = () => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = "Please enter your full name";
    }

    if (!form.email.trim()) {
      errors.email = "Please enter your email address";
    } else if (!validateEmailFormat(form.email)) {
      // Error already set in validateEmailFormat
      errors.email =
        fieldErrors.email || "Please enter a valid email address";
    }

    if (!form.employee_id.trim()) {
      errors.employee_id = "Please enter your employee ID";
    }

    if (!form.position.trim()) {
      errors.position = "Please enter your position";
    }

    if (!form.division.trim()) {
      errors.division = "Please enter your division";
    }

    if (!form.school_name.trim()) {
      errors.school_name = "Please enter your school name";
    }

    if (!form.password) {
      errors.password = "Please enter a password";
    } else {
      const validation = validatePassword(form.password);
      const allOk =
        validation.minLength && validation.hasLetter && validation.hasNumber;
      if (!allOk) {
        errors.password =
          "Password must be at least 8 characters and include a letter and a number.";
      }
    }

    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords don't match";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0];
      showAlert.error("Validation Error", firstError);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      showAlert.loading("Creating your account...");

      const result = await registerUser(form);
      showAlert.close();

      if (result.success) {
        showToast.success(
          result.message || "Check your email for the 6-digit code.",
        );
        setStep("otp");
        setOtpError("");
        setOtpDigits(["", "", "", "", "", ""]);
      } else {
        showAlert.error("Registration Failed", result.error || "Please try again.");
      }
    } catch (error) {
      showAlert.close();
      const errData = error.data || {};
      const message =
        errData.message ||
        (errData.errors ? Object.values(errData.errors).flat().join(" ") : null) ||
        error.message ||
        "There was an error creating your account. Please try again.";
      showAlert.error("Registration Failed", message);
      if (errData.errors && typeof errData.errors === "object") {
        const flat = {};
        for (const [k, v] of Object.entries(errData.errors)) {
          flat[k] = Array.isArray(v) ? v[0] : v;
        }
        setFieldErrors(flat);
      }
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldStatus = (fieldName) => {
    if (checkingEmail && fieldName === "email") {
      return "checking";
    }
    if (fieldErrors[fieldName]) {
      return "error";
    }
    if (form[fieldName] && !fieldErrors[fieldName]) {
      return "success";
    }
    return "default";
  };

  const renderFieldIcon = (fieldName) => {
    const status = getFieldStatus(fieldName);

    switch (status) {
      case "checking":
        return <FaSpinner className="spinner" size={14} />;
      case "error":
        return <FaExclamationTriangle className="text-danger" size={14} />;
      case "success":
        return <FaCheck className="text-success" size={14} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column flex-lg-row position-relative">
      {/* Left side – background with subtle TasDoneNa pink overlay */}
      <div className="col-lg-6 d-none d-lg-block position-fixed start-0 top-0 h-100 p-0">
        <div
          className="w-100 h-100"
          style={{
            backgroundImage: `linear-gradient(rgba(245, 66, 134, 0.30), rgba(213, 50, 111, 0.30)), url(${LoginBackground})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundColor: theme.backgroundLight,
            filter: backgroundLoaded ? "blur(0px)" : "blur(10px)",
            transition: "filter 0.5s ease-in-out",
          }}
        />
      </div>

      {/* Right Panel - Scrollable */}
      <div className="col-12 col-lg-6 ms-lg-auto position-relative">
        {/* Background */}
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            backgroundColor: theme.backgroundLight,
            background: `linear-gradient(135deg, ${theme.backgroundLight} 0%, #e9ecef 50%, #dee2e6 100%)`,
          }}
        />

        {/* Subtle grid pattern overlay */}
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            backgroundImage: `
              linear-gradient(rgba(245, 66, 134, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(245, 66, 134, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
            pointerEvents: "none",
          }}
        />

        <div className="min-vh-100 d-flex align-items-center justify-content-center p-3 p-lg-4">
          <div
            className={`bg-white rounded-4 shadow-lg p-4 p-sm-5 w-100 form-container ${
              isMounted ? "fade-in" : ""
            }`}
            style={{
              maxWidth: "520px",
              border: `1px solid ${theme.borderColor}`,
              position: "relative",
              zIndex: 2,
            }}
          >
            {/* Single centered logo above the form (all screen sizes) */}
            <div className="text-center mb-4">
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

            <div className="register-step-wrapper">
              <div
                className={`register-step-slider${step === "otp" ? " step-otp" : ""}`}
              >
                {/* Panel 1: Register form */}
                <div className="register-step-panel">
                  <div className="text-center mb-4">
                    <h1
                      className="fw-bolder mb-2"
                      style={{ color: theme.primary, fontSize: "1.5rem" }}
                    >
                      Create Your Account
                    </h1>
                    <p
                      className="fw-semibold mb-0"
                      style={{
                        lineHeight: "1.4",
                        fontSize: "0.9rem",
                        color: theme.textSecondary,
                      }}
                    >
                      Register using your official DepEd institutional email to securely
                      access the TasDoneNa task management system.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="mb-3 position-relative">
                <label
                  htmlFor="name"
                  className="form-label fw-semibold mb-2"
                  style={{
                    fontSize: "0.9rem",
                    color: theme.textSecondary,
                  }}
                >
                  Full Name *
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0">
                    <FaUser className="text-muted" size={16} />
                  </span>
                  <input
                    type="text"
                    name="name"
                    placeholder="Full name"
                    value={form.name}
                    onChange={handleInputChange}
                    className={`form-control border-start-0 ps-2 fw-semibold ${
                      fieldErrors.name ? "is-invalid" : ""
                    } ${
                      getFieldStatus("name") === "success" ? "is-valid" : ""
                    }`}
                    style={{
                      backgroundColor: "var(--input-bg)",
                      color: "var(--input-text)",
                      borderColor: fieldErrors.name
                        ? "#dc3545"
                        : "var(--input-border)",
                    }}
                    required
                    disabled={isSubmitting}
                    id="name"
                  />
                  <span className="input-group-text bg-transparent border-start-0">
                    {renderFieldIcon("name")}
                  </span>
                </div>
                {fieldErrors.name && (
                  <div className="invalid-feedback d-block small mt-1">
                    {fieldErrors.name}
                  </div>
                )}
              </div>

              {/* Institutional Email */}
              <div className="mb-3 position-relative">
                <label
                  htmlFor="email"
                  className="form-label fw-semibold mb-2"
                  style={{
                    fontSize: "0.9rem",
                    color: theme.textSecondary,
                  }}
                >
                  Institutional Email *
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0">
                    <FaEnvelope className="text-muted" size={16} />
                  </span>
                  <input
                    type="email"
                    name="email"
                    placeholder="Institutional email address"
                    value={form.email}
                    onChange={handleInputChange}
                    className={`form-control border-start-0 ps-2 fw-semibold ${
                      fieldErrors.email ? "is-invalid" : ""
                    } ${
                      getFieldStatus("email") === "success" ? "is-valid" : ""
                    }`}
                    style={{
                      backgroundColor: "var(--input-bg)",
                      color: "var(--input-text)",
                      borderColor: fieldErrors.email
                        ? "#dc3545"
                        : "var(--input-border)",
                    }}
                    required
                    disabled={isSubmitting}
                    id="email"
                  />
                  <span className="input-group-text bg-transparent border-start-0">
                    {renderFieldIcon("email")}
                  </span>
                </div>
                {fieldErrors.email && (
                  <div className="invalid-feedback d-block small mt-1">
                    {fieldErrors.email}
                  </div>
                )}
                <div className="form-text small mt-1">
                  Use your official institutional email address.
                </div>
              </div>

              {/* Employee ID */}
              <div className="mb-3 position-relative">
                <label
                  htmlFor="employee_id"
                  className="form-label fw-semibold mb-2"
                  style={{
                    fontSize: "0.9rem",
                    color: theme.textSecondary,
                  }}
                >
                  Employee ID *
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0">
                    <FaIdCard className="text-muted" size={16} />
                  </span>
                  <input
                    type="text"
                    name="employee_id"
                    placeholder="Employee ID"
                    value={form.employee_id}
                    onChange={handleInputChange}
                    className={`form-control border-start-0 ps-2 fw-semibold ${
                      fieldErrors.employee_id ? "is-invalid" : ""
                    } ${
                      getFieldStatus("employee_id") === "success"
                        ? "is-valid"
                        : ""
                    }`}
                    style={{
                      backgroundColor: "var(--input-bg)",
                      color: "var(--input-text)",
                      borderColor: fieldErrors.employee_id
                        ? "#dc3545"
                        : "var(--input-border)",
                    }}
                    required
                    disabled={isSubmitting}
                    id="employee_id"
                  />
                  <span className="input-group-text bg-transparent border-start-0">
                    {renderFieldIcon("employee_id")}
                  </span>
                </div>
                {fieldErrors.employee_id && (
                  <div className="invalid-feedback d-block small mt-1">
                    {fieldErrors.employee_id}
                  </div>
                )}
              </div>

              {/* Position */}
              <div className="mb-3 position-relative">
                <label
                  htmlFor="position"
                  className="form-label fw-semibold mb-2"
                  style={{
                    fontSize: "0.9rem",
                    color: theme.textSecondary,
                  }}
                >
                  Position *
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0">
                    <FaUser className="text-muted" size={16} />
                  </span>
                  <input
                    type="text"
                    name="position"
                    placeholder="Position"
                    value={form.position}
                    onChange={handleInputChange}
                    className={`form-control border-start-0 ps-2 fw-semibold ${
                      fieldErrors.position ? "is-invalid" : ""
                    }`}
                    style={{
                      backgroundColor: "var(--input-bg)",
                      color: "var(--input-text)",
                      borderColor: fieldErrors.position
                        ? "#dc3545"
                        : "var(--input-border)",
                    }}
                    required
                    disabled={isSubmitting}
                    id="position"
                  />
                </div>
                {fieldErrors.position && (
                  <div className="invalid-feedback d-block small mt-1">
                    {fieldErrors.position}
                  </div>
                )}
              </div>

              {/* Division */}
              <div className="mb-3 position-relative">
                <label
                  htmlFor="division"
                  className="form-label fw-semibold mb-2"
                  style={{
                    fontSize: "0.9rem",
                    color: theme.textSecondary,
                  }}
                >
                  Division *
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0">
                    <FaBuilding className="text-muted" size={16} />
                  </span>
                  <input
                    type="text"
                    name="division"
                    placeholder="Division / Office"
                    value={form.division}
                    onChange={handleInputChange}
                    className={`form-control border-start-0 ps-2 fw-semibold ${
                      fieldErrors.division ? "is-invalid" : ""
                    }`}
                    style={{
                      backgroundColor: "var(--input-bg)",
                      color: "var(--input-text)",
                      borderColor: fieldErrors.division
                        ? "#dc3545"
                        : "var(--input-border)",
                    }}
                    required
                    disabled={isSubmitting}
                    id="division"
                  />
                </div>
                {fieldErrors.division && (
                  <div className="invalid-feedback d-block small mt-1">
                    {fieldErrors.division}
                  </div>
                )}
              </div>

              {/* School Name */}
              <div className="mb-3 position-relative">
                <label
                  htmlFor="school_name"
                  className="form-label fw-semibold mb-2"
                  style={{
                    fontSize: "0.9rem",
                    color: theme.textSecondary,
                  }}
                >
                  School Name *
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0">
                    <FaMapMarkerAlt className="text-muted" size={16} />
                  </span>
                  <input
                    type="text"
                    name="school_name"
                    placeholder="School name"
                    value={form.school_name}
                    onChange={handleInputChange}
                    className={`form-control border-start-0 ps-2 fw-semibold ${
                      fieldErrors.school_name ? "is-invalid" : ""
                    }`}
                    style={{
                      backgroundColor: "var(--input-bg)",
                      color: "var(--input-text)",
                      borderColor: fieldErrors.school_name
                        ? "#dc3545"
                        : "var(--input-border)",
                    }}
                    required
                    disabled={isSubmitting}
                    id="school_name"
                  />
                </div>
                {fieldErrors.school_name && (
                  <div className="invalid-feedback d-block small mt-1">
                    {fieldErrors.school_name}
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="mb-3 position-relative">
                <label
                  htmlFor="password"
                  className="form-label fw-semibold mb-2"
                  style={{
                    fontSize: "0.9rem",
                    color: theme.textSecondary,
                  }}
                >
                  Password *
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0">
                    <FaLock className="text-muted" size={16} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleInputChange}
                    onFocus={() => setShowPasswordCriteria(true)}
                    className={`form-control border-start-0 ps-2 fw-semibold ${
                      form.password &&
                      passwordValidation.minLength &&
                      passwordValidation.hasLetter &&
                      passwordValidation.hasNumber
                        ? "is-valid"
                        : form.password
                        ? "is-invalid"
                        : ""
                    }`}
                    style={{
                      backgroundColor: "var(--input-bg)",
                      color: "var(--input-text)",
                      borderColor: fieldErrors.password
                        ? "#dc3545"
                        : "var(--input-border)",
                      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    }}
                    required
                    minLength={8}
                    disabled={isSubmitting}
                    id="password"
                  />
                  <span className="input-group-text bg-transparent border-start-0">
                    <button
                      type="button"
                      className="btn btn-sm p-0 border-0 bg-transparent text-muted"
                      onClick={() =>
                        !isSubmitting && setShowPassword(!showPassword)
                      }
                      disabled={isSubmitting}
                    >
                      {showPassword ? (
                        <FaEyeSlash size={14} />
                      ) : (
                        <FaEye size={14} />
                      )}
                    </button>
                  </span>
                </div>
                {fieldErrors.password && (
                  <div className="invalid-feedback d-block small mt-1">
                    {fieldErrors.password}
                  </div>
                )}
                <div
                  className={`password-criteria-wrapper${showPasswordCriteria ? " password-criteria-visible" : ""}`}
                >
                  <div className="password-criteria-inner">
                    <div className="password-criteria-content">
                      <ul>
                        <li
                          className={
                            passwordValidation.minLength
                              ? "text-success"
                              : "text-muted"
                          }
                        >
                          • At least 8 characters
                        </li>
                        <li
                          className={
                            passwordValidation.hasLetter
                              ? "text-success"
                              : "text-muted"
                          }
                        >
                          • Contains a letter
                        </li>
                        <li
                          className={
                            passwordValidation.hasNumber
                              ? "text-success"
                              : "text-muted"
                          }
                        >
                          • Contains a number
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="mb-4 position-relative">
                <label
                  htmlFor="confirmPassword"
                  className="form-label fw-semibold mb-2"
                  style={{
                    fontSize: "0.9rem",
                    color: theme.textSecondary,
                  }}
                >
                  Confirm Password *
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0">
                    <FaLock className="text-muted" size={16} />
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm password"
                    value={form.confirmPassword}
                    onChange={handleInputChange}
                    className={`form-control border-start-0 ps-2 fw-semibold ${
                      fieldErrors.confirmPassword ? "is-invalid" : ""
                    }`}
                    style={{
                      backgroundColor: "var(--input-bg)",
                      color: "var(--input-text)",
                      borderColor: fieldErrors.confirmPassword
                        ? "#dc3545"
                        : "var(--input-border)",
                    }}
                    required
                    minLength={8}
                    disabled={isSubmitting}
                    id="confirmPassword"
                  />
                  <span className="input-group-text bg-transparent border-start-0">
                    <button
                      type="button"
                      className="btn btn-sm p-0 border-0 bg-transparent text-muted"
                      onClick={() =>
                        !isSubmitting &&
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      disabled={isSubmitting}
                    >
                      {showConfirmPassword ? (
                        <FaEyeSlash size={14} />
                      ) : (
                        <FaEye size={14} />
                      )}
                    </button>
                  </span>
                </div>
                {fieldErrors.confirmPassword && (
                  <div className="invalid-feedback d-block small mt-1">
                    {fieldErrors.confirmPassword}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-login w-100 py-2 fw-semibold shadow-sm d-flex justify-content-center align-items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="spinner me-2" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>

              {/* Login Link */}
              <p
                className="text-center mt-4 pt-3 mb-0 small fw-semibold border-top"
                style={{
                  color: theme.textSecondary,
                  paddingTop: "1rem",
                  borderColor: `${theme.borderColor} !important`,
                }}
              >
                Already have an account?{" "}
                <Link to="/login" className="fw-bold tas-auth-link">
                  Sign in here
                </Link>
              </p>
            </form>
                </div>

                {/* Panel 2: OTP verification (reference-style, same page) */}
                <div className="register-step-panel">
                  <button
                    type="button"
                    className="register-otp-back-btn btn btn-link p-0 mb-3 small d-inline-flex align-items-center"
                    style={{ fontSize: "0.9rem" }}
                    onClick={() => {
                      setStep("form");
                      setOtpError("");
                      setOtpDigits(["", "", "", "", "", ""]);
                    }}
                  >
                    <FaArrowLeft className="me-1" style={{ fontSize: "0.85rem" }} />
                    Back to sign up
                  </button>

                  <h5
                    className="fw-bolder mb-2"
                    style={{ color: theme.textPrimary, fontSize: "1.25rem" }}
                  >
                    Verify your email
                  </h5>
                  <p
                    className="small mb-4"
                    style={{ color: theme.textSecondary, lineHeight: 1.4 }}
                  >
                    Enter the 6-digit code we sent to{" "}
                    <span className="fw-semibold" style={{ color: theme.textPrimary }}>
                      {form.email || "your email"}
                    </span>
                    .
                  </p>

                  <form onSubmit={handleOtpVerify}>
                    <div
                      className="d-flex justify-content-between gap-1 mb-3"
                      style={{ gap: "0.35rem" }}
                    >
                      {otpDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (otpInputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onPaste={index === 0 ? handleOtpPaste : undefined}
                          className="form-control text-center fw-bold"
                          style={{
                            width: "clamp(36px, 10vw, 48px)",
                            height: "48px",
                            fontSize: "1.25rem",
                            border: otpError ? "2px solid #dc3545" : `2px solid ${theme.borderColor}`,
                            borderRadius: "8px",
                            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = theme.primary;
                            e.target.style.boxShadow = "0 0 0 3px rgba(245, 66, 134, 0.25)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = otpError ? "#dc3545" : theme.borderColor;
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      ))}
                    </div>

                    {otpError && (
                      <div className="small text-danger mb-2">{otpError}</div>
                    )}

                    <button
                      type="submit"
                      className="btn w-100 fw-semibold py-2 mb-2 rounded-3 register-otp-verify-btn"
                      style={{
                        backgroundColor: theme.primary,
                        color: "#fff",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(245, 66, 134, 0.3)",
                      }}
                      disabled={verifyLoading}
                    >
                      {verifyLoading ? (
                        <>
                          <FaSpinner className="me-2 spinner" />
                          Verifying...
                        </>
                      ) : (
                        "Verify email"
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-secondary w-100 py-2 rounded-3 register-otp-resend-btn"
                      onClick={handleResendOtp}
                      disabled={resendLoading || resendCooldown > 0}
                    >
                      {resendLoading
                        ? "Sending..."
                        : resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : "Resend code"}
                    </button>
                  </form>

                  <p className="text-center mt-3 mb-0 small" style={{ color: theme.textSecondary }}>
                    Already have an account?{" "}
                    <Link to="/login" className="fw-bold register-otp-signin-link">
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        /* Form Container Animation */
        .form-container {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s ease-in-out;
        }

        .form-container.fade-in {
          opacity: 1;
          transform: translateY(0);
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .form-control:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 0.2rem rgba(245, 66, 134, 0.25);
        }

        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
        }

        /* Input field hover effects */
        .form-control:hover:not(:focus):not(:disabled) {
          border-color: rgba(245, 66, 134, 0.5);
        }

        /* Error state styling */
        .is-invalid {
          border-color: #dc3545 !important;
        }

        .invalid-feedback {
          color: #dc3545;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        @media (max-width: 768px) {
          .form-control {
            font-size: 16px;
          }
        }

        @media (max-width: 576px) {
          .form-container {
            padding: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;
