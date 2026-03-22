import React from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { SystemSettingsProvider } from "./contexts/SystemSettingsContext.jsx";
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
import Settings from "./pages/admin/Settings.jsx";
import ActivityLogs from "./pages/admin/ActivityLogs.jsx";
import MonitorOfficers from "./pages/admin/MonitorOfficers.jsx";
import Layout from "./layout/Layout.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import OfficerRoute from "./components/OfficerRoute.jsx";
import MyTasksPage from "./pages/personnel/MyTasksPage.jsx";
import CreateMyTaskPage from "./pages/personnel/CreateMyTaskPage.jsx";
import TaskDetailPage from "./pages/personnel/TaskDetailPage.jsx";
import AccomplishmentReportsPage from "./pages/personnel/AccomplishmentReportsPage.jsx";
import AccomplishmentReportDetailPage from "./pages/personnel/AccomplishmentReportDetailPage.jsx";
import Profile from "./pages/personnel/Profile.jsx";
import Calendar from "./pages/personnel/Calendar.jsx";
import FilesArchive from "./pages/personnel/FilesArchive.jsx";
import { ToastContainer } from "./services/notificationService.js";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
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
              path="monitor-officers"
              element={
                <AdminRoute>
                  <MonitorOfficers />
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
              path="settings"
              element={
                <AdminRoute>
                  <Settings />
                </AdminRoute>
              }
            />
            <Route
              path="activity-logs"
              element={
                <AdminRoute>
                  <ActivityLogs />
                </AdminRoute>
              }
            />
            <Route
              path="my-tasks"
              element={
                <OfficerRoute>
                  <MyTasksPage />
                </OfficerRoute>
              }
            />
            <Route
              path="my-tasks/create"
              element={
                <OfficerRoute>
                  <CreateMyTaskPage />
                </OfficerRoute>
              }
            />
            <Route
              path="my-tasks/:id"
              element={
                <OfficerRoute>
                  <TaskDetailPage />
                </OfficerRoute>
              }
            />
            <Route
              path="accomplishment-reports"
              element={
                <OfficerRoute>
                  <AccomplishmentReportsPage />
                </OfficerRoute>
              }
            />
            <Route
              path="accomplishment-reports/:id"
              element={
                <OfficerRoute>
                  <AccomplishmentReportDetailPage />
                </OfficerRoute>
              }
            />
            <Route
              path="profile"
              element={
                <OfficerRoute>
                  <Profile />
                </OfficerRoute>
              }
            />
            <Route
              path="calendar"
              element={
                <OfficerRoute>
                  <Calendar />
                </OfficerRoute>
              }
            />
            <Route
              path="files-archive"
              element={
                <OfficerRoute>
                  <FilesArchive />
                </OfficerRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
    </>
  )
);

const App = () => {
  return (
    <AuthProvider>
      <SystemSettingsProvider>
        <RouterProvider router={router} />
        <ToastContainer />
      </SystemSettingsProvider>
    </AuthProvider>
  );
};

export default App;
