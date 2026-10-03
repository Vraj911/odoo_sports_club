import type { LucideIcon } from "lucide-react";

/** Three authenticated primary roles. Logged-out users see public routes. */
export type PrimaryRole = "MEMBER" | "STAFF" | "ADMIN";

/** Staff capability groups — STAFF holds ≥0, ADMIN bypasses all. */
export type PermissionGroup =
  | "FRONT_DESK"
  | "POS_BAR"
  | "SHOP_INVENTORY"
  | "CRM"
  | "FINANCE";

/** Granular permission keys per group and admin-only */
export type GranularPermission =
  // FRONT_DESK
  | "members.view"
  | "members.manage"
  | "memberships.manage"
  | "bookings.view"
  | "bookings.manage"
  | "bookings.cancel"
  | "social.manage"
  | "checkin.manage"
  | "enquiries.manage"
  | "crm.leads.view"
  | "crm.followups"
  | "payments.take"
  // POS_BAR
  | "pos.use"
  | "bar.orders.create"
  | "bar.tables.manage"
  | "bar.tabs.manage"
  | "bar.discounts.auto"
  | "bar.bills.close"
  | "bar.shift.view"
  | "bar.stock.view"
  | "kds.use"
  // SHOP_INVENTORY
  | "shop.products.manage"
  | "inventory.view"
  | "inventory.update"
  | "shop.counter.sell"
  | "shop.orders.manage"
  | "lowstock.view"
  | "shop.returns"
  | "shop.po"
  | "shop.restring"
  | "shop.reports"
  // CRM
  | "crm.leads.manage"
  | "crm.quotes"
  | "crm.convert"
  | "crm.dashboard"
  | "crm.campaigns"
  // FINANCE
  | "finance.invoices"
  | "finance.payments.view"
  | "finance.payments.record"
  | "finance.records"
  | "finance.revenue.view"
  | "finance.reports"
  // ADMIN-ONLY
  | "members.delete"
  | "plans.manage"
  | "pricing.manage"
  | "courts.manage"
  | "config.manage"
  | "employees.manage"
  | "hr.manage"
  | "payroll.run"
  | "leave.approve"
  | "staff.manage"
  | "groups.manage"
  | "finance.refund"
  | "finance.void"
  | "finance.periods"
  | "tax.config"
  | "bar.dayclose"
  | "bar.reopen"
  | "override.cap"
  | "override.price"
  | "override.discount"
  | "owner.dashboard"
  | "reports.export.club"
  | "audit.view"
  | "share.links";

/**
 * Permission keys:
 * - 'auth'        → any logged-in user
 * - 'member'      → MEMBER role only
 * - 'staff'       → any STAFF or ADMIN
 * - 'admin'       → ADMIN only
 * - PermissionGroup → STAFF with that group, or ADMIN
 * - GranularPermission → fine-grained capability
 */
export type PermissionKey =
  | "auth"
  | "member"
  | "staff"
  | "admin"
  | PermissionGroup
  | GranularPermission;

export interface RouteAccess {
  roles?: PrimaryRole[];
  anyGroup?: PermissionGroup[];
  permission?: PermissionKey;
}

export type RouteAccessRule = PermissionKey[] | RouteAccess;

export type Phase = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export type LayoutKind = "public" | "auth" | "member" | "console";

export type NavGroupKey =
  | "desk"
  | "shop"
  | "bar"
  | "crm"
  | "finance"
  | "hr"
  | "owner"
  | "admin"
  | "self";

export interface PageProps {
  route: RouteMeta;
  params: Record<string, string>;
}

export interface RouteMeta {
  path: string;
  title: string;
  layout: LayoutKind;
  /** Permission keys or RouteAccess required. Empty array = public (no auth). */
  access: PermissionKey[];
  phase: Phase;
  srsIds: string[];
  icon: LucideIcon;
  group?: NavGroupKey;
  /** Lazy page module. Defaults to PagePlaceholder. */
  load?: () => Promise<{ default: React.ComponentType<PageProps> }>;
}

export interface AuthUser {
  id?: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  token?: string;
  role: PrimaryRole;
  /** Permission groups assigned to this user (relevant for STAFF). */
  groups: PermissionGroup[];
}
