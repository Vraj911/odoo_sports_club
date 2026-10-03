import {
  Home, Building2, BadgeCheck, CalendarDays, ShoppingBag, Package, ShoppingCart, CreditCard, Sparkles, Mail, Share2,
  LogIn, UserPlus, KeyRound, LayoutDashboard, CalendarPlus, Users, ListChecks, FileText, Beer, Receipt, IdCard, User,
  Bell, ClipboardList, UserRoundPlus, Footprints, ScanLine, Wallet, Store, Zap, Boxes, PackagePlus, Tags, Truck,
  Undo2, Wrench, BarChart3, Wine, Table2, Clock, Lock, ChefHat, Contact, Target, FileSignature, Megaphone, Landmark,
  Briefcase, HandCoins, Building, Percent, TrendingUp, Scale, CalendarRange, UserCog, CalendarClock, Fingerprint,
  Plane, Banknote, PartyPopper, CircleUser, Gauge, Activity, SlidersHorizontal, Ban, CheckCheck, Crown, FileBarChart,
  Link2, Settings, LandPlot, Timer, BadgeIndianRupee, Calculator, MessageSquare, CalendarOff, Coins, MailCheck,
  ShieldCheck, History, Sprout, type LucideIcon,
} from "lucide-react";
import { STAFF_ROLES } from "@/lib/constants";
import type { LayoutKind, NavGroupKey, Phase, Role, RouteMeta } from "@/types/common";

const PUBLIC: Role[] = [];
const MEMBERS: Role[] = ["MEMBER", "GUARDIAN"];
const DESK: Role[] = ["FRONT_DESK", "MANAGER", "OWNER_ADMIN"];
const SHOP: Role[] = ["SHOP_STAFF", "MANAGER", "OWNER_ADMIN"];
const BAR: Role[] = ["BAR_STAFF", "MANAGER", "OWNER_ADMIN"];
const CRM: Role[] = ["FRONT_DESK", "MANAGER", "OWNER_ADMIN"];
const FIN: Role[] = ["ACCOUNTANT", "MANAGER", "OWNER_ADMIN"];
const HR: Role[] = ["MANAGER", "ACCOUNTANT", "OWNER_ADMIN"];
const MGR: Role[] = ["MANAGER", "OWNER_ADMIN"];
const OWN: Role[] = ["OWNER_ADMIN", "MANAGER"];
const ADM: Role[] = ["OWNER_ADMIN"];

const r = (
  path: string,
  title: string,
  layout: LayoutKind,
  roles: Role[],
  phase: Phase,
  srsIds: string[],
  icon: LucideIcon,
  group?: NavGroupKey,
): RouteMeta => ({ path, title, layout, roles, phase, srsIds, icon, ...(group ? { group } : {}) });

const c = (path: string, title: string, roles: Role[], phase: Phase, group: NavGroupKey, icon: LucideIcon, srsIds: string[] = []) =>
  r(path, title, "console", roles, phase, srsIds, icon, group);

