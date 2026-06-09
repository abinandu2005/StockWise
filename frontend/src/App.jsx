import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute, GuestRoute, RoleRoute } from "@/routes/guards";
import { Toaster } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";

// Layouts
import AppLayout from "@/components/layout/AppLayout";
import AuthLayout from "@/components/layout/AuthLayout";

// Lazy-loaded Pages
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const InventoryPage = lazy(() => import("@/pages/InventoryPage"));
const PurchaseOrdersPage = lazy(() => import("@/pages/PurchaseOrdersPage"));
const SalesOrdersPage = lazy(() => import("@/pages/SalesOrdersPage"));
const SuppliersPage = lazy(() => import("@/pages/SuppliersPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const WarehousesPage = lazy(() => import("@/pages/WarehousesPage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const AuditLogsPage = lazy(() => import("@/pages/AuditLogsPage"));
const UsersPage = lazy(() => import("@/pages/UsersPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const StockReceivePage = lazy(() => import("@/pages/StockReceivePage"));
const StockAlertsPage = lazy(() => import("@/pages/StockAlertsPage"));
const MyActivityPage = lazy(() => import("@/pages/MyActivityPage"));
const RestockRequestsPage = lazy(() => import("@/pages/RestockRequestsPage"));

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
    <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading component...</p>
  </div>
);

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Landing Page - redirect to dashboard if already authenticated */}
                <Route path="/" element={<LandingOrDashboard />} />

                {/* Auth Routes */}
                <Route element={<GuestRoute><AuthLayout /></GuestRoute>}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                </Route>

                {/* Protected App Routes */}
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/stock-receive" element={<RoleRoute roles={["admin", "warehouse_staff", "purchase_manager"]}><StockReceivePage /></RoleRoute>} />
                  <Route path="/stock-alerts" element={<RoleRoute roles={["admin", "warehouse_staff"]}><StockAlertsPage /></RoleRoute>} />
                  <Route path="/my-activity" element={<RoleRoute roles={["admin", "warehouse_staff"]}><MyActivityPage /></RoleRoute>} />
                  <Route path="/purchase-orders" element={<RoleRoute roles={["admin", "purchase_manager"]}><PurchaseOrdersPage /></RoleRoute>} />
                  <Route path="/sales-orders" element={<RoleRoute roles={["admin", "purchase_manager", "warehouse_staff"]}><SalesOrdersPage /></RoleRoute>} />
                  <Route path="/restock-requests" element={<RoleRoute roles={["admin", "purchase_manager"]}><RestockRequestsPage /></RoleRoute>} />
                  <Route path="/suppliers" element={<RoleRoute roles={["admin", "purchase_manager"]}><SuppliersPage /></RoleRoute>} />
                  <Route path="/reports" element={<RoleRoute roles={["admin"]}><ReportsPage /></RoleRoute>} />
                  <Route path="/warehouses" element={<RoleRoute roles={["admin"]}><WarehousesPage /></RoleRoute>} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/audit-logs" element={<RoleRoute roles={["admin"]}><AuditLogsPage /></RoleRoute>} />
                  <Route path="/users" element={<RoleRoute roles={["admin"]}><UsersPage /></RoleRoute>} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<LandingPage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </DataProvider>
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </ThemeProvider>
  );
}

function LandingOrDashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null; // Wait for token validation before deciding
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}
