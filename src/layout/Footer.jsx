import React from "react";
import { useSystemSettings } from "../contexts/SystemSettingsContext.jsx";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { appName, loading: settingsLoading } = useSystemSettings();

  return (
    <footer className="layout-footer py-3 px-4 mt-auto">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center small text-muted gap-2">
        <div className="d-flex align-items-center gap-2 flex-wrap justify-content-center justify-content-sm-start">
          {settingsLoading ? (
            <div className="footer-app-name-skeleton" />
          ) : (
            <span className="footer-app-name footer-text-fade-in">
              © {currentYear} {appName}. All rights reserved.
            </span>
          )}
        </div>
        {!settingsLoading && (
          <div className="footer-version footer-text-fade-in">v1.0.0 · Task Management System</div>
        )}
      </div>
    </footer>
  );
};

export default Footer;