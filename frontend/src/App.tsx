import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute, GuestRoute, RoleRoute } from "@/routes/guards";
import { Toaster } from "sonner";
import { DataProvider } from "@/context/DataContext";

// Layouts
import AppLayout from "@/components/layout/AppLayout";
import AuthLayout from "@/components/layout/AuthLayout";

// Pages
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import InventoryPage from "@/pages/InventoryPage";
import PurchaseOrdersPage from "@/pages/PurchaseOrdersPage";
import SalesOrdersPage from "@/pages/SalesOrdersPage";
import SuppliersPage from "@/pages/SuppliersPage";
import ReportsPage from "@/pages/ReportsPage";
import WarehousesPage from "@/pages/WarehousesPage";
import NotificationsPage from "@/pages/NotificationsPage";
import AuditLogsPage from "@/pages/AuditLogsPage";
import UsersPage from "@/pages/UsersPage";
import SettingsPage from "@/pages/SettingsPage";
import StockReceivePage from "@/pages/StockReceivePage";
import StockAlertsPage from "@/pages/StockAlertsPage";
import MyActivityPage from "@/pages/MyActivityPage";
import RestockRequestsPage from "@/pages/RestockRequestsPage";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Landing Page */}
              <Route path="/" element={<LandingPage />} />

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
          </BrowserRouter>
        </DataProvider>
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </ThemeProvider>
  );
}
