import { Navigate, Outlet } from "react-router-dom";
import { useJeevikaStore } from "../lib/store.js";
import { hasToken } from "../lib/api.js";

export function ProtectedRoute() {
  const { isAuthenticated } = useJeevikaStore();

  // isAuthenticated is set from Zustand (which reads hasToken() at startup).
  // We also check hasToken() directly as a second guard in case Zustand
  // state has not yet hydrated from localStorage on first render.
  if (!isAuthenticated && !hasToken()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