/** Single source of truth for routing AND navigation. */
export const routeConfig: RouteMeta[] = [
  // PUBLIC
  { ...r("/", "Home", "public", PUBLIC, 2, ["WEB-01"], Home), load: () => import("@/features/website/pages/Home") },
  r("/facilities", "Facilities", "public", PUBLIC, 8, ["WEB-01"], Building2),
  r("/plans", "Membership Plans", "public", PUBLIC, 8, ["WEB-02"], BadgeCheck),
  r("/availability", "This Week", "public", PUBLIC, 8, ["WEB-03"], CalendarDays),
  r("/shop", "Shop", "public", PUBLIC, 6, ["WEB-04"], ShoppingBag),
  r("/shop/:slug", "Product", "public", PUBLIC, 6, [], Package),
  r("/cart", "Cart", "public", PUBLIC, 6, [], ShoppingCart),
  r("/checkout", "Checkout", "public", PUBLIC, 6, [], CreditCard),
  r("/trial", "Book a Trial", "public", PUBLIC, 8, ["WEB-05"], Sparkles),
  r("/contact", "Contact", "public", PUBLIC, 8, ["WEB-07"], Mail),
  r("/share/:token", "Shared Report", "public", PUBLIC, 11, ["RPT-10"], Share2),

  // AUTH
  { ...r("/login", "Sign in", "auth", PUBLIC, 2, ["AUTH-01"], LogIn), load: () => import("@/features/auth/pages/LoginPage") },
  { ...r("/register", "Create account", "auth", PUBLIC, 2, ["AUTH-02"], UserPlus), load: () => import("@/features/auth/pages/RegisterPage") },
  { ...r("/forgot-password", "Forgot password", "auth", PUBLIC, 2, ["AUTH-03"], KeyRound), load: () => import("@/features/auth/pages/ForgotPasswordPage") },
  { ...r("/reset-password", "Reset password", "auth", PUBLIC, 2, ["AUTH-03"], KeyRound), load: () => import("@/features/auth/pages/ResetPasswordPage") },

  // MEMBER
  { ...r("/app", "Home", "member", MEMBERS, 4, [], LayoutDashboard), load: () => import("@/features/member/pages/MemberDashboard") },
  { ...r("/app/book", "Book a Court", "member", MEMBERS, 3, ["BKG-07"], CalendarPlus), load: () => import("@/features/member/pages/BookCourt") },
  { ...r("/app/social", "Social Play", "member", MEMBERS, 3, ["BKG-18"], Users), load: () => import("@/features/member/pages/SocialPlay") },
  { ...r("/app/bookings", "My Bookings", "member", MEMBERS, 3, [], ListChecks), load: () => import("@/features/member/pages/MyBookings") },
  { ...r("/app/bookings/:id", "Booking Detail", "member", MEMBERS, 3, [], ListChecks), load: () => import("@/features/member/pages/BookingDetail") },
  r("/app/shop", "Shop", "member", MEMBERS, 6, [], ShoppingBag),
  r("/app/cart", "Cart", "member", MEMBERS, 6, [], ShoppingCart),
  r("/app/checkout", "Checkout", "member", MEMBERS, 6, [], CreditCard),
  { ...r("/app/orders", "Orders", "member", MEMBERS, 4, [], Package), load: () => import("@/features/member/pages/OrdersPage") },
  { ...r("/app/orders/:id", "Order Detail", "member", MEMBERS, 4, [], Package), load: () => import("@/features/member/pages/OrderDetailPage") },
  { ...r("/app/tab", "Bar Tab", "member", MEMBERS, 4, ["BAR-06"], Beer), load: () => import("@/features/member/pages/BarTabPage") },
  { ...r("/app/invoices", "Invoices", "member", MEMBERS, 4, [], Receipt), load: () => import("@/features/member/pages/InvoicesPage") },
  { ...r("/app/invoices/:id", "Invoice Detail", "member", MEMBERS, 4, [], FileText), load: () => import("@/features/member/pages/InvoiceDetailPage") },
  { ...r("/app/membership", "Membership", "member", MEMBERS, 4, ["MEM-09"], BadgeCheck), load: () => import("@/features/member/pages/MembershipPage") },
  { ...r("/app/profile", "Profile", "member", MEMBERS, 4, ["MEM-17"], User), load: () => import("@/features/member/pages/ProfilePage") },
  { ...r("/app/card", "Member Card", "member", MEMBERS, 4, ["MEM-02"], IdCard), load: () => import("@/features/member/pages/DigitalCardPage") },
  { ...r("/app/notifications", "Notifications", "member", MEMBERS, 4, ["NTF-01"], Bell), load: () => import("@/features/member/pages/NotificationsPage") },

  // FRONT DESK
  c("/desk", "Desk Overview", DESK, 5, "desk", ClipboardList),
  c("/desk/register", "Register Member", DESK, 5, "desk", UserRoundPlus, ["MEM-01"]),
  c("/desk/availability", "Availability", DESK, 5, "desk", CalendarDays),
  c("/desk/walk-in", "Walk-in Booking", DESK, 5, "desk", Footprints, ["BKG-09"]),
  c("/desk/checkin", "Check-in", DESK, 5, "desk", ScanLine, ["MEM-15"]),
  c("/desk/members/:id", "Member Profile", DESK, 5, "desk", User, ["MEM-13"]),
  c("/desk/bookings", "Bookings", DESK, 5, "desk", ListChecks),
  c("/desk/payments", "Payments", DESK, 5, "desk", Wallet),

  // SHOP CONSOLE
  c("/shop-console", "Point of Sale", SHOP, 6, "shop", Store),
  c("/shop-console/quick", "Quick Sale", SHOP, 6, "shop", Zap),
  c("/shop-console/orders", "Orders", SHOP, 6, "shop", Package),
  c("/shop-console/inventory", "Inventory", SHOP, 6, "shop", Boxes),
  c("/shop-console/restock", "Restock", SHOP, 6, "shop", PackagePlus),
  c("/shop-console/products", "Products", SHOP, 6, "shop", Tags),
  c("/shop-console/purchase-orders", "Purchase Orders", SHOP, 6, "shop", Truck),
  c("/shop-console/returns", "Returns", SHOP, 6, "shop", Undo2),
  c("/shop-console/restring", "Restringing", SHOP, 6, "shop", Wrench),
  c("/shop-console/reports", "Shop Reports", SHOP, 6, "shop", BarChart3),

  // BAR + KDS
  c("/bar", "Bar Floor", BAR, 7, "bar", Wine),
  c("/bar/table/:id", "Table", BAR, 7, "bar", Table2),
  c("/bar/tabs", "Open Tabs", BAR, 7, "bar", Beer),
  c("/bar/bill/:id", "Bill", BAR, 7, "bar", Receipt),
  c("/bar/shift", "Shift", BAR, 7, "bar", Clock),
  c("/bar/closing", "Closing", BAR, 7, "bar", Lock),
  c("/kds", "Kitchen Display", ["KITCHEN", "BAR_STAFF", "MANAGER"], 7, "bar", ChefHat),

  // CRM
  c("/crm", "CRM Overview", CRM, 8, "crm", Contact),
  c("/crm/leads", "Leads", CRM, 8, "crm", Target),
  c("/crm/leads/:id", "Lead Detail", CRM, 8, "crm", Target),
  c("/crm/leads/:id/quote", "Quote", CRM, 8, "crm", FileSignature),
  c("/crm/campaigns", "Campaigns", CRM, 8, "crm", Megaphone),

  // FINANCE
  c("/finance", "Finance Overview", FIN, 9, "finance", Landmark),
  c("/finance/invoices", "Invoices", FIN, 9, "finance", Receipt),
  c("/finance/invoices/:id", "Invoice Detail", FIN, 9, "finance", FileText),
  c("/finance/business-clients", "Business Clients", FIN, 9, "finance", Briefcase),
  c("/finance/payments", "Payments", FIN, 9, "finance", HandCoins),
  c("/finance/expenses", "Expenses", FIN, 9, "finance", Wallet),
  c("/finance/vendors", "Vendors", FIN, 9, "finance", Building),
  c("/finance/vendor-bills", "Vendor Bills", FIN, 9, "finance", FileText),
  c("/finance/gst", "GST", FIN, 9, "finance", Percent),
  c("/finance/pnl", "Profit & Loss", FIN, 9, "finance", TrendingUp),
  c("/finance/reconciliation", "Reconciliation", FIN, 9, "finance", Scale),
  c("/finance/periods", "Periods", FIN, 9, "finance", CalendarRange),

  // HR
  c("/hr", "HR Overview", HR, 10, "hr", UserCog),
  c("/hr/employees", "Employees", HR, 10, "hr", Users),
  c("/hr/employees/:id", "Employee", HR, 10, "hr", User),
  c("/hr/roster", "Roster", HR, 10, "hr", CalendarClock),
  c("/hr/attendance", "Attendance", HR, 10, "hr", Fingerprint),
  c("/hr/leave", "Leave", HR, 10, "hr", Plane),
  c("/hr/payroll", "Payroll", HR, 10, "hr", Banknote),
  c("/hr/payroll/:runId", "Payroll Run", HR, 10, "hr", Banknote),
  c("/hr/holidays", "Holidays", HR, 10, "hr", PartyPopper),
  c("/my", "My Work", STAFF_ROLES, 10, "self", CircleUser),

  // MANAGER
  c("/manager", "Manager Overview", MGR, 11, "manager", Gauge),
  c("/manager/calendar", "Calendar", MGR, 11, "manager", CalendarDays),
  c("/manager/utilisation", "Utilisation", MGR, 11, "manager", Activity),
  c("/manager/overrides", "Overrides", MGR, 11, "manager", SlidersHorizontal),
  c("/manager/blocks", "Court Blocks", MGR, 11, "manager", Ban),
  c("/manager/approvals", "Approvals", MGR, 11, "manager", CheckCheck),

  // OWNER
  c("/owner", "Owner Dashboard", OWN, 11, "owner", Crown),
  c("/owner/reports", "Reports", OWN, 11, "owner", FileBarChart),
  c("/owner/scheduled-reports", "Scheduled Reports", OWN, 11, "owner", CalendarClock),
  c("/owner/share-links", "Share Links", OWN, 11, "owner", Link2),

  // ADMIN
  c("/admin", "Admin Overview", ADM, 12, "admin", Settings),
  c("/admin/club", "Club", ADM, 12, "admin", Building2),
  c("/admin/courts", "Courts", ADM, 12, "admin", LandPlot),
  c("/admin/hours", "Opening Hours", ADM, 12, "admin", Timer),
  c("/admin/plans", "Plans", ADM, 12, "admin", BadgeCheck),
  c("/admin/pricing", "Pricing", ADM, 12, "admin", BadgeIndianRupee),
  c("/admin/taxes", "Taxes", ADM, 12, "admin", Calculator),
  c("/admin/social-templates", "Social Templates", ADM, 12, "admin", MessageSquare),
  c("/admin/leave-types", "Leave Types", ADM, 12, "admin", CalendarOff),
  c("/admin/salary-components", "Salary Components", ADM, 12, "admin", Coins),
  c("/admin/notification-templates", "Notification Templates", ADM, 12, "admin", MailCheck),
  c("/admin/users", "Users & Roles", ADM, 12, "admin", ShieldCheck),
  c("/admin/audit-log", "Audit Log", ADM, 12, "admin", History),
  c("/admin/seed", "Seed Data", ADM, 12, "admin", Sprout),
];

export const hasParams = (path: string) => path.includes(":");

const compiled = routeConfig
  .map((route) => {
    const keys: string[] = [];
    const pattern = route.path.replace(/:([A-Za-z]+)/g, (_, k: string) => {
      keys.push(k);
      return "([^/]+)";
    });
    return { route, keys, regex: new RegExp(`^${pattern}/?$`) };
  })
  // static routes win over parameterised ones
  .sort((a, b) => a.keys.length - b.keys.length);

export function matchRoute(pathname: string): { route: RouteMeta; params: Record<string, string> } | null {
  for (const { route, keys, regex } of compiled) {
    const m = regex.exec(pathname);
    if (m) {
      const params: Record<string, string> = {};
      keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1] ?? "")));
      return { route, params };
    }
  }
  return null;
}
