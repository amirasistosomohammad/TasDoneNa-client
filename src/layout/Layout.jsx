import React, { useEffect, useState } from "react";
import Topbar from "./Topbar.jsx";
import Sidebar from "./Sidebar.jsx";
import Footer from "./Footer.jsx";

/**
 * Main app layout for authenticated routes.
 * Mirrors the CPC-style structure: fixed topbar, collapsible sidebar, footer.
 */
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          <Sidebar onCloseSidebar={handleCloseSidebar} />
        </div>
        <div id="layoutSidenav_content" onClick={handleMainClick}>
          <main className="layout-main">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Layout;