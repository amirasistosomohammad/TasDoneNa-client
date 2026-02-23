// src/services/notificationService.js
// Copied from BRIMS-client with theme preserved

import Swal from "sweetalert2";
import { toast } from "react-toastify";

// SweetAlert2 helper API
export const showAlert = {
  success: (title, text = "", timer = 3000) => {
    return Swal.fire({
      title,
      text,
      icon: "success",
      timer,
      timerProgressBar: true,
      showConfirmButton: false,
      background: "#fff",
      color: "#2d5a27",
      iconColor: "#2d5a27",
    });
  },

  error: (title, text = "", timer = 4000) => {
    return Swal.fire({
      title,
      text,
      icon: "error",
      timer,
      timerProgressBar: true,
      background: "#fff",
      color: "#2d5a27",
      confirmButtonColor: "#2d5a27",
      iconColor: "#dc3545",
    });
  },

  warning: (title, text = "", timer = 3000) => {
    return Swal.fire({
      title,
      text,
      icon: "warning",
      timer,
      timerProgressBar: true,
      showConfirmButton: false,
      background: "#fff",
      color: "#2d5a27",
      iconColor: "#ffc107",
    });
  },

  info: (
    title,
    htmlContent = "",
    confirmButtonText = "Close",
    timer = null,
  ) => {
    return Swal.fire({
      title,
      html: htmlContent,
      icon: "info",
      timer: timer,
      timerProgressBar: !!timer,
      showConfirmButton: true,
      confirmButtonText,
      confirmButtonColor: "#2d5a27",
      background: "#fff",
      color: "#2d5a27",
    });
  },

  confirm: (
    title,
    text = "",
    confirmButtonText = "Yes",
    cancelButtonText = "Cancel",
  ) => {
    return Swal.fire({
      title,
      text,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2d5a27",
      cancelButtonColor: "#6c757d",
      confirmButtonText,
      cancelButtonText,
      background: "#fff",
      color: "#2d5a27",
      iconColor: "#2d5a27",
    });
  },

  loading: (title = "Loading...") => {
    return Swal.fire({
      title,
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      showConfirmButton: false,
      background: "#fff",
      color: "#2d5a27",
      didOpen: () => {
        Swal.showLoading();
      },
    });
  },

  close: () => {
    Swal.close();
  },
};

// Toastify helper API
export const showToast = {
  success: (message, autoClose = 3000) => {
    toast.success(message, {
      position: "top-right",
      autoClose,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      style: {
        background: "#f8fff9",
        color: "#2d5a27",
        border: "1px solid #d4edda",
        borderRadius: "8px",
        fontWeight: "500",
      },
      progressStyle: {
        background: "#2d5a27",
      },
    });
  },

  error: (message, autoClose = 4000) => {
    toast.error(message, {
      position: "top-right",
      autoClose,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      style: {
        background: "#fff5f5",
        color: "#dc3545",
        border: "1px solid #f8d7da",
        borderRadius: "8px",
        fontWeight: "500",
      },
      progressStyle: {
        background: "#dc3545",
      },
    });
  },
};

// ToastContainer re-export
export { ToastContainer } from "react-toastify";
