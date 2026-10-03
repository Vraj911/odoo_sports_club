import type { PrimaryRole, PermissionGroup, AuthUser } from "@/types/common";

export const APP_NAME = "bookmycourt";
export const CLUB_NAME = "The Champions Club";

export const PRIMARY_ROLES: PrimaryRole[] = ["MEMBER", "STAFF", "ADMIN"];

export const ALL_PERMISSION_GROUPS: PermissionGroup[] = [
  "FRONT_DESK",
  "POS_BAR",
  "SHOP_INVENTORY",
  "CRM",
  "FINANCE",
];

export const ROLE_LABELS: Record<PrimaryRole, string> = {
  MEMBER: "Member",
  STAFF: "Staff",
  ADMIN: "Admin",
};

export const GROUP_LABELS: Record<PermissionGroup, string> = {
  FRONT_DESK: "Front Desk",
  POS_BAR: "POS & Bar",
  SHOP_INVENTORY: "Shop & Inventory",
  CRM: "CRM",
  FINANCE: "Finance",
};

/**
 * Determine the landing page for a user.
 * - MEMBER → /app
 * - ADMIN → /owner
 * - STAFF with exactly 1 group → that group's console
 * - STAFF with several groups or none → /staff
 */
export function getRoleHome(user: AuthUser | null | undefined): string {
  if (!user) return "/";
  if (user.role === "MEMBER") return "/app";
  if (user.role === "ADMIN") return "/owner";
  if (user.role === "STAFF") {
    if (user.groups.length === 1) {
      const g = user.groups[0];
      switch (g) {
        case "FRONT_DESK":
          return "/desk";
        case "POS_BAR":
          return "/bar";
        case "SHOP_INVENTORY":
          return "/shop-console";
        case "CRM":
          return "/crm";
        case "FINANCE":
          return "/finance";
      }
    }
    return "/staff";
  }
  return "/";
}

/** Fallback static role home */
export const ROLE_HOME: Record<PrimaryRole, string> = {
  MEMBER: "/app",
  STAFF: "/staff",
  ADMIN: "/owner",
};

export const AUTH_STORAGE_KEY = "ccms.auth";

export interface DemoPreset {
  label: string;
  role: PrimaryRole;
  groups: PermissionGroup[];
  home: string;
}

export const DEMO_PRESETS: DemoPreset[] = [
  { label: "Sign in as Member", role: "MEMBER", groups: [], home: "/app" },
  { label: "Staff · Front Desk", role: "STAFF", groups: ["FRONT_DESK"], home: "/desk" },
  { label: "Staff · POS/Bar", role: "STAFF", groups: ["POS_BAR"], home: "/bar" },
  { label: "Staff · Shop/Inventory", role: "STAFF", groups: ["SHOP_INVENTORY"], home: "/shop-console" },
  { label: "Staff · Front Desk + CRM", role: "STAFF", groups: ["FRONT_DESK", "CRM"], home: "/staff" },
  { label: "Staff · Finance", role: "STAFF", groups: ["FINANCE"], home: "/finance" },
  { label: "Staff (No Group)", role: "STAFF", groups: [], home: "/staff" },
  { label: "Admin / Owner", role: "ADMIN", groups: [], home: "/owner" },
];
