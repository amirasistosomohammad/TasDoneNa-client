import React from "react";
import { useSystemSettings } from "../../contexts/SystemSettingsContext.jsx";

const AuthFooter = () => {
  const currentYear = new Date().getFullYear();
  const { appName, loading: settingsLoading } = useSystemSettings();

  return (
    <footer className="auth-footer">
      <div className="auth-footer-container">
        <div className="auth-footer-content">
          {/* Copyright Section */}
          <div className="auth-footer-bottom">
            <div className="auth-footer-copyright">
              {settingsLoading ? (
                <p className="mb-0 d-flex justify-content-center">
                  <span className="auth-footer-text-skeleton" />
                </p>
              ) : (
                <p className="mb-0 auth-footer-text-fade-in">
                  © {currentYear} {appName} - Task Management System. All rights reserved.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          background: linear-gradient(
            145deg,
            var(--footer-bg-start) 0%,
            var(--footer-bg) 40%,
            var(--footer-bg-end) 100%
          );
          border-top: 3px solid var(--footer-accent);
          padding: 1rem 0;
          z-index: 100;
          box-shadow: 0 -2px 12px rgba(30, 58, 95, 0.06);
          min-height: 60px;
          display: flex;
          align-items: center;
        }

        .auth-footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .auth-footer-content {
          display: flex;
          flex-direction: column;
        }

        .auth-footer-bottom {
          text-align: center;
        }

        .auth-footer-copyright {
          color: var(--footer-text);
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .auth-footer-copyright p {
          margin: 0;
          color: var(--footer-text);
        }

        .auth-footer-copyright .small {
          font-size: 0.8125rem;
          opacity: 0.85;
        }

        /* Tablet Styles */
        @media (max-width: 992px) {
          .auth-footer {
            padding: 0.875rem 0;
          }

          .auth-footer-container {
            padding: 0 1.25rem;
          }

          .auth-footer-copyright {
            font-size: 0.8125rem;
          }
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .auth-footer {
            padding: 0.75rem 0;
          }

          .auth-footer-container {
            padding: 0 1rem;
          }

          .auth-footer-copyright {
            font-size: 0.75rem;
            line-height: 1.4;
          }
        }

        /* Small Mobile Styles */
        @media (max-width: 576px) {
          .auth-footer {
            padding: 0.625rem 0;
          }

          .auth-footer-container {
            padding: 0 0.875rem;
          }

          .auth-footer-copyright {
            font-size: 0.6875rem;
          }
        }
      `}</style>
    </footer>
  );
};

export default AuthFooter;
