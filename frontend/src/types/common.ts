import type { LucideIcon } from "lucide-react";

export type Role =
  | "VISITOR"
  | "MEMBER"
  | "GUARDIAN"
  | "FRONT_DESK"
  | "SHOP_STAFF"
  | "BAR_STAFF"
  | "KITCHEN"
  | "MANAGER"
  | "ACCOUNTANT"
  | "OWNER_ADMIN";

export type Phase = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export type LayoutKind = "public" | "auth" | "member" | "console";

export type NavGroupKey =
  | "desk"
  | "shop"
  | "bar"
  | "crm"
  | "finance"
  | "hr"
  | "manager"
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
  /** Empty array = public (no auth required). */
  roles: Role[];
  phase: Phase;
  srsIds: string[];
  icon: LucideIcon;
  group?: NavGroupKey;
  /** Lazy page module. Defaults to PagePlaceholder. */
  load?: () => Promise<{ default: React.ComponentType<PageProps> }>;
}

export interface AuthUser {
  name: string;
  role: Role;
}
