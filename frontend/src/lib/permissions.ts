import React, { useCallback, type ReactNode } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import type {
  AuthUser,
  GranularPermission,
  NavGroupKey,
  PermissionGroup,
  PermissionKey,
  RouteAccessRule,
} from "@/types/common";

// ─── Single config array for permission groups (Phase 12 expandable) ────
export const PERMISSION_GROUPS: readonly PermissionGroup[] = [
  "FRONT_DESK",
  "POS_BAR",
  "SHOP_INVENTORY",
  "CRM",
  "FINANCE",
] as const;

// ─── Default permissions per group ──────────────────────────────────────
export const GROUP_PERMISSIONS: Record<PermissionGroup, GranularPermission[]> = {
  FRONT_DESK: [
    "members.view",
    "members.manage",
    "memberships.manage",
    "bookings.view",
    "bookings.manage",
    "bookings.cancel",
    "social.manage",
    "checkin.manage",
    "enquiries.manage",
    "crm.leads.view",
    "crm.followups",
    "payments.take",
  ],
  POS_BAR: [
    "pos.use",
    "bar.orders.create",
    "bar.tables.manage",
    "bar.tabs.manage",
    "bar.discounts.auto",
    "payments.take",
    "bar.bills.close",
    "bar.shift.view",
    "bar.stock.view",
    "kds.use",
  ],
  SHOP_INVENTORY: [
    "shop.products.manage",
    "inventory.view",
    "inventory.update",
    "shop.counter.sell",
    "shop.orders.manage",
    "lowstock.view",
    "shop.returns",
    "shop.po",
    "shop.restring",
    "shop.reports",
  ],
  CRM: [
    "crm.leads.view",
    "crm.leads.manage",
    "crm.followups",
    "crm.quotes",
    "crm.convert",
    "crm.dashboard",
    "crm.campaigns",
    "enquiries.manage",
  ],
  FINANCE: [
    "finance.invoices",
    "finance.payments.view",
    "finance.payments.record",
    "finance.records",
    "finance.revenue.view",
    "finance.reports",
  ],
};

// ─── Admin-only keys (not in any staff group by default) ─────────────────
export const ADMIN_ONLY_PERMISSIONS: readonly GranularPermission[] = [
  "members.delete",
  "plans.manage",
  "pricing.manage",
  "courts.manage",
  "config.manage",
  "employees.manage",
  "hr.manage",
  "payroll.run",
  "leave.approve",
  "staff.manage",
  "groups.manage",
  "finance.refund",
  "finance.void",
  "finance.periods",
  "tax.config",
  "bar.dayclose",
  "bar.reopen",
  "override.cap",
  "override.price",
  "override.discount",
  "owner.dashboard",
  "reports.export.club",
  "audit.view",
  "share.links",
] as const;

// ─── Group & Permission Checks ──────────────────────────────────────────

/** Check if user belongs to a specific permission group */
export function hasGroup(
  user: AuthUser | null | undefined,
  group: PermissionGroup
): boolean {
  if (!user) return false;
  if (user.role === "STAFF") return user.groups.includes(group);
  return false;
}

/**
 * Core capability check.
 * - 'auth'        → any authenticated user
 * - 'member'      → MEMBER role
 * - 'staff'       → STAFF role
 * - PermissionGroup → STAFF holding that group
 * - GranularPermission → checks default group mappings
 */
export function can(
  user: AuthUser | null | undefined,
  key: PermissionKey
): boolean {
  if (!user) return false;

  switch (key) {
    case "auth":
      return true;
    case "member":
      return user.role === "MEMBER";
    case "staff":
      return user.role === "STAFF";
    default:
      break;
  }

  // Check if key is a PermissionGroup
  if ((PERMISSION_GROUPS as readonly string[]).includes(key)) {
    return user.role === "STAFF" && user.groups.includes(key as PermissionGroup);
  }

  // Granular check across staff groups
  if (user.role === "STAFF") {
    return user.groups.some((group) => {
      const perms = GROUP_PERMISSIONS[group];
      return perms ? perms.includes(key as GranularPermission) : false;
    });
  }

  return false;
}

/**
 * Check if user satisfies route access rules (array or object).
 */
export function canAccess(
  user: AuthUser | null | undefined,
  access: RouteAccessRule
): boolean {
  if (Array.isArray(access)) {
    if (access.length === 0) return true; // public
    return access.every((key) => can(user, key));
  }

  // Object rule { roles, anyGroup, permission }
  if (!user) return false;

  if (access.roles && access.roles.length > 0) {
    if (!access.roles.includes(user.role)) return false;
  }

  if (access.anyGroup && access.anyGroup.length > 0) {
    if (user.role !== "STAFF") return false;
    if (!user.groups.some((g) => access.anyGroup!.includes(g))) return false;
  }

  if (access.permission) {
    if (!can(user, access.permission)) return false;
  }

  return true;
}

export function canAccessRoute(
  user: AuthUser | null | undefined,
  access: RouteAccessRule
): boolean {
  return canAccess(user, access);
}

// ─── React Hook & Component ─────────────────────────────────────────────

/** Hook returning a permission check function bound to the active user */
export function useCan() {
  const { user } = useAuth();
  return useCallback((key: PermissionKey) => can(user, key), [user]);
}

/** Declarative permission gate component */
export function Can({
  permission,
  fallback = null,
  children,
}: {
  permission: PermissionKey;
  fallback?: ReactNode;
  children: ReactNode;
}): ReactNode {
  const canDo = useCan();
  return (canDo(permission) ? children : fallback) as ReactNode;
}

// ─── Navigation Group Mapping ──────────────────────────────────────────

export const NAV_GROUPS: { key: NavGroupKey; label: string }[] = [
  { key: "desk", label: "Front Desk" },
  { key: "bar", label: "Bar & Kitchen" },
  { key: "shop", label: "Shop & Inventory" },
  { key: "crm", label: "CRM" },
  { key: "finance", label: "Finance" },
  { key: "hr", label: "HR & Payroll" },
  { key: "self", label: "My Work" },
];

/**
 * Which sidebar groups a user may see, based on role + groups.
 * STAFF sees groups mapped from their PermissionGroups + self + hr.
 * MEMBER sees nothing in the console sidebar.
 */
export function getVisibleNavGroups(user: AuthUser | null | undefined): NavGroupKey[] {
  if (!user) return [];
  if (user.role === "MEMBER") return [];

  // STAFF: map assigned permission groups to nav groups
  const groups = new Set<NavGroupKey>();
  groups.add("self"); // every staff member has access to "My Work"
  groups.add("hr");

  for (const g of user.groups) {
    switch (g) {
      case "FRONT_DESK":
        groups.add("desk");
        break;
      case "POS_BAR":
        groups.add("bar");
        break;
      case "SHOP_INVENTORY":
        groups.add("shop");
        break;
      case "CRM":
        groups.add("crm");
        break;
      case "FINANCE":
        groups.add("finance");
        break;
    }
  }

  return Array.from(groups);
}
