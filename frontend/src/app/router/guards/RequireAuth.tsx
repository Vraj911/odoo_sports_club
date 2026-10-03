import type { ReactNode } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { GoTo } from "../links";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <PageSkeleton />;
  if (!user) return <GoTo to="/login" />;
  return <>{children}</>;
}
