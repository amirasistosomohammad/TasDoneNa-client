import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="layout-footer py-3 px-4 mt-auto">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center small text-muted">
        <div>© {currentYear} TasDoneNa. All rights reserved.</div>
        <div>v1.0.0 · Task Management System</div>
      </div>
    </footer>
  );
};

export default Footer;