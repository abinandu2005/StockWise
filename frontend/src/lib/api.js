// ============================================================
// StockWise API Client
// Architecture: React (5173) → API Gateway (9090) → Microservices
//
// BASE_URL is read from the VITE_API_URL environment variable.
// Set VITE_API_URL=http://localhost:9090/api in your .env file.
// All requests bypass the Vite dev-server proxy and go directly
// to the Spring Boot API Gateway, which then routes to the
// correct downstream microservice.
// ============================================================

// Reads from .env → VITE_API_URL; falls back to the Gateway at :9090
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:9090/api";
 
// ── Session helpers ───────────────────────────────────────────
const STORAGE_KEY = "stockwise-auth";

function getSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getToken() {
  return getSession()?.token ?? null;
}

function updateStoredAccessToken(newToken) {
  try {
    const session = getSession();
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...session, token: newToken }));
    }
  } catch {
    // ignore
  }
}

function clearStoredSession() {
  localStorage.removeItem(STORAGE_KEY);
}

// ── Refresh lock — prevents concurrent refresh storms ────────
let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function subscribeToRefresh(cb) {
  refreshSubscribers.push(cb);
}

// ── Core fetch wrapper ────────────────────────────────────────

async function rawRequest(method, path, body, auth = false, customToken = null) {
  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = customToken ?? getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Inject user-context headers that the API Gateway previously provided.
    // Downstream microservices (Inventory, Sales, Purchase, Analytics, Suppliers)
    // read X-User-Id / X-User-Role to identify the acting user — they have no
    // JWT filter of their own and relied on the Gateway to stamp these headers.
    const session = getSession();
    if (session?.user) {
      const roleMap = {
        admin: "ADMIN",
        purchase_manager: "PURCHASE_MANAGER",
        warehouse_staff: "WAREHOUSE_STAFF",
      };
      headers["X-User-Id"]    = String(session.user.id);
      headers["X-User-Role"]  = roleMap[session.user.role] ?? session.user.role.toUpperCase();
      headers["X-User-Email"] = session.user.email ?? "";
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return res;
}

async function attemptRefresh() {
  const session = getSession();
  if (!session?.refreshToken) throw new Error("No refresh token available");

  const res = await rawRequest("POST", "/auth/refresh-token", { refreshToken: session.refreshToken });
  if (!res.ok) throw new Error("Refresh failed");

  const data = await res.json();
  const newToken = data?.data?.accessToken;
  if (!newToken) throw new Error("No access token in refresh response");

  updateStoredAccessToken(newToken);
  return newToken;
}

async function request(method, path, body, auth = false) {
  let res = await rawRequest(method, path, body, auth);

  // Handle 401 with transparent token refresh (only for authenticated calls)
  if (res.status === 401 && auth) {
    // Skip refresh for auth endpoints to avoid infinite loops
    if (path.startsWith("/auth/")) {
      clearStoredSession();
      throw new Error("Unauthorized");
    }

    if (isRefreshing) {
      // Queue this request until the refresh completes
      return new Promise((resolve, reject) => {
        subscribeToRefresh(async (newToken) => {
          try {
            const retryRes = await rawRequest(method, path, body, true, newToken);
            if (!retryRes.ok) {
              reject(new Error(`HTTP ${retryRes.status}`));
            } else if (retryRes.status === 204) {
              resolve(undefined);
            } else {
              resolve(retryRes.json());
            }
          } catch (err) {
            reject(err);
          }
        });
      });
    }

    // Kick off a single refresh attempt
    isRefreshing = true;
    try {
      const newToken = await attemptRefresh();
      isRefreshing = false;
      onRefreshed(newToken);

      // Retry the original request with the new token
      res = await rawRequest(method, path, body, true, newToken);
    } catch {
      isRefreshing = false;
      refreshSubscribers = [];
      clearStoredSession();
      // Dispatch a custom event so AuthContext can react and reset state
      window.dispatchEvent(new Event("stockwise:session-expired"));
      throw new Error("Session expired. Please log in again.");
    }
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      message = err.message || err.error || message;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined;
  return res.json();
}

// ── Auth API ─────────────────────────────────────────────────

export const authApi = {
  login: (payload) =>
    request("POST", "/auth/login", payload),

  register: (payload) =>
    request("POST", "/auth/register", payload),

  verifyEmail: (email, otp) =>
    request("POST", "/auth/verify-email", { email, otp }),

  resendOtp: (email) =>
    request("POST", "/auth/resend-otp", { email }),

  forgotPassword: (email) =>
    request("POST", "/auth/forgot-password", { email }),

  verifyForgotPasswordOtp: (email, otp) =>
    request("POST", "/auth/verify-forgot-password-otp", { email, otp }),

  resetPassword: (email, otp, newPassword) =>
    request("POST", "/auth/reset-password", { email, otp, newPassword }),

  refresh: (refreshToken) =>
    request("POST", "/auth/refresh-token", { refreshToken }),

  logout: (refreshToken) =>
    request("POST", "/auth/logout", { refreshToken }, true),

  me: () => request("GET", "/auth/me", undefined, true),
};



// ── Generic resource helpers ──────────────────────────────────

export const get  = (path)        => request("GET",    path, undefined, true);
export const post = (path, body)  => request("POST",   path, body,      true);
export const put  = (path, body)  => request("PUT",    path, body,      true);
export const del  = (path)        => request("DELETE", path, undefined, true);
