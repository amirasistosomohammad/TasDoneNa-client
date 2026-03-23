import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { api } from "../../services/api.js";
import { showToast } from "../../services/notificationService.js";
import AccountStatusPanelReveal from "../../components/AccountStatusPanelReveal.jsx";
import { appRevealMotionProps } from "../../motion/appReveal.js";
import {
  FaUser,
  FaSpinner,
  FaLock,
  FaSave,
  FaIdCard,
  FaBuilding,
  FaMapMarkerAlt,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import "./Profile.css";

const normalizeLogoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const baseUrl = api.baseUrl.replace(/\/$/, "");
  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
};

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const reducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState("account");
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    employee_id: "",
    position: "",
    division: "",
    district: "",
    school_name: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLetter: false,
    hasNumber: false,
  });
  const [showPasswordCriteria, setShowPasswordCriteria] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [schoolLogoLoading, setSchoolLogoLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        employee_id: user.employee_id || "",
        position: user.position || "",
        division: user.division || "",
        district: user.district || "",
        school_name: user.school_name || "",
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    if (profileErrors[name]) setProfileErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));

    if (name === "new_password") {
      if (value.length > 0) setShowPasswordCriteria(true);
      const validation = {
        minLength: value.length >= 8,
        hasLetter: /[A-Za-z]/.test(value),
        hasNumber: /[0-9]/.test(value),
      };
      setPasswordValidation(validation);
    }

    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validatePassword = (pwd) => {
    if (!pwd) return false;
    const validation = {
      minLength: pwd.length >= 8,
      hasLetter: /[A-Za-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
    };
    setPasswordValidation(validation);
    return validation.minLength && validation.hasLetter && validation.hasNumber;
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast.error("Image must be 2MB or less.");
      return;
    }
    if (!/^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.type)) {
      showToast.error("Use JPEG, PNG, GIF, or WebP.");
      return;
    }
    setAvatarLoading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await api.upload("/user/avatar", fd);
      if (res?.user) await refreshUser(res.user);
      showToast.success("Profile photo updated.");
    } catch (err) {
      const msg =
        err?.data?.errors?.avatar?.[0] || err?.message || "Failed to upload photo.";
      showToast.error(msg);
    } finally {
      setAvatarLoading(false);
      e.target.value = "";
    }
  };

  const handleSchoolLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast.error("Image must be 2MB or less.");
      return;
    }
    if (!/^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.type)) {
      showToast.error("Use JPEG, PNG, GIF, or WebP.");
      return;
    }
    setSchoolLogoLoading(true);
    try {
      const fd = new FormData();
      fd.append("school_logo", file);
      const res = await api.upload("/user/school-logo", fd);
      if (res?.user) await refreshUser(res.user);
      showToast.success("School logo updated.");
    } catch (err) {
      const msg =
        err?.data?.errors?.school_logo?.[0] || err?.message || "Failed to upload logo.";
      showToast.error(msg);
    } finally {
      setSchoolLogoLoading(false);
      e.target.value = "";
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!profileForm.name?.trim()) next.name = "Name is required.";
    setProfileErrors(next);
    if (Object.keys(next).length > 0) return;

    setProfileLoading(true);
    try {
      const res = await api.put("/user/profile", {
        name: profileForm.name.trim(),
        employee_id: profileForm.employee_id.trim() || null,
        position: profileForm.position.trim() || null,
        division: profileForm.division.trim() || null,
        district: profileForm.district.trim() || null,
        school_name: profileForm.school_name.trim() || null,
      });
      if (res?.user) await refreshUser(res.user);
      showToast.success("Profile updated successfully.");
    } catch (err) {
      const msg =
        err?.data?.errors
          ? Object.values(err.data.errors).flat().join(" ")
          : err?.message || "Failed to update profile.";
      showToast.error(msg);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!passwordForm.current_password) next.current_password = "Current password is required.";
    if (!passwordForm.new_password) next.new_password = "New password is required.";
    else if (!validatePassword(passwordForm.new_password)) {
      next.new_password =
        "Password must be at least 8 characters and include a letter and a number.";
    }
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      next.new_password_confirmation = "Passwords do not match.";
    }
    setPasswordErrors(next);
    if (Object.keys(next).length > 0) return;

    setPasswordLoading(true);
    try {
      await api.put("/user/password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        new_password_confirmation: passwordForm.new_password_confirmation,
      });
      setPasswordForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
      setPasswordErrors({});
      setPasswordValidation({ minLength: false, hasLetter: false, hasNumber: false });
      setShowPasswordCriteria(false);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      showToast.success("Password changed successfully.");
    } catch (err) {
      const msg =
        err?.data?.errors?.current_password?.[0] ||
        (err?.data?.errors ? Object.values(err.data.errors).flat().join(" ") : null) ||
        err?.message ||
        "Failed to change password.";
      showToast.error(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) return null;

  const profileShellReveal = appRevealMotionProps(reducedMotion);
  const profileLeftReveal = appRevealMotionProps(reducedMotion, { delay: 0.08, y: -12, duration: 0.4 });
  const profileRightReveal = appRevealMotionProps(reducedMotion, { delay: 0.12, y: -12, duration: 0.4 });

  const avatarUrl = user.avatar_url ? normalizeLogoUrl(user.avatar_url) : null;
  const schoolLogoUrl = user.school_logo_url ? normalizeLogoUrl(user.school_logo_url) : null;
  const showSchoolLogo = user.role === "officer" || user.role === "admin";

  return (
    <div className="container-fluid px-3 px-md-4">
      <motion.div className="profile-settings-container system-settings-container" {...profileShellReveal}>
        <div className="system-settings-header mt-4 mb-3">
          <div className="profile-settings-avatar-wrap system-settings-header-icon-wrap">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="profile-settings-photo-preview"
              />
            ) : (
              <FaUser className="profile-settings-avatar-placeholder system-settings-header-gear" />
            )}
          </div>
          <h1 className="system-settings-header-title">My profile</h1>
          <p className="system-settings-header-subtitle">
            {user?.name || "User"} • {user?.email || "—"}
          </p>
          <p className="system-settings-header-desc">
            Review and maintain your official account information and access credentials.
          </p>
        </div>

        <div className="system-settings-row mb-4">
          <motion.div className="system-settings-card system-settings-card-left" {...profileLeftReveal}>
            <h2 className="system-settings-menu-title">Profile Menu</h2>
            <nav className="system-settings-nav">
              <button
                className={`system-settings-nav-btn ${activeTab === "account" ? "active" : ""}`}
                onClick={() => setActiveTab("account")}
              >
                <FaUser className="system-settings-nav-icon" />
                <div className="system-settings-nav-text">
                  <span className="system-settings-nav-label">Account information</span>
                  <span className="system-settings-nav-desc">Update your profile details</span>
                </div>
              </button>
              <button
                className={`system-settings-nav-btn ${activeTab === "security" ? "active" : ""}`}
                onClick={() => setActiveTab("security")}
              >
                <FaLock className="system-settings-nav-icon" />
                <div className="system-settings-nav-text">
                  <span className="system-settings-nav-label">Security</span>
                  <span className="system-settings-nav-desc">Change your password</span>
                </div>
              </button>
            </nav>
          </motion.div>

          <motion.div className="system-settings-card system-settings-card-right" {...profileRightReveal}>
            <div className="system-settings-content-body">
              {activeTab === "account" && (
                <AccountStatusPanelReveal className="system-settings-tab-panel">
                  <h2 className="system-settings-card-title">
                    <FaUser className="system-settings-card-title-icon" />
                    Account information
                  </h2>
                  <div className="system-settings-admin-note">
                    Note: Your email address is used for authentication and cannot be changed.
                  </div>

                  <form
                    className="system-settings-form profile-settings-form"
                    onSubmit={handleProfileSubmit}
                  >
                    <div className="system-settings-form-group">
                      <label className="system-settings-label">Profile photo</label>
                      <div className="profile-settings-avatar-section">
                        <div className="profile-settings-avatar-wrap">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt="Profile"
                              className="profile-settings-photo-preview"
                            />
                          ) : (
                            <FaUser className="profile-settings-avatar-placeholder" />
                          )}
                        </div>
                        <div className="profile-settings-avatar-actions">
                          <input
                            type="file"
                            id="avatar-upload"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            className="system-settings-logo-input"
                            onChange={handleAvatarChange}
                            disabled={avatarLoading}
                          />
                          <label
                            htmlFor="avatar-upload"
                            className="system-settings-logo-btn"
                          >
                            {avatarLoading ? (
                              <>
                                <FaSpinner className="spinner" />
                                Uploading…
                              </>
                            ) : (
                              "Upload photo"
                            )}
                          </label>
                          <span className="system-settings-logo-hint">
                            PNG, JPG, WEBP up to 2MB.
                          </span>
                        </div>
                      </div>
                    </div>

                    {showSchoolLogo && (
                      <div className="system-settings-form-group">
                        <label className="system-settings-label">School logo</label>
                        <div className="profile-settings-avatar-section">
                          <div className="profile-settings-avatar-wrap profile-settings-school-logo-wrap">
                            {schoolLogoUrl ? (
                              <img
                                src={schoolLogoUrl}
                                alt="School logo"
                                className="profile-settings-photo-preview"
                              />
                            ) : (
                              <FaBuilding className="profile-settings-avatar-placeholder" />
                            )}
                          </div>
                          <div className="profile-settings-avatar-actions">
                            <input
                              type="file"
                              id="school-logo-upload"
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                              className="system-settings-logo-input"
                              onChange={handleSchoolLogoChange}
                              disabled={schoolLogoLoading}
                            />
                            <label
                              htmlFor="school-logo-upload"
                              className="system-settings-logo-btn"
                            >
                              {schoolLogoLoading ? (
                                <>
                                  <FaSpinner className="spinner" />
                                  Uploading…
                                </>
                              ) : (
                                "Upload school logo"
                              )}
                            </label>
                            <span className="system-settings-logo-hint">
                              PNG, JPG, WEBP up to 2MB. Included in reports.
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="profile-settings-grid">
                      <div className="system-settings-form-group">
                        <label className="system-settings-label">
                          Full name <span className="system-settings-required">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          className={`system-settings-input profile-settings-input ${
                            profileErrors.name ? "system-settings-input error profile-settings-input-error" : ""
                          }`}
                          value={profileForm.name}
                          onChange={handleProfileChange}
                          disabled={profileLoading}
                        />
                        {profileErrors.name && (
                          <div className="system-settings-error">{profileErrors.name}</div>
                        )}
                      </div>
                      <div className="system-settings-form-group profile-settings-form-group-readonly">
                        <label className="system-settings-label profile-settings-readonly-hint">
                          Email (cannot be changed)
                        </label>
                        <input
                          type="text"
                          className="system-settings-input profile-settings-input profile-settings-input-readonly"
                          value={user?.email || ""}
                          disabled
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="profile-settings-grid">
                      <div className="system-settings-form-group">
                        <label className="system-settings-label">
                          <FaIdCard className="profile-settings-label-icon" /> Employee ID
                        </label>
                        <input
                          type="text"
                          name="employee_id"
                          className="system-settings-input profile-settings-input"
                          value={profileForm.employee_id}
                          onChange={handleProfileChange}
                          disabled={profileLoading}
                          placeholder="Optional"
                        />
                      </div>
                      <div className="system-settings-form-group">
                        <label className="system-settings-label">
                          <FaMapMarkerAlt className="profile-settings-label-icon" /> Position
                        </label>
                        <input
                          type="text"
                          name="position"
                          className="system-settings-input profile-settings-input"
                          value={profileForm.position}
                          onChange={handleProfileChange}
                          disabled={profileLoading}
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    <div className="profile-settings-grid">
                      <div className="system-settings-form-group">
                        <label className="system-settings-label">
                          <FaBuilding className="profile-settings-label-icon" /> Division
                        </label>
                        <input
                          type="text"
                          name="division"
                          className="system-settings-input profile-settings-input"
                          value={profileForm.division}
                          onChange={handleProfileChange}
                          disabled={profileLoading}
                          placeholder="Optional"
                        />
                      </div>
                      <div className="system-settings-form-group">
                        <label className="system-settings-label">
                          <FaMapMarkerAlt className="profile-settings-label-icon" /> District
                        </label>
                        <input
                          type="text"
                          name="district"
                          className="system-settings-input profile-settings-input"
                          value={profileForm.district}
                          onChange={handleProfileChange}
                          disabled={profileLoading}
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    <div className="profile-settings-grid">
                      <div className="system-settings-form-group">
                        <label className="system-settings-label">School name</label>
                        <input
                          type="text"
                          name="school_name"
                          className="system-settings-input profile-settings-input"
                          value={profileForm.school_name}
                          onChange={handleProfileChange}
                          disabled={profileLoading}
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    <div className="system-settings-form-footer">
                      <button
                        type="submit"
                        className="system-settings-btn-primary"
                        disabled={profileLoading}
                      >
                        {profileLoading ? (
                          <>
                            <FaSpinner className="spinner" />
                            Saving…
                          </>
                        ) : (
                          <>
                            <FaSave />
                            Save changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
              </AccountStatusPanelReveal>
              )}

              {activeTab === "security" && (
                <AccountStatusPanelReveal className="system-settings-tab-panel">
                  <h2 className="system-settings-card-title">
                    <FaLock className="system-settings-card-title-icon" />
                    Security
                  </h2>
                  <div className="system-settings-admin-note">
                    Security note: Use a strong password and do not share your credentials.
                  </div>

                  <form
                    className="system-settings-form"
                    onSubmit={handlePasswordSubmit}
                  >
                    <div className="system-settings-form-group">
                      <label className="system-settings-label">
                        Current password <span className="system-settings-required">*</span>
                      </label>
                      <div className="system-settings-input-wrap profile-settings-password-input-wrap">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          name="current_password"
                          className={`system-settings-input profile-settings-password-input ${
                            passwordErrors.current_password ? "error" : ""
                          }`}
                          value={passwordForm.current_password}
                          onChange={handlePasswordChange}
                          disabled={passwordLoading}
                        />
                        <button
                          type="button"
                          className="system-settings-input-toggle profile-settings-password-toggle"
                          onClick={() =>
                            !passwordLoading && setShowCurrentPassword(!showCurrentPassword)
                          }
                          disabled={passwordLoading}
                          aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                        >
                          {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {passwordErrors.current_password && (
                        <div className="system-settings-error">{passwordErrors.current_password}</div>
                      )}
                    </div>

                    <div className="system-settings-form-group">
                      <label className="system-settings-label">
                        New password <span className="system-settings-required">*</span>
                      </label>
                      <div className="system-settings-input-wrap profile-settings-password-input-wrap">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          name="new_password"
                          className={`system-settings-input profile-settings-password-input ${
                            passwordErrors.new_password ? "error" : ""
                          }`}
                          value={passwordForm.new_password}
                          onChange={handlePasswordChange}
                          disabled={passwordLoading}
                        />
                        <button
                          type="button"
                          className="system-settings-input-toggle profile-settings-password-toggle"
                          onClick={() =>
                            !passwordLoading && setShowNewPassword(!showNewPassword)
                          }
                          disabled={passwordLoading}
                          aria-label={showNewPassword ? "Hide password" : "Show password"}
                        >
                          {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      <div
                        className={`profile-settings-password-criteria-wrapper ${
                          showPasswordCriteria && passwordForm.new_password
                            ? "profile-settings-password-criteria-visible"
                            : ""
                        }`}
                      >
                        <div className="profile-settings-password-criteria-inner">
                          <ul className="profile-settings-password-criteria-content">
                            <li className={passwordValidation.minLength ? "profile-settings-criteria-valid" : ""}>
                              • At least 8 characters
                            </li>
                            <li className={passwordValidation.hasLetter ? "profile-settings-criteria-valid" : ""}>
                              • Contains a letter
                            </li>
                            <li className={passwordValidation.hasNumber ? "profile-settings-criteria-valid" : ""}>
                              • Contains a number
                            </li>
                          </ul>
                        </div>
                      </div>
                      {passwordErrors.new_password && (
                        <div className="system-settings-error">{passwordErrors.new_password}</div>
                      )}
                    </div>

                    <div className="system-settings-form-group">
                      <label className="system-settings-label">
                        Confirm new password <span className="system-settings-required">*</span>
                      </label>
                      <div className="system-settings-input-wrap profile-settings-password-input-wrap">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="new_password_confirmation"
                          className={`system-settings-input profile-settings-password-input ${
                            passwordErrors.new_password_confirmation ? "error" : ""
                          }`}
                          value={passwordForm.new_password_confirmation}
                          onChange={handlePasswordChange}
                          disabled={passwordLoading}
                        />
                        <button
                          type="button"
                          className="system-settings-input-toggle profile-settings-password-toggle"
                          onClick={() =>
                            !passwordLoading && setShowConfirmPassword(!showConfirmPassword)
                          }
                          disabled={passwordLoading}
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {passwordErrors.new_password_confirmation && (
                        <div className="system-settings-error">
                          {passwordErrors.new_password_confirmation}
                        </div>
                      )}
                    </div>

                    <div className="system-settings-form-footer">
                      <button
                        type="submit"
                        className="system-settings-btn-primary"
                        disabled={passwordLoading}
                      >
                        {passwordLoading ? (
                          <>
                            <FaSpinner className="spinner" />
                            Changing…
                          </>
                        ) : (
                          <>
                            <FaLock />
                            Change password
                          </>
                        )}
                      </button>
                    </div>
                  </form>
              </AccountStatusPanelReveal>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
