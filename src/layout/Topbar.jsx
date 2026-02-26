import React from "react";
import { FaBars } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext.jsx";
import Logo from "../assets/logo.png";
import TextLogo from "../assets/logo-text.png";

/**
 * Top navigation bar (CPC-style) with brand, sidebar toggle, and user info.
 */
const Topbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <nav className="sb-topnav navbar navbar-expand navbar-dark">
      <button
        type="button"
        className="btn btn-link btn-sm order-1 order-lg-0 me-3 d-flex align-items-center"
        id="sidebarToggle"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <FaBars />
      </button>

      <div className="navbar-brand d-flex align-items-center me-auto">
        <img
          src={Logo}
          alt="TasDoneNa"
          style={{ height: "34px", width: "34px", objectFit: "contain" }}
          className="me-2"
        />
        <img
          src={TextLogo}
          alt="TasDoneNa"
          style={{ height: "22px", objectFit: "contain" }}
          className="d-none d-sm-inline"
        />
      </div>

      <div className="d-none d-md-flex align-items-center ms-auto me-2 small">
        {user?.name ? `Signed in as ${user.name}` : "TasDoneNa"}
      </div>
    </nav>
  );
};

export default Topbar;