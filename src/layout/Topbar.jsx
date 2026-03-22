import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { api } from "../services/api.js";
import Logo from "../assets/logo.png";
import TextLogo from "../assets/logo-text.png";
import LogoutConfirmModal from "../components/LogoutConfirmModal.jsx";

const normalizeLogoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  // Laravel Storage::url() returns paths like /storage/path/to/file
  // We need to prepend the base URL
  const baseUrl = api.baseUrl.replace(/\/$/, "");
  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
};

const Topbar = ({ onToggleSidebar, appName, logoUrl, settingsLoading }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userMenuRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isUserMenuClosing, setIsUserMenuClosing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0, left: undefined, maxWidth: 320 });
  const closeTimerRef = useRef(null);
  const [logoTimestamp, setLogoTimestamp] = useState(Date.now());
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());

  // Update timestamp when logoUrl changes to force image reload
  useEffect(() => {
    if (logoUrl) {
      setLogoTimestamp(Date.now());
    }
  }, [logoUrl]);

  // Update timestamp when user avatar changes (e.g. after profile photo update)
  useEffect(() => {
    if (user?.avatar_url) {
      setAvatarTimestamp(Date.now());
    }
  }, [user?.avatar_url]);

  const closeUserMenu = useCallback(() => {
    if (!isUserMenuOpen || isUserMenuClosing) return;
    setIsUserMenuClosing(true);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setIsUserMenuClosing(false);
      setIsUserMenuOpen(false);
    }, 180);
  }, [isUserMenuOpen, isUserMenuClosing]);

  const openUserMenu = useCallback(() => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    setIsUserMenuClosing(false);
    setIsUserMenuOpen(true);
  }, []);

  const toggleUserMenu = useCallback(() => {
    if (isUserMenuOpen) closeUserMenu();
    else openUserMenu();
  }, [isUserMenuOpen, closeUserMenu, openUserMenu]);

  useEffect(() => {
    if (!isUserMenuOpen || !triggerRef.current) return;
    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const padding = 12;
      const isMobile = window.innerWidth <= 576;
      if (isMobile) {
        setDropdownPosition({
          top: rect.bottom + 4,
          right: padding,
          left: undefined,
          maxWidth: window.innerWidth - padding * 2,
        });
      } else {
        const maxW = Math.min(320, window.innerWidth - padding * 2);
        const right = window.innerWidth - rect.right;
        const leftEdge = window.innerWidth - right - maxW;
        setDropdownPosition({
          top: rect.bottom + 4,
          right,
          left: leftEdge < padding ? padding : undefined,
          maxWidth: maxW,
        });
      }
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [isUserMenuOpen]);

  useEffect(() => {
    if (!isUserMenuOpen) return;

    const onPointerDown = (e) => {
      const inTrigger = userMenuRef.current?.contains(e.target);
      const inMenu = dropdownRef.current?.contains(e.target);
      if (!inTrigger && !inMenu) closeUserMenu();
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") closeUserMenu();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isUserMenuOpen, closeUserMenu]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleSignOutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await logout();
    } finally {
      setShowLogoutConfirm(false);
      closeUserMenu();
      navigate("/login");
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const getRoleDisplay = () => {
    if (!user?.role) return null;
    if (user.role === "admin") return "Administrator";
    if (user.role === "officer") return "Personnel";
    return user.role.charAt(0).toUpperCase() + user.role.slice(1);
  };

  return (
    <nav
      className="sb-topnav navbar navbar-expand navbar-light"
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "nowrap",
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      {/* Brand: logo + text, aligned with sidebar spacing via .topbar-brand-wrap */}
      <div className="navbar-brand topbar-brand-wrap d-flex align-items-center">
        {settingsLoading ? (
          <>
            <div className="topbar-logo-skeleton topbar-icon-logo-skeleton me-2" />
            <div className="topbar-logo-skeleton topbar-text-logo-skeleton" />
          </>
        ) : (
          <>
            {logoUrl ? (
              <img
                key={logoUrl}
                src={normalizeLogoUrl(logoUrl) + (logoUrl.includes('?') ? '&' : '?') + `t=${logoTimestamp}`}
                alt={appName || "TasDoneNa"}
                className="topbar-icon-logo me-2 topbar-logo-fade-in"
                onError={(e) => {
                  e.target.src = Logo;
                }}
              />
            ) : (
              <img
                src={Logo}
                alt={appName || "TasDoneNa"}
                className="topbar-icon-logo me-2 topbar-logo-fade-in"
              />
            )}
            <img
              src={TextLogo}
              alt={appName || "TasDoneNa"}
              className="topbar-text-logo topbar-logo-fade-in"
            />
          </>
        )}
      </div>

      {/* Sidebar Toggle */}
      <button
        className="btn btn-link btn-sm order-1 order-lg-0 me-2 me-lg-0"
        id="sidebarToggle"
        type="button"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <i className="fas fa-bars" />
      </button>

      {/* User Dropdown (CPC-style structure) */}
      <ul className="navbar-nav ms-auto me-2 me-lg-3">
        <li className="nav-item dropdown" ref={userMenuRef}>
          <a
            ref={triggerRef}
            className="nav-link dropdown-toggle d-flex align-items-center"
            id="navbarDropdown"
            href="#"
            role="button"
            aria-expanded={isUserMenuOpen ? "true" : "false"}
            onClick={(e) => {
              e.preventDefault();
              toggleUserMenu();
            }}
          >
            <div className="position-relative me-2">
              {user?.avatar_url ? (
                <img
                  src={normalizeLogoUrl(user.avatar_url) + (user.avatar_url.includes("?") ? "&" : "?") + `t=${avatarTimestamp}`}
                  alt=""
                  className="rounded-circle"
                  style={{
                    width: "32px",
                    height: "32px",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextElementSibling?.classList.remove("d-none");
                  }}
                />
              ) : null}
              <div
                className={`bg-light rounded-circle d-flex align-items-center justify-content-center ${user?.avatar_url ? "d-none" : ""}`}
                style={{
                  width: "32px",
                  height: "32px",
                }}
              >
                <i className="fas fa-user text-dark" style={{ fontSize: "14px" }} />
              </div>
            </div>
            <span className="d-none d-lg-inline">
              {user?.name || "User"}
            </span>
          </a>

          {(isUserMenuOpen || isUserMenuClosing) &&
            createPortal(
              <div
                ref={dropdownRef}
                className="user-dropdown-portal-wrap"
                style={{
                  position: "fixed",
                  top: dropdownPosition.top,
                  ...(dropdownPosition.left != null
                    ? { left: dropdownPosition.left, right: "auto" }
                    : { right: dropdownPosition.right }),
                  maxWidth: dropdownPosition.maxWidth,
                  minWidth: 200,
                  zIndex: 99999,
                  overflow: "visible",
                  maxHeight: "none",
                }}
              >
                <ul
                  className={`dropdown-menu show user-dropdown-portal-menu ${
                    isUserMenuOpen && !isUserMenuClosing ? "is-open" : ""
                  } ${isUserMenuClosing ? "is-closing" : ""}`}
                  aria-labelledby="navbarDropdown"
                  data-user-dropdown="true"
                  style={{
                    display: "block",
                    position: "relative",
                    width: "100%",
                    minWidth: "200px",
                    padding: "6px 0",
                    backgroundColor: "#fff",
                    border: "1px solid #e0e0e0",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(45, 90, 39, 0.15)",
                    maxHeight: "none",
                    overflow: "visible",
                    overflowY: "visible",
                    margin: 0,
                    listStyle: "none",
                  }}
                >
                  <li>
                    <div className="dropdown-header user-dropdown-header">
                      <strong className="user-dropdown-name" title={user?.name || "User"}>{user?.name || "User"}</strong>
                      {user?.email && (
                        <div className="small text-muted user-dropdown-email" title={user.email}>{user.email}</div>
                      )}
                      {getRoleDisplay() && (
                        <div className="small text-muted user-dropdown-role">
                          {getRoleDisplay()}
                        </div>
                      )}
                    </div>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  {user?.role === "officer" && (
                    <li>
                      <button
                        className="dropdown-item custom-dropdown-item"
                        type="button"
                        onClick={() => {
                          closeUserMenu();
                          navigate("/profile");
                        }}
                      >
                        <i className="fas fa-user me-2" />
                        Profile
                      </button>
                    </li>
                  )}
                  <li>
                    <button
                      className="dropdown-item custom-dropdown-item logout-item"
                      type="button"
                      onClick={handleSignOutClick}
                    >
                      <i className="fas fa-sign-out-alt me-2" />
                      Logout
                    </button>
                  </li>
                </ul>
              </div>,
              document.body
            )}
        </li>
      </ul>

      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </nav>
  );
};

export default Topbar;
