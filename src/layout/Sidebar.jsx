import React from "react";
import { NavLink } from "react-router-dom";
import { FaTachometerAlt, FaList, FaPlus, FaUserCheck, FaUsers, FaDesktop, FaCog, FaFileAlt, FaUser, FaHistory, FaCalendarAlt, FaArchive } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext.jsx";

/**
 * Application sidebar.
 * Pending count comes from Layout so the real amount is loaded as soon as the app opens (even when sidebar is closed).
 */
const Sidebar = ({ onCloseSidebar, pendingApprovalsCount }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isOfficer = user?.role === "officer";
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
          <div className="sb-sidenav-menu-heading">Overview</div>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              "nav-link sb-sidebar-nav-item d-flex align-items-center flex-nowrap" + (isActive ? " active" : "")
            }
            onClick={handleLinkClick}
          >
            <div className="sb-nav-link-icon flex-shrink-0">
              <FaTachometerAlt />
            </div>
            <span className="sb-sidebar-nav-link-label">Dashboard</span>
          </NavLink>

          {isAdmin && (
            <>
              <div className="sb-sidenav-menu-heading">Administration</div>
              <NavLink
                to="/account-approvals"
                className={({ isActive }) =>
                  "nav-link sb-sidebar-link-with-badge sb-sidebar-nav-item d-flex align-items-center flex-nowrap" + (isActive ? " active" : "")
                }
                onClick={handleLinkClick}
                title="Account requests"
              >
                <span className="sb-sidebar-nav-link-text d-flex align-items-center min-w-0">
                  <div className="sb-nav-link-icon flex-shrink-0">
                    <FaUserCheck />
                  </div>
                  <span className="sb-sidebar-nav-link-label text-truncate">Account requests</span>
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
                  "nav-link sb-sidebar-nav-item d-flex align-items-center flex-nowrap" + (isActive ? " active" : "")
                }
                onClick={handleLinkClick}
                title="Personnel directory"
              >
                <div className="sb-nav-link-icon flex-shrink-0">
                  <FaUsers />
                </div>
                <span className="sb-sidebar-nav-link-label">Personnel directory</span>
              </NavLink>
              <div className="sb-sidenav-menu-heading">Monitoring</div>
              <NavLink
                to="/monitor-officers"
                className={({ isActive }) =>
                  "nav-link sb-sidebar-nav-item d-flex align-items-center flex-nowrap" + (isActive ? " active" : "")
                }
                onClick={handleLinkClick}
                title="Monitor personnel"
              >
                <div className="sb-nav-link-icon flex-shrink-0">
                  <FaDesktop />
                </div>
                <span className="sb-sidebar-nav-link-label">Monitor personnel</span>
              </NavLink>
            </>
          )}

          {isOfficer && (
            <>
              <div className="sb-sidenav-menu-heading">Work & deliverables</div>
              <NavLink
                to="/my-tasks"
                end
                className={({ isActive }) =>
                  "nav-link sb-sidebar-nav-item d-flex align-items-center flex-nowrap" + (isActive ? " active" : "")
                }
                onClick={handleLinkClick}
                title="Task schedule"
              >
                <div className="sb-nav-link-icon flex-shrink-0">
                  <FaList />
                </div>
                <span className="sb-sidebar-nav-link-label">Task schedule</span>
              </NavLink>
              <NavLink
                to="/my-tasks/create"
                className={({ isActive }) =>
                  "nav-link sb-sidebar-nav-item d-flex align-items-center flex-nowrap" + (isActive ? " active" : "")
                }
                onClick={handleLinkClick}
                title="Create task"
              >
                <div className="sb-nav-link-icon flex-shrink-0">
                  <FaPlus />
                </div>
                <span className="sb-sidebar-nav-link-label">Create task</span>
              </NavLink>
              <div className="sb-sidenav-menu-heading">Reports & records</div>
              <NavLink
                to="/accomplishment-reports"
                end
                className={({ isActive }) =>
                  "nav-link sb-sidebar-nav-item d-flex align-items-center flex-nowrap" + (isActive ? " active" : "")
                }
                onClick={handleLinkClick}
                title="Accomplishment reports"
              >
                <div className="sb-nav-link-icon flex-shrink-0">
                  <FaFileAlt />
                </div>
                <span className="sb-sidebar-nav-link-label">Accomplishment reports</span>
              </NavLink>
              <NavLink
                to="/calendar"
                className={({ isActive }) =>
                  "nav-link sb-sidebar-nav-item d-flex align-items-center flex-nowrap" + (isActive ? " active" : "")
                }
                onClick={handleLinkClick}
                title="Work calendar"
              >
                <div className="sb-nav-link-icon flex-shrink-0">
                  <FaCalendarAlt />
                </div>
                <span className="sb-sidebar-nav-link-label">Work calendar</span>
              </NavLink>
              <NavLink
                to="/files-archive"
                className={({ isActive }) =>
                  "nav-link sb-sidebar-nav-item d-flex align-items-center flex-nowrap" + (isActive ? " active" : "")
                }
                onClick={handleLinkClick}
                title="Document archive"
              >
                <div className="sb-nav-link-icon flex-shrink-0">
                  <FaArchive />
                </div>
                <span className="sb-sidebar-nav-link-label">Document archive</span>
              </NavLink>
              <div className="sb-sidenav-menu-heading">My account</div>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  "nav-link sb-sidebar-nav-item d-flex align-items-center flex-nowrap" + (isActive ? " active" : "")
                }
                onClick={handleLinkClick}
                title="My profile"
              >
                <div className="sb-nav-link-icon flex-shrink-0">
                  <FaUser />
                </div>
                <span className="sb-sidebar-nav-link-label">My profile</span>
              </NavLink>
            </>
          )}

          {isAdmin && (
            <>
              <div className="sb-sidenav-menu-heading">Reports & compliance</div>
              <NavLink
                to="/admin/accomplishment-reports"
                end
                className={({ isActive }) =>
                  "nav-link sb-sidebar-nav-item d-flex align-items-center flex-nowrap" + (isActive ? " active" : "")
                }
                onClick={handleLinkClick}
                title="Accomplishment reports"
              >
                <div className="sb-nav-link-icon flex-shrink-0">
                  <FaFileAlt />
                </div>
                <span className="sb-sidebar-nav-link-label">Accomplishment reports</span>
              </NavLink>
              <div className="sb-sidenav-menu-heading">System</div>
              <NavLink
                to="/activity-logs"
                className={({ isActive }) =>
                  "nav-link sb-sidebar-nav-item d-flex align-items-center flex-nowrap" + (isActive ? " active" : "")
                }
                onClick={handleLinkClick}
                title="Activity logs"
              >
                <div className="sb-nav-link-icon flex-shrink-0">
                  <FaHistory />
                </div>
                <span className="sb-sidebar-nav-link-label">Activity logs</span>
              </NavLink>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  "nav-link sb-sidebar-nav-item d-flex align-items-center flex-nowrap" + (isActive ? " active" : "")
                }
                onClick={handleLinkClick}
                title="Settings"
              >
                <div className="sb-nav-link-icon flex-shrink-0">
                  <FaCog />
                </div>
                <span className="sb-sidebar-nav-link-label">System settings</span>
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