import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// Blocks unauthenticated users — sends them to / (landing page)
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children ? <>{children}</> : <Outlet />;
}

// Blocks already-authenticated users — sends them to /dashboard
export function GuestRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children ? <>{children}</> : <Outlet />;
}

// Role-based access within protected routes
export function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
