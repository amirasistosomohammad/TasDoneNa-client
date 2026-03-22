import React, { useEffect, useState } from "react";
import { useLocation, Outlet, useNavigate } from "react-router-dom";
import Topbar from "./Topbar.jsx";
import Sidebar from "./Sidebar.jsx";
import Footer from "./Footer.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { api } from "../services/api.js";
import { showToast, showAlert } from "../services/notificationService.js";
import { showAccountRejectionModal } from "../components/AccountRejectionModal.jsx";
import { showAccountDeactivatedModal } from "../components/AccountDeactivatedModal.jsx";
import OfficerPendingGate from "../components/OfficerPendingGate.jsx";

/**
 * Main app layout for authenticated routes.
 * Page transitions use pure CSS to avoid flash/duplicate animation issues.
 */
const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(null);
  const [systemSettings, setSystemSettings] = useState({
    app_name: "",
    logo_url: null,
  });
  const [systemSettingsLoading, setSystemSettingsLoading] = useState(true);

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

  // Listen for real-time status changes (approval/rejection)
  useEffect(() => {
    // Handle status approved event
    const handleStatusApproved = (e) => {
      showToast.success("Your account has been approved! You now have full access to the system.");
    };

    // Handle status rejected event
    const handleStatusRejected = (e) => {
      const reason = e.detail?.reason || "";
      showAccountRejectionModal(reason, () => {
        // Navigate to login after modal closes
        navigate("/login", { replace: true });
      });
    };

    // Handle status deactivated event
    const handleStatusDeactivated = (e) => {
      const reason = e.detail?.reason || "";
      showAccountDeactivatedModal(reason, () => {
        // Navigate to login after modal closes
        navigate("/login", { replace: true });
      });
    };

    // Add event listeners
    window.addEventListener("user-status-approved", handleStatusApproved);
    window.addEventListener("user-status-rejected", handleStatusRejected);
    window.addEventListener("user-status-deactivated", handleStatusDeactivated);

    // Cleanup: Remove event listeners
    return () => {
      window.removeEventListener("user-status-approved", handleStatusApproved);
      window.removeEventListener("user-status-rejected", handleStatusRejected);
      window.removeEventListener("user-status-deactivated", handleStatusDeactivated);
    };
  }, [navigate]);

  // Fetch system settings (logo, app name) for Topbar
  useEffect(() => {
    let cancelled = false;

    const loadSettings = async (withLoading) => {
      if (withLoading) setSystemSettingsLoading(true);
      try {
        const res = await api.get("/settings");
        if (cancelled) return;
        setSystemSettings({
          app_name: res?.app_name || "",
          logo_url: res?.logo_url || null,
        });
      } catch {
        if (cancelled) return;
        setSystemSettings((prev) => ({
          app_name: prev.app_name || "",
          logo_url: prev.logo_url || null,
        }));
      } finally {
        if (!cancelled && withLoading) setSystemSettingsLoading(false);
      }
    };

    // Initial load: show skeleton in topbar
    loadSettings(true);

    // When admin saves settings/logo, refresh without skeleton
    const handleSettingsUpdated = () => {
      loadSettings(false);
    };

    // Avoid refetching /settings on every browser tab focus — it duplicates SystemSettingsContext
    // and can spike the API (504s on slow / cold hosts). Event-driven refresh is enough.

    window.addEventListener("tasdonena-settings-updated", handleSettingsUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("tasdonena-settings-updated", handleSettingsUpdated);
    };
  }, []);

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
      <Topbar
        onToggleSidebar={handleToggleSidebar}
        appName={systemSettings.app_name}
        logoUrl={systemSettings.logo_url}
        settingsLoading={systemSettingsLoading}
      />
      <div id="layoutSidenav">
        <div id="layoutSidenav_nav">
          <Sidebar onCloseSidebar={handleCloseSidebar} pendingApprovalsCount={pendingApprovalsCount} />
        </div>
        <div id="layoutSidenav_content" onClick={handleMainClick}>
          <main className="layout-main">
            <OfficerPendingGate>
              <div key={location.pathname} className="page-transition-enter" style={{ minHeight: "100%" }}>
                <Outlet />
              </div>
            </OfficerPendingGate>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Layout;