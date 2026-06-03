import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { User, UserRole, AuthState } from "@/types";
import { toast } from "sonner";

// Initial seed users with passwords
const INITIAL_USERS = [
  {
    id: "1",
    email: "admin@stockwise.com",
    name: "Abinandu R S",
    role: "admin",
    status: "active",
    password: "admin123",
    companyName: "StockWise Headquarters",
    employeeId: "EMP-001",
    createdAt: "2024-01-15",
    lastLogin: "2026-05-20",
  },
  {
    id: "2",
    email: "staff@stockwise.com",
    name: "Tareef",
    role: "warehouse_staff",
    status: "active",
    password: "staff123",
    companyName: "Central Warehouse A",
    employeeId: "EMP-002",
    createdAt: "2024-03-20",
    lastLogin: "2026-05-20",
  },
  {
    id: "3",
    email: "manager@stockwise.com",
    name: "Velan M",
    role: "purchase_manager",
    status: "active",
    password: "manager123",
    companyName: "Sourcing Center East",
    employeeId: "EMP-003",
    createdAt: "2024-02-10",
    lastLogin: "2026-05-20",
  },
  {
    id: "4",
    email: "chris@stockwise.com",
    name: "Kamesh",
    role: "warehouse_staff",
    status: "inactive",
    password: "staff123",
    companyName: "Central Warehouse A",
    employeeId: "EMP-004",
    createdAt: "2024-06-10",
    lastLogin: "2026-06-10",
  },
];

