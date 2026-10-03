import type { ReactNode } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { GoTo } from "../links";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <PageSkeleton />;
  if (!user) {
    const returnUrl = typeof window !== "undefined" ? window.location.pathname : "";
    const to = returnUrl && returnUrl !== "/" ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : "/login";
    return <GoTo to={to} />;
  }
  return <>{children}</>;
}
