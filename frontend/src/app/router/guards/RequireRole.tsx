import type { ReactNode } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { can, canAccess } from "@/lib/permissions";
import type { PermissionGroup, PermissionKey, PrimaryRole, RouteAccessRule } from "@/types/common";
import { GoTo } from "../links";

export interface RequireAccessProps {
  roles?: PrimaryRole[];
  groups?: PermissionGroup[];
  permission?: PermissionKey;
  access?: RouteAccessRule;
  children: ReactNode;
}

/**
 * Access guard replacing RequireRole.
 * Supports props: roles, groups, permission, or access.
 * If unauthorized, redirects to /403 with query explaining the missing permission.
 */
export function RequireAccess({
  roles,
  groups,
  permission,
  access,
  children,
}: RequireAccessProps) {
  const { user } = useAuth();

  if (!user) {
    const returnUrl = typeof window !== "undefined" ? window.location.pathname : "";
    return <GoTo to={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} />;
  }

  // Admin bypasses all
  if (user.role === "ADMIN") {
    return <>{children}</>;
  }

  // 1. If explicit access rule provided
  if (access && !canAccess(user, access)) {
    const reqStr = Array.isArray(access)
      ? access.join(", ")
      : [
          access.roles?.join("/"),
          access.anyGroup?.join("/"),
          access.permission,
        ]
          .filter(Boolean)
          .join(" · ");
    return <GoTo to={`/403?required=${encodeURIComponent(reqStr || "Staff privileges")}`} />;
  }

  // 2. Check roles
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <GoTo to={`/403?required=${encodeURIComponent(`Role: ${roles.join(" or ")}`)}`} />;
  }

  // 3. Check groups
  if (groups && groups.length > 0) {
    if (user.role !== "STAFF" || !user.groups.some((g) => groups.includes(g))) {
      return (
        <GoTo
          to={`/403?required=${encodeURIComponent(`Permission Group: ${groups.join(" or ")}`)}`}
        />
      );
    }
  }

  // 4. Check single permission
  if (permission && !can(user, permission)) {
    return <GoTo to={`/403?required=${encodeURIComponent(`Permission: ${permission}`)}`} />;
  }

  return <>{children}</>;
}
