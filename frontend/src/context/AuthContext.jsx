import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { authApi, get, put, del, post } from "@/lib/api";
import { toast } from "sonner";

// ── Role mapping: backend enum → frontend string ──────────────
const ROLE_MAP = {
  ADMIN: "admin",
  PURCHASE_MANAGER: "purchase_manager",
  WAREHOUSE_STAFF: "warehouse_staff",
};

// ── Permission mapping per role ───────────────────────────────
const ROLE_PERMISSIONS = {
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
  warehouse_staff: [
    "manage_inventory",
    "scan_stock",
    "update_quantities",
    "view_inventory",
    "receive_shipments",
    "view_stock_alerts",
    "view_own_activity",
    "dispatch_sales",
  ],
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

const AuthContext = createContext(undefined);

// ── Persist helpers ───────────────────────────────────────────
const STORAGE_KEY = "stockwise-auth";

function saveSession(user, token, refreshToken) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ user, token, refreshToken, isAuthenticated: true })
  );
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.token && parsed?.user) return parsed;
    return null;
  } catch {
    return null;
  }
}

// ── Map backend user → frontend User ─────────────────────────
function mapUser(backendUser) {
  return {
    id: String(backendUser.id),
    name: backendUser.fullName,
    email: backendUser.email,
    role: ROLE_MAP[backendUser.role] ?? "warehouse_staff",
    status: (backendUser.isActive ?? backendUser.active) ? "active" : "inactive",
    lastLogin: backendUser.lastLogin || null,
    createdAt: backendUser.createdAt || new Date().toISOString().split("T")[0],
    employeeId: backendUser.employeeId || "",
    companyName: backendUser.companyName || "",
  };
}

