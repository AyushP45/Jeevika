import { create } from "zustand";
import { demoJobs, demoTransactions, demoUser } from "../data/demoData.js";
import { clearToken, hasToken } from "./api.js";

export const useJeevikaStore = create((set, get) => ({
  // ─── Auth ─────────────────────────────────────────────
  // Check localStorage on startup so page refresh keeps user logged in
  isAuthenticated: hasToken(),
  user: demoUser,
  
  // ─── Demo / local state ───────────────────────────────
  jobs: demoJobs,
  transactions: demoTransactions,
  theme: "dark",
  language: "en", // "en" | "hi" | "mr"
  availability: true,
  applications: [],
  notifications: [],

  // ─── Auth actions ──────────────────────────────────────
  /**
   * Called after a successful API login/register.
   * @param {object} realUser  — user object from server (no passwordHash)
   */
  loginWithUser: (realUser) =>
    set({
      isAuthenticated: true,
      user: {
        // Keep fallback demo shape so all pages don't break if a field is missing
        ...demoUser,
        ...realUser,
        // Normalise wallet field (server uses walletBalance)
        wallet: realUser.walletBalance ?? demoUser.wallet,
        earnings: demoUser.earnings // server doesn't track daily earnings yet
      }
    }),

  /** Legacy shim — still used by demo paths */
  login: () => set({ isAuthenticated: true }),

  logout: () => {
    clearToken();
    set({ isAuthenticated: false, user: demoUser });
  },

  // ─── Profile ──────────────────────────────────────────
  updateUser: (patch) =>
    set((state) => ({ user: { ...state.user, ...patch } })),

  // ─── Role (demo selector) ─────────────────────────────
  setRole: (role) => set((state) => ({ user: { ...state.user, role } })),

  // ─── Availability ─────────────────────────────────────
  toggleAvailability: () => set((state) => ({ availability: !state.availability })),

  // ─── Jobs ─────────────────────────────────────────────
  setJobs: (jobs) => set({ jobs }),

  expressInterest: (jobId) =>
    set((state) => ({
      applications: state.applications.includes(jobId)
        ? state.applications
        : [...state.applications, jobId]
    })),

  addJob: (job) =>
    set((state) => ({
      jobs: [{ ...job, id: `job-${Date.now()}`, applicants: 0, status: "Open" }, ...state.jobs]
    })),

  // ─── Wallet / Transactions ────────────────────────────
  setTransactions: (transactions) => set({ transactions }),

  // ─── Notifications ─────────────────────────────────────
  setNotifications: (updater) => 
    set((state) => ({ 
      notifications: typeof updater === "function" ? updater(state.notifications) : updater 
    })),
  markNotificationAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      )
    })),

  // ─── Preferences ──────────────────────────────────────
  setLanguage: (language) => set({ language }),
  setTheme: (theme) => set({ theme })
}));