interface AuthContextType extends AuthState {
  users: User[];
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    companyName: string,
    employeeId: string
  ) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  addUser: (user: Omit<User, "id" | "createdAt"> & { password?: string }) => void;
  updateUser: (id: string, updates: Partial<User & { password?: string }>) => void;
  deleteUser: (id: string) => void;
  approveUser: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Permission mapping per role
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    "manage_warehouses",
    "manage_users",
    "access_audit_logs",
    "view_analytics",
    "manage_inventory",
    "manage_suppliers",
    "manage_orders",
    "view_reports",
    "manage_settings",
  ],
  warehouse_staff: ["manage_inventory", "scan_stock", "update_quantities", "view_inventory", "receive_shipments", "view_stock_alerts", "view_own_activity", "dispatch_sales"],
  purchase_manager: [
    "manage_suppliers",
    "create_purchase_orders",
    "manage_orders",
    "track_deliveries",
    "view_analytics",
    "view_upcoming_shipments",
    "view_restock_requests",
  ],
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<any[]>(() => {
    const stored = localStorage.getItem("stockwise-users");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return INITIAL_USERS;
      }
    }
    localStorage.setItem("stockwise-users", JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  });

  const [state, setState] = useState<AuthState>(() => {
    const stored = localStorage.getItem("stockwise-auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...parsed, isLoading: false };
      } catch {
        return { user: null, token: null, isAuthenticated: false, isLoading: false };
      }
    }
    return { user: null, token: null, isAuthenticated: false, isLoading: false };
  });

  // Sync users to localStorage
  useEffect(() => {
    localStorage.setItem("stockwise-users", JSON.stringify(users));
  }, [users]);

  const persistAuth = useCallback((user: User, token: string) => {
    const authData = { user, token, isAuthenticated: true, isLoading: false };
    localStorage.setItem("stockwise-auth", JSON.stringify(authData));
    setState(authData);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      // Simulate API call delay
      await new Promise((r) => setTimeout(r, 600));

      const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!found) {
        throw new Error("Invalid email or password");
      }
      // If password missing (e.g., from stale localStorage), fallback to default credentials based on email
      const expectedPassword = found.password ?? (function () {
        const defaults: Record<string, string> = {
          "admin@stockwise.com": "admin123",
          "staff@stockwise.com": "staff123",
          "manager@stockwise.com": "manager123",
        };
        return defaults[found.email.toLowerCase()] ?? "";
      })();
      if (expectedPassword !== password) {
        throw new Error("Invalid email or password");
      }


      if (found.status === "pending") {
        throw new Error("Your account is pending approval by the Admin. Please try again later.");
      }

      if (found.status === "inactive") {
        throw new Error("Your account has been deactivated. Please contact the system administrator.");
      }

      // Update last login only after successful authentication
      setUsers((prev) =>
        prev.map((u) =>
          u.id === found.id ? { ...u, lastLogin: new Date().toISOString().split("T")[0] } : u
        )
      );

      const token = `mock-jwt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const userObj: User = {
        id: found.id,
        email: found.email,
        name: found.name,
        role: found.role,
        companyName: found.companyName,
        employeeId: found.employeeId,
        status: found.status,
        createdAt: found.createdAt,
        lastLogin: found.lastLogin,
      };

      persistAuth(userObj, token);
      toast.success(`Welcome back, ${found.name}!`);
    },
    [users, persistAuth]
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      role: UserRole,
      companyName: string,
      employeeId: string
    ) => {
      await new Promise((r) => setTimeout(r, 600));

      const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        throw new Error("Email already registered");
      }

      const newUser = {
        id: Math.random().toString(36).slice(2),
        name,
        email,
        password,
        role,
        companyName,
        employeeId,
        status: "pending", // Always pending upon self-registration
        createdAt: new Date().toISOString().split("T")[0],
      };

      setUsers((prev) => [...prev, newUser]);

      // Directly add to local storage notifications and activity logs
      const existingNotifs = JSON.parse(localStorage.getItem("stockwise-notifications") || "[]");
      const newNotif = {
        id: Math.random().toString(36).slice(2),
        title: "New Signup Pending",
        message: `${name} registered as ${role.replace("_", " ")} (ID: ${employeeId}). Needs verification.`,
        type: "warning",
        read: false,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("stockwise-notifications", JSON.stringify([newNotif, ...existingNotifs]));

      const existingLogs = JSON.parse(localStorage.getItem("stockwise-activity-logs") || "[]");
      const newLog = {
        id: Math.random().toString(36).slice(2),
        action: "User Registered",
        description: `${name} signed up as a ${role.replace("_", " ")} (pending approval).`,
        user: name,
        timestamp: new Date().toISOString(),
        type: "user",
      };
      localStorage.setItem("stockwise-activity-logs", JSON.stringify([newLog, ...existingLogs]));
    },
    [users]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("stockwise-auth");
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    toast.info("Logged out successfully.");
  }, []);

  const hasPermission = useCallback(
    (permission: string) => {
      if (!state.user) return false;
      return ROLE_PERMISSIONS[state.user.role]?.includes(permission) ?? false;
    },
    [state.user]
  );

  // Admin User Management Operations
  const addUser = useCallback((newUserRaw: Omit<User, "id" | "createdAt"> & { password?: string }) => {
    const newUser = {
      ...newUserRaw,
      id: Math.random().toString(36).slice(2),
      password: newUserRaw.password || "staff123",
      createdAt: new Date().toISOString().split("T")[0],
      status: newUserRaw.status || "active",
    };
    setUsers((prev) => [...prev, newUser]);
    toast.success(`User "${newUser.name}" added successfully.`);
  }, []);

  const updateUser = useCallback((id: string, updates: Partial<User & { password?: string }>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));

    setState((curr) => {
      if (curr.user && curr.user.id === id) {
        const updatedUser = { ...curr.user, ...updates };
        delete (updatedUser as any).password;
        const nextAuth = { ...curr, user: updatedUser };
        localStorage.setItem("stockwise-auth", JSON.stringify(nextAuth));
        return nextAuth;
      }
      return curr;
    });

    toast.success("User details updated.");
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast.success("User deleted successfully.");
  }, []);

  const approveUser = useCallback((id: string) => {
    let uName = "";
    let uRole = "";
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        uName = u.name;
        uRole = u.role;
        return { ...u, status: "active" };
      })
    );

    // Add notification and log
    const existingNotifs = JSON.parse(localStorage.getItem("stockwise-notifications") || "[]");
    const newNotif = {
      id: Math.random().toString(36).slice(2),
      title: "Account Approved",
      message: `${uName} has been approved as ${uRole.replace("_", " ")}.`,
      type: "success",
      read: false,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("stockwise-notifications", JSON.stringify([newNotif, ...existingNotifs]));

    toast.success(`User "${uName}" approved successfully.`);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        users,
        login,
        register,
        logout,
        hasPermission,
        addUser,
        updateUser,
        deleteUser,
        approveUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
