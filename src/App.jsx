import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicRoute from "./components/PublicRoute.jsx";
import Login from "./pages/public/Login.jsx";
import Register from "./pages/public/Register.jsx";
import VerifyEmail from "./pages/public/VerifyEmail.jsx";
import ForgotPassword from "./pages/public/ForgotPassword.jsx";
import ResetPassword from "./pages/public/ResetPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AccountApprovals from "./pages/admin/AccountApprovals.jsx";
import Officers from "./pages/admin/Officers.jsx";
import TaskListPage from "./pages/admin/TaskListPage.jsx";
import CreateTaskPage from "./pages/admin/CreateTaskPage.jsx";
import Layout from "./layout/Layout.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import { ToastContainer } from "./services/notificationService.js";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/verify-email"
            element={
              <PublicRoute>
                <VerifyEmail />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />
          {/* Single layout route: Layout stays mounted; only Outlet (page) changes – enables Framer Motion page transitions */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route
              path="account-approvals"
              element={
                <AdminRoute>
                  <AccountApprovals />
                </AdminRoute>
              }
            />
            <Route
              path="officers"
              element={
                <AdminRoute>
                  <Officers />
                </AdminRoute>
              }
            />
            <Route
              path="task-management"
              element={
                <AdminRoute>
                  <TaskListPage />
                </AdminRoute>
              }
            />
            <Route
              path="task-management/create"
              element={
                <AdminRoute>
                  <CreateTaskPage />
                </AdminRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
