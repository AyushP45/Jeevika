import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useJeevikaStore } from "../lib/store.js";
import { hasToken, authApi } from "../lib/api.js";
import { initSocket, disconnectSocket } from "../lib/socket.js";
import { motion } from "framer-motion";

export function ProtectedRoute() {
  const { isAuthenticated, user, loginWithUser, logout } = useJeevikaStore();
  const [loading, setLoading] = useState(!user && (isAuthenticated || hasToken()));

  useEffect(() => {
    const syncProfile = async () => {
      if (!user && (isAuthenticated || hasToken())) {
        try {
          const profile = await authApi.getProfile();
          loginWithUser(profile);
          initSocket(profile.id);
        } catch (err) {
          console.error("Profile sync failed:", err);
          logout();
        } finally {
          setLoading(false);
        }
      } else {
        if (user) initSocket(user.id);
        setLoading(false);
      }
    };

    syncProfile();

    return () => {
      // Optional: disconnectSocket(); // Usually we want to keep it alive between pages
    };
  }, [user, isAuthenticated, loginWithUser, logout]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!isAuthenticated && !hasToken()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
