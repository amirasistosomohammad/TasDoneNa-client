import React from "react";
import { NavLink } from "react-router-dom";
import { FaTachometerAlt, FaTasks } from "react-icons/fa";

/**
 * Application sidebar.
 * Simplified version of the CPC layout: sections, icons, active state, responsive collapse.
 */
const Sidebar = ({ onCloseSidebar }) => {
  const handleLinkClick = () => {
    if (window.innerWidth < 768 && onCloseSidebar) {
      onCloseSidebar();
    }
  };

  return (
    <nav className="sb-sidenav accordion sb-sidenav-light" id="sidenavAccordion">
      <div className="sb-sidenav-menu">
        <div className="nav">
          <div className="sb-sidenav-menu-heading">Core</div>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              "nav-link" + (isActive ? " active" : "")
            }
            onClick={handleLinkClick}
          >
            <div className="sb-nav-link-icon">
              <FaTachometerAlt />
            </div>
            Dashboard
          </NavLink>

          <div className="sb-sidenav-menu-heading">Tasks</div>
          <div className="nav-link disabled small text-muted">
            <div className="sb-nav-link-icon">
              <FaTasks />
            </div>
            Task management (coming soon)
          </div>
        </div>
      </div>

      <div className="sb-sidenav-footer">
        <div className="small">Logged in as:</div>
        TasDoneNa Officer
      </div>
    </nav>
  );
};

export default Sidebar;