import React, { useEffect, useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import Topbar from "./Topbar.jsx";
import Sidebar from "./Sidebar.jsx";
import Footer from "./Footer.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { api } from "../services/api.js";

/**
 * Main app layout for authenticated routes.
 * Page transitions use pure CSS to avoid flash/duplicate animation issues.
 */
const Layout = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(null);

  // Fetch pending count as soon as layout loads (admin only) so badge shows real amount even when sidebar is closed
  useEffect(() => {
    if (user?.role !== "admin") {
      setPendingApprovalsCount(0);
      return;
    }
    let cancelled = false;
    api
      .get("/admin/pending-users")
      .then((data) => {
        if (!cancelled) setPendingApprovalsCount((data.users || []).length);
      })
      .catch(() => {
        if (!cancelled) setPendingApprovalsCount(0);
      });
    const handler = (e) => {
      if (e.detail?.count !== undefined && !cancelled) setPendingApprovalsCount(e.detail.count);
    };
    window.addEventListener("account-approvals-updated", handler);
    return () => {
      cancelled = true;
      window.removeEventListener("account-approvals-updated", handler);
    };
  }, [user?.role]);

  // Apply / remove body class used for responsive sidebar toggle
  useEffect(() => {
    const body = document.body;
    if (sidebarOpen) {
      body.classList.add("sb-sidenav-toggled");
    } else {
      body.classList.remove("sb-sidenav-toggled");
    }
    return () => {
      body.classList.remove("sb-sidenav-toggled");
    };
  }, [sidebarOpen]);

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  const handleMainClick = () => {
    if (window.innerWidth < 768 && sidebarOpen) {
      handleCloseSidebar();
    }
  };

  return (
    <div className="sb-nav-fixed">
      <Topbar onToggleSidebar={handleToggleSidebar} />
      <div id="layoutSidenav">
        <div id="layoutSidenav_nav">
          <Sidebar onCloseSidebar={handleCloseSidebar} pendingApprovalsCount={pendingApprovalsCount} />
        </div>
        <div id="layoutSidenav_content" onClick={handleMainClick}>
          <main className="layout-main">
            <div key={location.pathname} className="page-transition-enter" style={{ minHeight: "100%" }}>
              <Outlet />
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Layout;