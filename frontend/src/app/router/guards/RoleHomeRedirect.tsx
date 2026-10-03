import type { ReactNode } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { ROLE_HOME } from "@/lib/constants";
import { GoTo } from "../links";

/** Sends a signed-in (non-visitor) user to their role home; otherwise renders children. */
export function RoleHomeRedirect({ children }: { children?: ReactNode }) {
  const { user, ready } = useAuth();
  if (ready && user && user.role !== "VISITOR") return <GoTo to={ROLE_HOME[user.role]} />;
  return <>{children}</>;
}