// ── Provider ──────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [state, setState] = useState(() => {
    const session = loadSession();
    if (session) {
      return {
        user: session.user,
        token: session.token,
        isAuthenticated: true,
        isLoading: false,
      };
    }
    return { user: null, token: null, isAuthenticated: false, isLoading: false };
  });

  const [users, setUsers] = useState([]);
  
  const usersFetchInitiated = useRef(null);
  const meFetchInitiated = useRef(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await get("/users");
      const list = res.data?.content || res.data || [];
      const mapped = list.map(u => ({
        id: String(u.id),
        name: u.fullName,
        email: u.email,
        role: ROLE_MAP[u.role] ?? "warehouse_staff",
        // pending = email verified but not yet admin-approved (enabled=true, isActive=false)
        // inactive = not yet email-verified (enabled=false)
        // active   = fully approved
        status: (u.isActive ?? u.active)
          ? "active"
          : u.enabled
            ? "pending"
            : "inactive",
        employeeId: u.employeeId || `EMP-${1000 + u.id}`,
        companyName: u.companyName || "StockWise Network",
        lastLogin: u.lastLogin || null,
        createdAt: u.createdAt || new Date().toISOString().split("T")[0]
      }));
      setUsers(mapped);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  }, []);

  // Clear users state on logout
  useEffect(() => {
    if (!state.isAuthenticated) {
      setUsers([]);
      usersFetchInitiated.current = null;
    }
  }, [state.isAuthenticated]);

  // On mount: validate stored token. If expired, attempt a silent refresh first.
  useEffect(() => {
    const session = loadSession();
    if (!session) return;

    if (meFetchInitiated.current) return;
    meFetchInitiated.current = true;

    const validateSession = async () => {
      try {
        const res = await authApi.me();
        const user = mapUser(res.data);
        setState({ user, token: session.token, isAuthenticated: true, isLoading: false });
        saveSession(user, session.token, session.refreshToken);
      } catch {
        // Access token invalid/expired — try refresh-token silently
        if (session.refreshToken) {
          try {
            const refreshRes = await authApi.refresh(session.refreshToken);
            const newToken = refreshRes?.data?.accessToken;
            const newRefreshToken = refreshRes?.data?.refreshToken ?? session.refreshToken;
            if (newToken) {
              // Retry /me with the new access token now stored by api.js
              const retryRes = await authApi.me();
              const user = mapUser(retryRes.data);
              setState({ user, token: newToken, isAuthenticated: true, isLoading: false });
              saveSession(user, newToken, newRefreshToken);
              return;
            }
          } catch {
            // Refresh token also expired or invalid — fall through to clear
          }
        }
        // Both tokens failed — clear session and force re-login
        clearSession();
        meFetchInitiated.current = false;
        setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    };

    validateSession();
  }, []);

  // Listen for session-expired events dispatched by the API client
  // (triggered when a refresh attempt fails on any in-flight request)
  useEffect(() => {
    const handleExpiry = () => {
      clearSession();
      meFetchInitiated.current = false;
      setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    };
    window.addEventListener("stockwise:session-expired", handleExpiry);
    return () => window.removeEventListener("stockwise:session-expired", handleExpiry);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    const authData = res.data;
    const user = mapUser(authData.user);
    saveSession(user, authData.accessToken, authData.refreshToken);
    setState({ user, token: authData.accessToken, isAuthenticated: true, isLoading: false });
    toast.success(`Welcome back, ${user.name}!`);
  }, []);

  const register = useCallback(
    async (name, email, password, role, phoneNumber) => {
      // Map frontend role → backend enum
      const BACKEND_ROLE = {
        admin: "ADMIN",
        purchase_manager: "PURCHASE_MANAGER",
        warehouse_staff: "WAREHOUSE_STAFF",
      };

      await authApi.register({
        fullName: name,
        email,
        password,
        role: BACKEND_ROLE[role],
        phoneNumber,
      });

      toast.success("Registration successful! Please sign in.");
    },
    []
  );

  const addUser = useCallback(async (newUser) => {
    try {
      const BACKEND_ROLE = {
        admin: "ADMIN",
        purchase_manager: "PURCHASE_MANAGER",
        warehouse_staff: "WAREHOUSE_STAFF",
      };
      // Use the admin-create endpoint — bypasses OTP email verification entirely
      // so users created by admin can login immediately
      await post("/users/admin-create", {
        fullName: newUser.name,
        email: newUser.email,
        password: newUser.password || "StockWise@123",
        role: BACKEND_ROLE[newUser.role],
        phoneNumber: "+1234567890",
        employeeId: newUser.employeeId,
        companyName: newUser.companyName,
        isActive: newUser.status === "active" || newUser.status === undefined,
        active: newUser.status === "active" || newUser.status === undefined,
      });
      toast.success(`User "${newUser.name}" added successfully. They can login immediately.`);
      // Audit log
      await post("/analytics/audit-logs", {
        action: "USER_CREATED",
        module: "USER_MANAGEMENT",
        description: `New user '${newUser.name}' (${newUser.role?.replace("_", " ")}) created by admin with email ${newUser.email}`,
        entityId: newUser.email,
      }).catch(() => {});
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add user: " + err.message);
    }
  }, [fetchUsers]);

  const updateUser = useCallback(async (id, updates) => {
    try {
      const BACKEND_ROLE = {
        admin: "ADMIN",
        purchase_manager: "PURCHASE_MANAGER",
        warehouse_staff: "WAREHOUSE_STAFF",
      };
      const payload = {};
      if (updates.name !== undefined) payload.fullName = updates.name;
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.role !== undefined) payload.role = BACKEND_ROLE[updates.role];
      if (updates.status !== undefined) {
        payload.isActive = updates.status === "active";
        payload.active = updates.status === "active";
      }
      if (updates.employeeId !== undefined) payload.employeeId = updates.employeeId;
      if (updates.companyName !== undefined) payload.companyName = updates.companyName;

      if (updates.password) {
        payload.password = updates.password;
      }
      const res = await put(`/users/${id}`, payload);
      toast.success("User details updated.");

      // API returns ApiResponse<UserResponse>: { success, message, data: UserResponse }
      const rawUser = res?.data || res;

      // Audit log for user management changes
      await post("/analytics/audit-logs", {
        action: "USER_UPDATED",
        module: "USER_MANAGEMENT",
        description: `User ID ${id} updated — fields: ${Object.keys(updates).join(", ")}`,
        entityId: String(id),
      }).catch(() => {});

      // If the updated user is the current logged-in user, update local session state
      setState(prev => {
        if (prev.user && prev.user.id === String(id)) {
          const updatedUser = rawUser && rawUser.id ? mapUser(rawUser) : prev.user;
          const newUserObj = { ...prev.user, ...updatedUser };
          const session = loadSession();
          if (session) {
            saveSession(newUserObj, session.token, session.refreshToken);
          }
          return {
            ...prev,
            user: newUserObj
          };
        }
        return prev;
      });

      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update user: " + err.message);
    }
  }, [fetchUsers]);

  const deleteUser = useCallback(async (id) => {
    try {
      const userObj = users.find(u => u.id === id);
      await del(`/users/${id}`);
      toast.success("User deleted successfully.");
      // Audit log
      await post("/analytics/audit-logs", {
        action: "USER_DELETED",
        module: "USER_MANAGEMENT",
        description: `User '${userObj?.name || id}' (ID: ${id}) deleted from the system`,
        entityId: String(id),
      }).catch(() => {});
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete user: " + err.message);
    }
  }, [fetchUsers, users]);

  const approveUser = useCallback(async (id) => {
    try {
      const userObj = users.find(u => u.id === id);
      if (!userObj) return;
      const BACKEND_ROLE = {
        admin: "ADMIN",
        purchase_manager: "PURCHASE_MANAGER",
        warehouse_staff: "WAREHOUSE_STAFF",
      };
      await put(`/users/${id}`, {
        fullName: userObj.name,
        email: userObj.email,
        role: BACKEND_ROLE[userObj.role],
        isActive: true,
        active: true,
        employeeId: userObj.employeeId,
        companyName: userObj.companyName
      });
      toast.success(`User "${userObj.name}" approved.`);
      // Audit log
      await post("/analytics/audit-logs", {
        action: "USER_APPROVED",
        module: "USER_MANAGEMENT",
        description: `User '${userObj.name}' (${userObj.email}) account approved and activated`,
        entityId: String(id),
      }).catch(() => {});
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve user: " + err.message);
    }
  }, [users, fetchUsers]);

  const logout = useCallback(async () => {
    const session = loadSession();
    if (session?.refreshToken) {
      try {
        await authApi.logout(session.refreshToken);
      } catch {
        // ignore — clear locally regardless
      }
    }
    clearSession();
    usersFetchInitiated.current = null;
    meFetchInitiated.current = false;
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    toast.info("Logged out successfully.");
  }, []);

  const hasPermission = useCallback(
    (permission) => {
      if (!state.user) return false;
      return ROLE_PERMISSIONS[state.user.role]?.includes(permission) ?? false;
    },
    [state.user]
  );

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
        fetchUsers,
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
