/**
 * Jeevika API Client
 * Centralised fetch wrapper that:
 * - Reads BASE_URL from env (falls back to localhost:4000)
 * - Attaches JWT token from localStorage automatically
 * - Returns parsed JSON
 * - Throws structured errors on non-2xx responses
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function getToken() {
  return localStorage.getItem("jeevika_token");
}

async function request(method, path, body = undefined) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = { message: "Invalid server response" };
  }

  if (!res.ok) {
    // Throw an error with the server's message + optional field for form errors
    const error = new Error(data.message || `HTTP ${res.status}`);
    error.status = res.status;
    error.field = data.field || null;
    throw error;
  }

  return data;
}

// ─── Auth ────────────────────────────────────────────────
export const authApi = {
  register: (body) => request("POST", "/api/auth/register", body),
  login: (body) => request("POST", "/api/auth/login", body),
  googleAuth: (body) => request("POST", "/api/auth/google", body),
  forgotPassword: (body) => request("POST", "/api/auth/forgot-password", body),
  sendOtp: (phone) => request("POST", "/api/auth/send-otp", { phone }),
  verifyOtp: (phone, otp) => request("POST", "/api/auth/verify-otp", { phone, otp }),
  me: () => request("GET", "/api/auth/me"),
  updateProfile: (body) => request("PUT", "/api/auth/profile", body),
  verify: (body) => request("POST", "/api/auth/verify", body),
  savePushSubscription: (subscription) => request("POST", "/api/auth/push-subscription", { subscription })
};

// ─── Jobs ────────────────────────────────────────────────
export const jobsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request("GET", `/api/jobs${qs ? `?${qs}` : ""}`);
  },
  create: (body) => request("POST", "/api/jobs", body),
  getById: (id) => request("GET", `/api/jobs/${id}`),
  expressInterest: (jobId, body = {}) => request("POST", `/api/jobs/${jobId}/interested`, body),
  hire: (jobId, workerId, amount) => request("POST", `/api/jobs/${jobId}/hire`, { workerId, amount }),
  updateStatus: (jobId, status) => request("PUT", `/api/jobs/${jobId}/status`, { status }),
  dispute: (jobId) => request("POST", `/api/jobs/${jobId}/dispute`)
};

// ─── Workers ─────────────────────────────────────────────
export const workersApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request("GET", `/api/workers${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => request("GET", `/api/workers/${id}`)
};

// ─── Wallet ──────────────────────────────────────────────
export const walletApi = {
  transactions: () => request("GET", "/api/wallet/transactions"),
  deposit: (amount) => request("POST", "/api/wallet/deposit", { amount }),
  lockEscrow: (body) => request("POST", "/api/wallet/escrow/lock", body),
  releaseEscrow: (id) => request("POST", `/api/wallet/escrow/${id}/release`),
  refundEscrow: (id) => request("POST", `/api/wallet/escrow/${id}/refund`)
};

// ─── Admin ────────────────────────────────────────────────
export const adminApi = {
  users: () => request("GET", "/api/admin/users"),
  suspend: (userId, isActive) => request("PUT", "/api/admin/suspend", { userId, isActive }),
  stats: () => request("GET", "/api/admin/stats"),
  jobs: () => request("GET", "/api/admin/jobs"),
  releaseEscrow: (jobId) => request("POST", `/api/admin/jobs/${jobId}/release`),
  kycApprove: (userId) => request("POST", `/api/admin/kyc/${userId}/approve`),
  kycReject: (userId) => request("POST", `/api/admin/kyc/${userId}/reject`)
};

// ─── Chat ─────────────────────────────────────────────────
export const chatApi = {
  getMessages: (jobId) => request("GET", `/api/chat/${jobId}`),
  sendMessage: (jobId, text) => request("POST", `/api/chat/${jobId}`, { text })
};

// ─── Notifications ────────────────────────────────────────
export const notificationApi = {
  list: () => request("GET", "/api/notifications"),
  markAsRead: (id) => request("PATCH", `/api/notifications/${id}/read`),
  clearAll: () => request("DELETE", "/api/notifications")
};

// ─── Reviews ──────────────────────────────────────────────
export const reviewsApi = {
  create: (body) => request("POST", "/api/reviews", body),
  getForUser: (userId) => request("GET", `/api/reviews/${userId}`)
};

// ─── Verification ──────────────────────────────────────
export const verificationApi = {
  start: (jobId, body) => request("POST", `/api/verification/${jobId}/start`, body),
  beforeProof: (jobId, body) => request("POST", `/api/verification/${jobId}/before-proof`, body),
  ping: (jobId, body) => request("POST", `/api/verification/${jobId}/ping`, body),
  complete: (jobId, body) => request("POST", `/api/verification/${jobId}/complete`, body),
  get: (jobId) => request("GET", `/api/verification/${jobId}`),
  review: (jobId, body) => request("POST", `/api/verification/${jobId}/review`, body),
  myActive: () => request("GET", "/api/verification/my/active"),
  adminAll: () => request("GET", "/api/verification/admin/all")
};

// ─── Token helpers ────────────────────────────────────────
export function saveToken(token) {
  localStorage.setItem("jeevika_token", token);
}

export function clearToken() {
  localStorage.removeItem("jeevika_token");
}

export function hasToken() {
  return !!localStorage.getItem("jeevika_token");
}
