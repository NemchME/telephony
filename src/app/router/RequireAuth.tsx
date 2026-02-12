import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/app/store/hooks";

export function RequireAuth({ children }: { children: ReactNode }) {
  const sessionID = useAppSelector((s) => s.session.sessionID);

  if (!sessionID) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}