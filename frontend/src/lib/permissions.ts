import type { NavGroupKey, Role } from "@/types/common";

export const NAV_GROUPS: { key: NavGroupKey; label: string }[] = [
  { key: "owner", label: "Owner" },
  { key: "manager", label: "Manager" },
  { key: "desk", label: "Front Desk" },
  { key: "shop", label: "Shop" },
  { key: "bar", label: "Bar & Kitchen" },
  { key: "crm", label: "CRM" },
  { key: "finance", label: "Finance" },
  { key: "hr", label: "HR & Payroll" },
  { key: "admin", label: "Admin" },
  { key: "self", label: "My Work" },
];

/** Which sidebar groups each role may see. Route-level roles filter further. */
export const ROLE_NAV_GROUPS: Record<Role, NavGroupKey[]> = {
  VISITOR: [],
  MEMBER: [],
  GUARDIAN: [],
  FRONT_DESK: ["desk", "crm", "self"],
  SHOP_STAFF: ["shop", "self"],
  BAR_STAFF: ["bar", "self"],
  KITCHEN: ["bar", "self"],
  MANAGER: ["manager", "owner", "desk", "shop", "bar", "crm", "finance", "hr", "self"],
  ACCOUNTANT: ["finance", "hr", "self"],
  OWNER_ADMIN: ["owner", "manager", "desk", "shop", "bar", "crm", "finance", "hr", "admin", "self"],
};

export const canAccess = (role: Role | undefined, allowed: Role[]) =>
  allowed.length === 0 || (!!role && allowed.includes(role));
