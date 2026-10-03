import type { ReactNode } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { canAccess } from "@/lib/permissions";
import type { Role } from "@/types/common";
import { GoTo } from "../links";

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!canAccess(user?.role, roles)) return <GoTo to="/403" />;
  return <>{children}</>;
}
