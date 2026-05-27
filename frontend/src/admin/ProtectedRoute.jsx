import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export const ProtectedRoute = ({ children, allowed }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-zinc-500 font-mono text-xs tracking-widest uppercase">
        Loading…
      </div>
    );
  }
  if (user === null) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  // Customers stay in their portal; only allow them on /portal and /admin/profile.
  if (user.role === "customer") {
    const path = location.pathname;
    if (path !== "/portal" && path !== "/admin/profile") {
      return <Navigate to="/portal" replace />;
    }
  }
  if (allowed && !allowed.includes(user.role)) {
    return <Navigate to="/admin" replace />;
  }
  return children;
};
