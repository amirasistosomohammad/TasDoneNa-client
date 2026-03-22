import React from "react";
import Swal from "sweetalert2";

/**
 * Professional Account Deactivated Modal
 * Displays deactivation information with consistent styling
 * Matches Account Rejection Modal layout and design
 */
export const showAccountDeactivatedModal = (reason = "", onClose = null) => {
  const hasReason = reason && reason.trim().length > 0;

  return Swal.fire({
    title: "",
    html: `
      <div class="account-rejection-modal">
        <div class="account-rejection-icon-wrapper">
          <div class="account-rejection-icon-circle">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#dc3545" stroke-width="2"/>
              <path d="M15 9L9 15M9 9L15 15" stroke="#dc3545" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
        
        <h2 class="account-rejection-title">Account Deactivated</h2>
        
        <div class="account-rejection-content">
          <p class="account-rejection-intro">
            Your account has been deactivated and you cannot sign in at this time.
          </p>
          
          ${hasReason ? `
            <div class="account-rejection-remarks-section">
              <div class="account-rejection-remarks-header">
                <div class="account-rejection-remarks-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#f54286"/>
                    <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="#f54286" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <span class="account-rejection-remarks-label">Deactivation Reason</span>
              </div>
              <div class="account-rejection-remarks-content">
                ${reason}
              </div>
            </div>
          ` : `
            <div class="account-rejection-no-remarks">
              <div class="account-rejection-no-remarks-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <p class="account-rejection-no-remarks-text">No specific reason provided.</p>
            </div>
          `}
          
          <div class="account-rejection-info-box">
            <div class="account-rejection-info-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#243047" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <p class="account-rejection-info-text">
              If you believe this is an error, please contact your system administrator for assistance.
            </p>
          </div>
        </div>
      </div>
    `,
    icon: null,
    showConfirmButton: true,
    confirmButtonText: "OK",
    confirmButtonColor: "#f54286",
    allowOutsideClick: false,
    allowEscapeKey: false,
    customClass: {
      popup: "account-rejection-modal-popup",
      container: "account-rejection-modal-container",
      htmlContainer: "account-rejection-modal-html",
      confirmButton: "account-rejection-modal-button",
    },
    buttonsStyling: false,
    didOpen: () => {
      // Add custom styles (reusing Account Rejection Modal styles)
      const style = document.createElement("style");
      style.textContent = `
        .account-rejection-modal-popup {
          max-width: 420px !important;
          width: 90% !important;
          padding: 0 !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
        }
        
        .account-rejection-modal {
          padding: 1.5rem 1.25rem 1.25rem 1.25rem;
          text-align: center;
        }
        
        .account-rejection-icon-wrapper {
          margin-bottom: 1rem;
        }
        
        .account-rejection-icon-circle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(220, 53, 69, 0.1) 0%, rgba(220, 53, 69, 0.05) 100%);
          border: 2px solid rgba(220, 53, 69, 0.2);
        }
        
        .account-rejection-icon-circle svg {
          width: 32px;
          height: 32px;
        }
        
        .account-rejection-title {
          font-size: 1.375rem;
          font-weight: 700;
          color: #dc3545;
          margin: 0 0 0.75rem 0;
          letter-spacing: -0.01em;
        }
        
        .account-rejection-content {
          text-align: left;
          margin-top: 1rem;
        }
        
        .account-rejection-intro {
          font-size: 0.9375rem;
          color: #243047;
          line-height: 1.6;
          margin: 0 0 1rem 0;
          text-align: center;
        }
        
        .account-rejection-remarks-section {
          background: linear-gradient(135deg, rgba(245, 66, 134, 0.05) 0%, rgba(245, 66, 134, 0.02) 100%);
          border: 1px solid rgba(245, 66, 134, 0.2);
          border-radius: 6px;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        
        .account-rejection-remarks-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.625rem;
        }
        
        .account-rejection-remarks-icon {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        
        .account-rejection-remarks-icon svg {
          width: 16px;
          height: 16px;
        }
        
        .account-rejection-remarks-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #f54286;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .account-rejection-remarks-content {
          font-size: 0.875rem;
          color: #243047;
          line-height: 1.6;
          padding-left: 1.5rem;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        
        .account-rejection-no-remarks {
          background: #f8f9fa;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 1rem;
          margin-bottom: 1rem;
          text-align: center;
        }
        
        .account-rejection-no-remarks-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
          opacity: 0.6;
        }
        
        .account-rejection-no-remarks-icon svg {
          width: 20px;
          height: 20px;
        }
        
        .account-rejection-no-remarks-text {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }
        
        .account-rejection-info-box {
          background: rgba(36, 48, 71, 0.03);
          border-left: 3px solid #243047;
          border-radius: 4px;
          padding: 0.75rem;
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
        }
        
        .account-rejection-info-icon {
          display: flex;
          align-items: flex-start;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }
        
        .account-rejection-info-icon svg {
          width: 16px;
          height: 16px;
        }
        
        .account-rejection-info-text {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.5;
          margin: 0;
          flex: 1;
        }
        
        .account-rejection-modal-button {
          background: linear-gradient(135deg, #f54286 0%, #d5326f 100%) !important;
          color: #fff !important;
          border: none !important;
          border-radius: 6px !important;
          padding: 0.6875rem 1.5rem !important;
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          transition: all 0.3s ease !important;
          box-shadow: none !important;
          margin-top: 0.75rem !important;
          width: 100% !important;
          max-width: 200px !important;
        }
        
        .account-rejection-modal-button:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 16px rgba(245, 66, 134, 0.4) !important;
        }
        
        .account-rejection-modal-button:active {
          transform: translateY(0) !important;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .account-rejection-modal-popup {
            width: 90% !important;
            max-width: 400px !important;
          }
          
          .account-rejection-modal {
            padding: 1.25rem 1rem 1rem 1rem;
          }
          
          .account-rejection-icon-circle {
            width: 52px;
            height: 52px;
          }
          
          .account-rejection-icon-circle svg {
            width: 30px;
            height: 30px;
          }
          
          .account-rejection-title {
            font-size: 1.25rem;
          }
          
          .account-rejection-remarks-section {
            padding: 0.875rem;
          }
          
          .account-rejection-remarks-content {
            padding-left: 0;
            margin-top: 0.5rem;
          }
          
          .account-rejection-info-box {
            padding: 0.6875rem;
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .account-rejection-info-icon {
            align-self: flex-start;
          }
          
          .account-rejection-modal-button {
            padding: 0.625rem 1.25rem !important;
            font-size: 0.8125rem !important;
            max-width: 180px !important;
          }
        }
        
        @media (max-width: 576px) {
          .account-rejection-modal-popup {
            width: 92% !important;
            max-width: 380px !important;
          }
          
          .account-rejection-modal {
            padding: 1rem 0.875rem 0.875rem 0.875rem;
          }
          
          .account-rejection-icon-circle {
            width: 48px;
            height: 48px;
          }
          
          .account-rejection-icon-circle svg {
            width: 28px;
            height: 28px;
          }
          
          .account-rejection-title {
            font-size: 1.125rem;
          }
          
          .account-rejection-intro {
            font-size: 0.875rem;
          }
          
          .account-rejection-remarks-section {
            padding: 0.75rem;
          }
          
          .account-rejection-remarks-label {
            font-size: 0.6875rem;
          }
          
          .account-rejection-remarks-content {
            font-size: 0.8125rem;
          }
          
          .account-rejection-modal-button {
            max-width: 160px !important;
          }
        }
        
        @media (min-width: 992px) {
          .account-rejection-modal-popup {
            max-width: 420px !important;
          }
        }
      `;
      document.head.appendChild(style);
    },
  }).then((result) => {
    if (onClose) {
      onClose();
    }
  });
};
