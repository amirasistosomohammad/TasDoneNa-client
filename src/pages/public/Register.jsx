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
  const { register: registerUser } = useAuth();

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Check institutional email format in real-time
    if (name === "email" && value) {
      validateInstitutionalEmail(value);
    }
  };

  const validateInstitutionalEmail = (email) => {
    // Check if email ends with @deped.gov.ph or similar DepEd domains
    const depedEmailPattern = /^[^\s@]+@deped\.gov\.ph$/i;

    if (!depedEmailPattern.test(email)) {
      setFieldErrors((prev) => ({
        ...prev,
        email: "Please use your institutional DepEd email (@deped.gov.ph)",
      }));
      return false;
    } else {
      setFieldErrors((prev) => ({ ...prev, email: "" }));
      return true;
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = "Please enter your full name";
    }

    if (!form.email.trim()) {
      errors.email = "Please enter your institutional email address";
    } else {
      if (!validateInstitutionalEmail(form.email)) {
        // Error already set in validateInstitutionalEmail
        errors.email =
          fieldErrors.email ||
          "Please use your institutional DepEd email (@deped.gov.ph)";
      }
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

    if (form.password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
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
        showAlert.success(
          "Registration Successful!",
          result.message || "Check your email for the OTP to verify your account.",
        );
        const verifyUrl = result.email
          ? `/verify-email?email=${encodeURIComponent(result.email)}`
          : "/verify-email";
        setTimeout(() => navigate(verifyUrl, { replace: true }), 1500);
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
      {/* Left Panel - Fixed on large screens */}
      <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-center align-items-center text-white p-5 position-fixed start-0 top-0 h-100">
        {/* Background Image with Blur Effect */}
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            backgroundImage: `url(${LoginBackground})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: backgroundLoaded ? "blur(0px)" : "blur(10px)",
            transition: "filter 0.5s ease-in-out",
          }}
        />

        {/* Gradient Overlay */}
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            background: `linear-gradient(rgba(245, 66, 134, 0.85), rgba(213, 50, 111, 0.85))`,
          }}
        />

        {/* Content - ALWAYS CLEAR */}
        <div className="position-relative z-2 d-flex flex-column align-items-center justify-content-center w-100 h-100 px-4">
          {/* Logo Section */}
          <div className="text-center mb-4">
            <div
              className="d-flex align-items-center justify-content-center mx-auto"
              style={{
                width: "fit-content",
                gap: "0.3rem",
              }}
            >
              {/* Logo Image */}
              <div
                className="d-flex align-items-center justify-content-center"
                style={{
                  width: "85px",
                }}
              >
                <img
                  src={Logo}
                  alt="TasDoneNa Logo"
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "contain",
                  }}
                />
              </div>

              {/* Text Logo */}
              <div
                className="d-flex flex-column justify-content-center align-items-start"
                style={{
                  width: "150px",
                }}
              >
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
                  className="fw-bolder text-start"
                  style={{
                    fontSize: "9px",
                    color: "white",
                    margin: 0,
                    lineHeight: "1.2",
                  }}
                >
                  A To Do List Management System for Public School
                  Administrative Officers
                </p>
              </div>
            </div>
          </div>

          {/* Title */}
          <h4
            className="fw-bold text-center mb-3"
            style={{
              color: "white",
              fontSize: "1.5rem",
            }}
          >
            TasDoneNa
          </h4>

          {/* Description */}
          <p
            className="text-center mx-auto"
            style={{
              fontSize: "15px",
              maxWidth: "360px",
              color: "rgba(255,255,255,0.9)",
              lineHeight: "1.5",
            }}
          >
            Register with your DepEd institutional email to start managing your
            tasks and productivity. Your account will be activated after admin
            approval.
          </p>
        </div>
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
            {/* Mobile Logo - Only show on small screens */}
            <div className="d-lg-none text-center mb-4">
              <div className="d-flex align-items-center justify-content-center">
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    filter: backgroundLoaded ? "blur(0px)" : "blur(8px)",
                    opacity: backgroundLoaded ? 1 : 0,
                    transition: "all 0.6s ease",
                  }}
                >
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
              </div>
            </div>

            {/* Header */}
            <div className="text-start mb-4">
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
                Register with your DepEd institutional email to access the task
                management system. Your account will be activated after admin
                approval.
              </p>
            </div>

            {/* Approval Notice */}
            <div className="alert alert-info text-center small mb-4">
              <strong>Note:</strong> Your account requires admin verification.
              You&apos;ll be able to log in once your account is approved.
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
                    placeholder="Enter your full name"
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
                    placeholder="your.name@deped.gov.ph"
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
                  Must be a DepEd institutional email (@deped.gov.ph)
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
                    placeholder="Enter your employee ID"
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
                    placeholder="e.g., Administrative Officer II"
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
                    placeholder="e.g., Division Office"
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
                    placeholder="Enter your school name"
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
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleInputChange}
                    className={`form-control border-start-0 ps-2 fw-semibold ${
                      fieldErrors.password ? "is-invalid" : ""
                    }`}
                    style={{
                      backgroundColor: "var(--input-bg)",
                      color: "var(--input-text)",
                      borderColor: fieldErrors.password
                        ? "#dc3545"
                        : "var(--input-border)",
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
                <div className="form-text small mt-1">
                  Password must be at least 8 characters long
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
                    placeholder="Confirm your password"
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
                className="btn w-100 fw-semibold d-flex justify-content-center align-items-center position-relative"
                disabled={isSubmitting}
                style={{
                  backgroundColor: theme.primary,
                  color: "#ffffff",
                  height: "43px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "1rem",
                  transition: "all 0.3s ease-in-out",
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(245, 66, 134, 0.3)",
                }}
                onMouseOver={(e) => {
                  if (!isSubmitting) {
                    e.target.style.backgroundColor = theme.primaryDark;
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow =
                      "0 6px 20px rgba(245, 66, 134, 0.4)";
                  }
                }}
                onMouseOut={(e) => {
                  if (!isSubmitting) {
                    e.target.style.backgroundColor = theme.primary;
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      "0 4px 12px rgba(245, 66, 134, 0.3)";
                  }
                }}
                onMouseDown={(e) => {
                  if (!isSubmitting) {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      "0 2px 6px rgba(245, 66, 134, 0.3)";
                  }
                }}
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
                <Link
                  to="/login"
                  className="fw-bold login-register-link"
                  style={{ color: theme.primary }}
                >
                  Sign in here
                </Link>
              </p>
            </form>
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
