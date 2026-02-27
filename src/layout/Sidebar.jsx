import React from "react";
import { NavLink } from "react-router-dom";
import { FaTachometerAlt, FaList, FaPlus, FaUserCheck, FaUsers } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext.jsx";

/**
 * Application sidebar.
 * Pending count comes from Layout so the real amount is loaded as soon as the app opens (even when sidebar is closed).
 */
const Sidebar = ({ onCloseSidebar, pendingApprovalsCount }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const countLoaded = pendingApprovalsCount !== null && pendingApprovalsCount !== undefined;
  const pendingCount = countLoaded ? pendingApprovalsCount : 0;

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

          {isAdmin && (
            <>
              <div className="sb-sidenav-menu-heading">User management</div>
              <NavLink
                to="/account-approvals"
                className={({ isActive }) =>
                  "nav-link sb-sidebar-link-with-badge d-flex align-items-center flex-nowrap" + (isActive ? " active" : "")
                }
                onClick={handleLinkClick}
                title="Account approvals"
              >
                <span className="sb-sidebar-nav-link-text d-flex align-items-center min-w-0">
                  <div className="sb-nav-link-icon flex-shrink-0">
                    <FaUserCheck />
                  </div>
                  <span className="sb-sidebar-nav-link-label text-truncate">Account approvals</span>
                </span>
                <span
                  className="badge sb-sidebar-badge-approvals rounded-pill flex-shrink-0"
                  aria-label={countLoaded ? `${pendingCount} pending` : "Loading pending count"}
                  title={countLoaded ? `${pendingCount} pending approval${pendingCount !== 1 ? "s" : ""}` : "Loading…"}
                >
                  {!countLoaded && isAdmin ? "…" : pendingCount > 99 ? "99+" : pendingCount}
                </span>
              </NavLink>
              <NavLink
                to="/officers"
                className={({ isActive }) =>
                  "nav-link" + (isActive ? " active" : "")
                }
                onClick={handleLinkClick}
                title="Personnel directory"
              >
                <div className="sb-nav-link-icon">
                  <FaUsers />
                </div>
                Personnel directory
              </NavLink>
            </>
          )}

          {isAdmin && (
            <>
              <div className="sb-sidenav-menu-heading">Tasks</div>
              <NavLink
                to="/task-management"
                end
                className={({ isActive }) =>
                  "nav-link" + (isActive ? " active" : "")
                }
                onClick={handleLinkClick}
                title="Task list"
              >
                <div className="sb-nav-link-icon">
                  <FaList />
                </div>
                Task list
              </NavLink>
              <NavLink
                to="/task-management/create"
                className={({ isActive }) =>
                  "nav-link" + (isActive ? " active" : "")
                }
                onClick={handleLinkClick}
                title="Create task"
              >
                <div className="sb-nav-link-icon">
                  <FaPlus />
                </div>
                Create task
              </NavLink>
            </>
          )}
        </div>
      </div>

      <div className="sb-sidenav-footer">
        <div className="small">Logged in as:</div>
        <span className="fw-semibold">{user?.name || "User"}</span>
        {user?.role && (
          <span className="small text-muted d-block mt-1">
            {user.role === "admin" ? "Administrator" : user.role === "officer" ? "Personnel" : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </span>
        )}
      </div>
    </nav>
  );
};

export default Sidebar;