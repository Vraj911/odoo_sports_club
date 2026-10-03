import type { Role } from "@/types/common";

export const APP_NAME = "bookmycourt";
export const CLUB_NAME = "The Champions Club";

export const ROLES: Role[] = [
  "VISITOR",
  "MEMBER",
  "GUARDIAN",
  "FRONT_DESK",
  "SHOP_STAFF",
  "BAR_STAFF",
  "KITCHEN",
  "MANAGER",
  "ACCOUNTANT",
  "OWNER_ADMIN",
];

export const STAFF_ROLES: Role[] = [
  "FRONT_DESK",
  "SHOP_STAFF",
  "BAR_STAFF",
  "KITCHEN",
  "MANAGER",
  "ACCOUNTANT",
  "OWNER_ADMIN",
];

export const ROLE_LABELS: Record<Role, string> = {
  VISITOR: "Visitor",
  MEMBER: "Member",
  GUARDIAN: "Guardian",
  FRONT_DESK: "Front Desk",
  SHOP_STAFF: "Shop Staff",
  BAR_STAFF: "Bar Staff",
  KITCHEN: "Kitchen",
  MANAGER: "Manager",
  ACCOUNTANT: "Accountant",
  OWNER_ADMIN: "Owner / Admin",
};

export const ROLE_HOME: Record<Role, string> = {
  VISITOR: "/",
  MEMBER: "/app",
  GUARDIAN: "/app",
  FRONT_DESK: "/desk",
  SHOP_STAFF: "/shop-console",
  BAR_STAFF: "/bar",
  KITCHEN: "/kds",
  MANAGER: "/manager",
  ACCOUNTANT: "/finance",
  OWNER_ADMIN: "/owner",
};

export const AUTH_STORAGE_KEY = "ccms.auth";
