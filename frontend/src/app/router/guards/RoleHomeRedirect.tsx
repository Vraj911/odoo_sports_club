import type { ReactNode } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { getRoleHome } from "@/lib/constants";
import { GoTo } from "../links";

/** Sends a signed-in user to their dynamic role/group home; otherwise renders children (auth pages). */
export function RoleHomeRedirect({ children }: { children?: ReactNode }) {
  const { user, ready } = useAuth();
  if (ready && user) return <GoTo to={getRoleHome(user)} />;
  return <>{children}</>;
}
