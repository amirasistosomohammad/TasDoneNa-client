import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { FaKey, FaSpinner, FaArrowLeft } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { showAlert, showToast } from "../../services/notificationService.js";
import LoginBackground from "../../assets/login-bg.png";
import Logo from "../../assets/logo.png";
import TextLogo from "../../assets/logo-text.png";

const VerifyEmail = () => {
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyEmail, resendOtp } = useAuth();

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
    const fromParam = searchParams.get("email");
    if (fromParam) setEmail(fromParam);
  }, [searchParams]);

  const handleVerify = async (e) => {
    e.preventDefault();
    const emailToUse = email.trim();
    if (!emailToUse) {
      showAlert.error("Validation", "Please enter your email address.");
      return;
    }
    if (!otp.trim() || otp.trim().length !== 6) {
      showAlert.error("Validation", "Please enter the 6-digit OTP from your email.");
      return;
    }

    setIsSubmitting(true);
    try {
      showAlert.loading("Verifying...");
      await verifyEmail(emailToUse, otp.trim());
      showAlert.close();
      showToast.success("Email verified! You can log in after admin approval.");
      navigate("/login", { replace: true });
    } catch (error) {
      showAlert.close();
      const msg =
        error.data?.message ||
        (error.data?.errors?.otp ? error.data.errors.otp[0] : null) ||
        (error.data?.errors?.email ? error.data.errors.email[0] : null) ||
        error.message ||
        "Verification failed.";
      showAlert.error("Verification Failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    const emailToUse = email.trim();
    if (!emailToUse) {
      showAlert.error("Validation", "Please enter your email address first.");
      return;
    }

    setIsResending(true);
    try {
      showAlert.loading("Sending new OTP...");
      await resendOtp(emailToUse);
      showAlert.close();
      showToast.success("A new OTP has been sent to your email.");
    } catch (error) {
      showAlert.close();
      const msg =
        error.data?.message ||
        (error.data?.errors?.email ? error.data.errors.email[0] : null) ||
        error.message ||
        "Failed to resend OTP.";
      showAlert.error("Resend Failed", msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center position-relative">
      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          backgroundImage: `url(${LoginBackground})`,
          backgroundSize: "cover",
          filter: backgroundLoaded ? "blur(0px)" : "blur(10px)",
          transition: "filter 0.3s ease",
        }}
      />
      <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark opacity-50" />

      <div className="position-relative col-11 col-sm-10 col-md-8 col-lg-5 col-xl-4 mx-auto">
        <div
          className="rounded-4 shadow-lg p-4 p-sm-5"
          style={{ backgroundColor: theme.backgroundWhite }}
        >
          <div className="text-center mb-4">
            <img src={Logo} alt="TasDoneNa" style={{ height: "56px" }} />
            <img src={TextLogo} alt="TasDoneNa" className="ms-2" style={{ height: "32px" }} />
          </div>

          <h5 className="text-center mb-2" style={{ color: theme.textPrimary }}>
            Verify your email
          </h5>
          <p className="text-center small mb-4" style={{ color: theme.textSecondary }}>
            Enter the 6-digit code we sent to your DepEd email.
          </p>

          <form onSubmit={handleVerify}>
            <div className="mb-3">
              <label className="form-label small" style={{ color: theme.textPrimary }}>
                Email
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <FaKey style={{ color: theme.textSecondary }} />
                </span>
                <input
                  type="email"
                  className="form-control border-start-0"
                  placeholder="you@deped.gov.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ borderColor: theme.borderColor }}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label small" style={{ color: theme.textPrimary }}>
                OTP (6 digits)
              </label>
              <input
                type="text"
                className="form-control form-control-lg text-center"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                style={{
                  borderColor: theme.borderColor,
                  letterSpacing: "0.5em",
                  fontSize: "1.25rem",
                }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 mb-2 rounded-3"
              style={{ backgroundColor: theme.primary, borderColor: theme.primary }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="me-2 spinner" /> Verifying...
                </>
              ) : (
                "Verify email"
              )}
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary w-100 py-2 rounded-3"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? (
                <>
                  <FaSpinner className="me-2 spinner" /> Sending...
                </>
              ) : (
                "Resend OTP"
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link
              to="/login"
              className="d-inline-flex align-items-center small"
              style={{ color: theme.primary }}
            >
              <FaArrowLeft className="me-1" /> Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
