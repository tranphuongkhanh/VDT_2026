import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, Outlet } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import ProtectedRoute from './components/shared/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RequestsPage from './pages/RequestsPage';
import ApprovalsPage from './pages/ApprovalsPage';
import WorkflowsPage from './pages/WorkflowsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import DepartmentsPage from './pages/DepartmentsPage';
import RequestTypesPage from './pages/RequestTypesPage';
import AuditLogPage from './pages/AuditLogPage';
import CategoryPage from './pages/CategoryPage';
import { ROLES } from './utils/constants';

export default function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* ── Public routes ── */}
            <Route path="/login" element={<LoginPage />} />

            {/* ── Protected layout routes ── */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="requests" element={<RequestsPage />} />

              {/* Any authenticated user — backend tự lọc theo approver logic */}
              <Route path="approvals" element={<ApprovalsPage />} />

              {/* Chỉ ADMIN theo README */}
              <Route path="admin" element={<ProtectedRoute roles={[ROLES.ADMIN]}><Outlet /></ProtectedRoute>}>
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="departments" element={<DepartmentsPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="categories" element={<CategoryPage />} />
                <Route path="request-types" element={<RequestTypesPage />} />
                <Route path="audit-log" element={<AuditLogPage />} />
              </Route>

              {/* Vẫn thuộc Admin */}
              <Route
                path="workflows"
                element={
                  <ProtectedRoute roles={[ROLES.ADMIN]}>
                    <WorkflowsPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
