import {
  Home, Building2, BadgeCheck, CalendarDays, ShoppingBag, Package, ShoppingCart, CreditCard, Sparkles, Mail, Share2,
  LogIn, UserPlus, KeyRound, LayoutDashboard, CalendarPlus, Users, ListChecks, FileText, Beer, Receipt, IdCard, User,
  Bell, ClipboardList, UserRoundPlus, Footprints, ScanLine, Wallet, Store, Zap, Boxes, PackagePlus, Tags, Truck,
  Undo2, Wrench, BarChart3, Wine, Table2, Clock, Lock, ChefHat, Contact, Target, FileSignature, Megaphone, Landmark,
  Briefcase, HandCoins, Building, Percent, TrendingUp, Scale, CalendarRange, UserCog, CalendarClock, Fingerprint,
  Plane, Banknote, PartyPopper, CircleUser, Gauge, type LucideIcon,
} from "lucide-react";
import type { LayoutKind, NavGroupKey, PermissionKey, Phase, RouteMeta } from "@/types/common";

// ─── Shorthand permission key arrays ──────────────────────────────────
const PUBLIC: PermissionKey[] = [];                          // No authentication required
const MEMBER: PermissionKey[] = ["member"];                   // MEMBER only
const ALL_STAFF: PermissionKey[] = ["staff"];                 // Any STAFF role
const DESK: PermissionKey[] = ["FRONT_DESK"];                 // STAFF w/ FRONT_DESK
const SHOP: PermissionKey[] = ["SHOP_INVENTORY"];              // STAFF w/ SHOP_INVENTORY
const BAR: PermissionKey[] = ["POS_BAR"];                      // STAFF w/ POS_BAR
const CRM_ACCESS: PermissionKey[] = ["CRM"];                   // STAFF w/ CRM
const LEADS_ACCESS: PermissionKey[] = ["crm.leads.view"];     // FRONT_DESK or CRM
const FIN: PermissionKey[] = ["FINANCE"];                      // STAFF w/ FINANCE

const r = (
  path: string,
  title: string,
  layout: LayoutKind,
  access: PermissionKey[],
  phase: Phase,
  srsIds: string[],
  icon: LucideIcon,
  group?: NavGroupKey,
): RouteMeta => ({ path, title, layout, access, phase, srsIds, icon, ...(group ? { group } : {}) });

const c = (
  path: string,
  title: string,
  access: PermissionKey[],
  phase: Phase,
  group: NavGroupKey,
  icon: LucideIcon,
  srsIds: string[] = [],
) => r(path, title, "console", access, phase, srsIds, icon, group);

/** Single source of truth for routing AND navigation. */
export const routeConfig: RouteMeta[] = [
  // ─── PUBLIC (no login) ──────────────────────────────────────────────
  { ...r("/", "Home", "public", PUBLIC, 2, ["WEB-01"], Home), load: () => import("@/features/website/pages/Home") },
  { ...r("/facilities", "Facilities", "public", PUBLIC, 8, ["WEB-01"], Building2), load: () => import("@/features/website/pages/FacilitiesPage") },
  { ...r("/plans", "Membership Plans", "public", PUBLIC, 8, ["WEB-02"], BadgeCheck), load: () => import("@/features/website/pages/PlansPage") },
  { ...r("/availability", "This Week", "public", PUBLIC, 8, ["WEB-03"], CalendarDays), load: () => import("@/features/website/pages/AvailabilityPage") },
  { ...r("/shop", "Shop", "public", PUBLIC, 6, ["WEB-04"], ShoppingBag), load: () => import("@/features/shop/pages/ShopCatalogPage") },
  { ...r("/shop/:slug", "Product", "public", PUBLIC, 6, [], Package), load: () => import("@/features/shop/pages/ProductDetailPage") },
  { ...r("/cart", "Cart", "public", PUBLIC, 6, [], ShoppingCart), load: () => import("@/features/shop/pages/CartPage") },
  { ...r("/checkout", "Checkout", "public", PUBLIC, 6, [], CreditCard), load: () => import("@/features/shop/pages/CheckoutPage") },
  { ...r("/trial", "Book a Trial", "public", PUBLIC, 8, ["WEB-05"], Sparkles), load: () => import("@/features/website/pages/TrialBookingPage") },
  { ...r("/contact", "Contact", "public", PUBLIC, 8, ["WEB-07"], Mail), load: () => import("@/features/website/pages/ContactPage") },
  { ...r("/share/:token", "Shared Report", "public", PUBLIC, 11, ["RPT-10"], Share2), load: () => import("@/features/owner/pages/PublicShareReportPage") },

  // ─── AUTH ───────────────────────────────────────────────────────────
  { ...r("/login", "Sign in", "auth", PUBLIC, 2, ["AUTH-01"], LogIn), load: () => import("@/features/auth/pages/LoginPage") },
  { ...r("/register", "Create account", "auth", PUBLIC, 2, ["AUTH-02"], UserPlus), load: () => import("@/features/auth/pages/RegisterPage") },
  { ...r("/forgot-password", "Forgot password", "auth", PUBLIC, 2, ["AUTH-03"], KeyRound), load: () => import("@/features/auth/pages/ForgotPasswordPage") },
  { ...r("/reset-password", "Reset password", "auth", PUBLIC, 2, ["AUTH-03"], KeyRound), load: () => import("@/features/auth/pages/ResetPasswordPage") },

  // ─── MEMBER PORTAL ──────────────────────────────────────────────────
  { ...r("/app", "Home", "member", MEMBER, 4, [], LayoutDashboard), load: () => import("@/features/member/pages/MemberDashboard") },
  { ...r("/app/book", "Book a Court", "member", MEMBER, 3, ["BKG-07"], CalendarPlus), load: () => import("@/features/member/pages/BookCourt") },
  { ...r("/app/social", "Social Play", "member", MEMBER, 3, ["BKG-18"], Users), load: () => import("@/features/member/pages/SocialPlay") },
  { ...r("/app/bookings", "My Bookings", "member", MEMBER, 3, [], ListChecks), load: () => import("@/features/member/pages/MyBookings") },
  { ...r("/app/bookings/:id", "Booking Detail", "member", MEMBER, 3, [], ListChecks), load: () => import("@/features/member/pages/BookingDetail") },
  { ...r("/app/shop", "Shop", "member", MEMBER, 6, [], ShoppingBag), load: () => import("@/features/shop/pages/ShopCatalogPage") },
  { ...r("/app/cart", "Cart", "member", MEMBER, 6, [], ShoppingCart), load: () => import("@/features/shop/pages/CartPage") },
  { ...r("/app/checkout", "Checkout", "member", MEMBER, 6, [], CreditCard), load: () => import("@/features/shop/pages/CheckoutPage") },
  { ...r("/app/orders", "Orders", "member", MEMBER, 4, [], Package), load: () => import("@/features/member/pages/OrdersPage") },
  { ...r("/app/orders/:id", "Order Detail", "member", MEMBER, 4, [], Package), load: () => import("@/features/member/pages/OrderDetailPage") },
  { ...r("/app/tab", "Bar & Tab", "member", MEMBER, 4, ["BAR-06"], Beer), load: () => import("@/features/member/pages/BarTabPage") },
  { ...r("/app/invoices", "Invoices & Payments", "member", MEMBER, 4, [], Receipt), load: () => import("@/features/member/pages/InvoicesPage") },
  { ...r("/app/invoices/:id", "Invoice Detail", "member", MEMBER, 4, [], FileText), load: () => import("@/features/member/pages/InvoiceDetailPage") },
  { ...r("/app/membership", "Membership", "member", MEMBER, 4, ["MEM-09"], BadgeCheck), load: () => import("@/features/member/pages/MembershipPage") },
  { ...r("/app/profile", "Profile", "member", MEMBER, 4, ["MEM-17"], User), load: () => import("@/features/member/pages/ProfilePage") },
  { ...r("/app/card", "Member Card", "member", MEMBER, 4, ["MEM-02"], IdCard), load: () => import("@/features/member/pages/DigitalCardPage") },
  { ...r("/app/notifications", "Notifications", "member", MEMBER, 4, ["NTF-01"], Bell), load: () => import("@/features/member/pages/NotificationsPage") },

  // ─── STAFF HUB & MY WORK ────────────────────────────────────────────
  { ...c("/staff", "Staff Hub", ALL_STAFF, 5, "self", LayoutDashboard), load: () => import("@/features/staff/pages/StaffHub") },
  { ...c("/my", "My Work", ALL_STAFF, 10, "self", CircleUser), load: () => import("@/features/hr/pages/MyWorkPage") },
  { ...c("/my/roster", "My Roster", ALL_STAFF, 10, "self", CalendarClock), load: () => import("@/features/hr/pages/MyRosterPage") },
  { ...c("/my/clock", "Time Clock", ALL_STAFF, 10, "self", Fingerprint), load: () => import("@/features/hr/pages/MyClockPage") },
  { ...c("/my/leave", "My Leave", ALL_STAFF, 10, "self", Plane), load: () => import("@/features/hr/pages/MyLeavePage") },
  { ...c("/my/payslips", "My Payslips", ALL_STAFF, 10, "self", Banknote), load: () => import("@/features/hr/pages/MyPayslipsPage") },

  // ─── FRONT DESK ─────────────────────────────────────────────────────
  { ...c("/desk", "Desk Overview", DESK, 5, "desk", ClipboardList), load: () => import("@/features/desk/pages/DeskOverview") },
  { ...c("/desk/register", "Register Member", DESK, 5, "desk", UserRoundPlus, ["MEM-01"]), load: () => import("@/features/desk/pages/RegisterMember") },
  { ...c("/desk/availability", "Availability", DESK, 5, "desk", CalendarDays), load: () => import("@/features/desk/pages/DeskAvailability") },
  { ...c("/desk/walk-in", "Walk-in Booking", DESK, 5, "desk", Footprints, ["BKG-09"]), load: () => import("@/features/desk/pages/DeskWalkIn") },
  { ...c("/desk/checkin", "Check-in", DESK, 5, "desk", ScanLine, ["MEM-15"]), load: () => import("@/features/desk/pages/DeskCheckin") },
  { ...c("/desk/members/:id", "Member Profile", DESK, 5, "desk", User, ["MEM-13"]), load: () => import("@/features/desk/pages/StaffMemberProfile") },
  { ...c("/desk/bookings", "Bookings", DESK, 5, "desk", ListChecks), load: () => import("@/features/desk/pages/DeskBookings") },
  { ...c("/desk/payments", "Payments", DESK, 5, "desk", Wallet), load: () => import("@/features/desk/pages/DeskPayments") },

  // ─── SHOP CONSOLE ───────────────────────────────────────────────────
  { ...c("/shop-console", "Point of Sale", SHOP, 6, "shop", Store), load: () => import("@/features/shop/pages/ShopPOSPage") },
  { ...c("/shop-console/quick", "Quick Sale", SHOP, 6, "shop", Zap), load: () => import("@/features/shop/pages/ShopQuickSalePage") },
  { ...c("/shop-console/orders", "Orders", SHOP, 6, "shop", Package), load: () => import("@/features/shop/pages/ShopOrdersPage") },
  { ...c("/shop-console/inventory", "Inventory", SHOP, 6, "shop", Boxes), load: () => import("@/features/shop/pages/ShopInventoryPage") },
  { ...c("/shop-console/restock", "Restock", SHOP, 6, "shop", PackagePlus), load: () => import("@/features/shop/pages/ShopRestockPage") },
  { ...c("/shop-console/products", "Products", SHOP, 6, "shop", Tags), load: () => import("@/features/shop/pages/ShopProductsPage") },
  { ...c("/shop-console/purchase-orders", "Purchase Orders", SHOP, 6, "shop", Truck), load: () => import("@/features/shop/pages/ShopPurchaseOrdersPage") },
  { ...c("/shop-console/returns", "Returns", SHOP, 6, "shop", Undo2), load: () => import("@/features/shop/pages/ShopReturnsPage") },
  { ...c("/shop-console/restring", "Restringing", SHOP, 6, "shop", Wrench), load: () => import("@/features/shop/pages/ShopRestringPage") },
  { ...c("/shop-console/reports", "Shop Reports", SHOP, 6, "shop", BarChart3), load: () => import("@/features/shop/pages/ShopReportsPage") },

  // ─── BAR + KDS ──────────────────────────────────────────────────────
  { ...c("/bar", "Bar Floor", BAR, 7, "bar", Wine), load: () => import("@/features/bar/pages/BarFloorPage") },
  { ...c("/bar/table/:id", "Table", BAR, 7, "bar", Table2), load: () => import("@/features/bar/pages/BarTablePage") },
  { ...c("/bar/tabs", "Open Tabs", BAR, 7, "bar", Beer), load: () => import("@/features/bar/pages/BarTabsPage") },
  { ...c("/bar/bill/:id", "Bill", BAR, 7, "bar", Receipt), load: () => import("@/features/bar/pages/BarBillPage") },
  { ...c("/bar/shift", "Shift", BAR, 7, "bar", Clock), load: () => import("@/features/bar/pages/BarShiftPage") },
  { ...c("/bar/closing", "Closing", ADM, 7, "bar", Lock), load: () => import("@/features/bar/pages/BarClosingPage") }, // ADMIN only
  { ...c("/kds", "Kitchen Display", BAR, 7, "bar", ChefHat), load: () => import("@/features/bar/pages/KDSPage") },

  // ─── CRM ────────────────────────────────────────────────────────────
  { ...c("/crm", "CRM Overview", CRM_ACCESS, 8, "crm", Contact), load: () => import("@/features/crm/pages/CrmDashboardPage") },
  { ...c("/crm/leads", "Leads", LEADS_ACCESS, 8, "crm", Target), load: () => import("@/features/crm/pages/CrmLeadsPage") },
  { ...c("/crm/leads/:id", "Lead Detail", LEADS_ACCESS, 8, "crm", Target), load: () => import("@/features/crm/pages/CrmLeadDetailPage") },
  { ...c("/crm/leads/:id/quote", "Quote", CRM_ACCESS, 8, "crm", FileSignature), load: () => import("@/features/crm/pages/CrmQuoteBuilderPage") },
  { ...c("/crm/campaigns", "Campaigns", CRM_ACCESS, 8, "crm", Megaphone), load: () => import("@/features/crm/pages/CrmCampaignsPage") },

  // ─── FINANCE ────────────────────────────────────────────────────────
  { ...c("/finance", "Finance Overview", FIN, 9, "finance", Landmark), load: () => import("@/features/finance/pages/FinanceOverviewPage") },
  { ...c("/finance/invoices", "Invoices", FIN, 9, "finance", Receipt), load: () => import("@/features/finance/pages/FinanceInvoicesPage") },
  { ...c("/finance/invoices/:id", "Invoice Detail", FIN, 9, "finance", FileText), load: () => import("@/features/finance/pages/FinanceInvoiceDetailPage") },
  { ...c("/finance/business-clients", "Business Clients", FIN, 9, "finance", Briefcase), load: () => import("@/features/finance/pages/FinanceBusinessClientsPage") },
  { ...c("/finance/payments", "Payments", FIN, 9, "finance", HandCoins), load: () => import("@/features/finance/pages/FinancePaymentsPage") },
  { ...c("/finance/expenses", "Expenses", FIN, 9, "finance", Wallet), load: () => import("@/features/finance/pages/FinanceExpensesPage") },
  { ...c("/finance/vendors", "Vendors", FIN, 9, "finance", Building), load: () => import("@/features/finance/pages/FinanceVendorsPage") },
  { ...c("/finance/vendor-bills", "Vendor Bills", FIN, 9, "finance", FileText), load: () => import("@/features/finance/pages/FinanceVendorBillsPage") },
  { ...c("/finance/gst", "GST", FIN, 9, "finance", Percent), load: () => import("@/features/finance/pages/FinanceGstPage") },
  { ...c("/finance/pnl", "Profit & Loss", FIN, 9, "finance", TrendingUp), load: () => import("@/features/finance/pages/FinancePnlPage") },
  { ...c("/finance/reconciliation", "Reconciliation", FIN, 9, "finance", Scale), load: () => import("@/features/finance/pages/FinanceReconciliationPage") },
  { ...c("/finance/periods", "Periods", FIN, 9, "finance", CalendarRange), load: () => import("@/features/finance/pages/FinancePeriodsPage") },

  // ─── HR ────────────────────────────────────────────────────────────
  { ...c("/hr", "HR Overview", ALL_STAFF, 10, "hr", UserCog), load: () => import("@/features/hr/pages/HrOverviewPage") },
  { ...c("/hr/employees", "Employees", ALL_STAFF, 10, "hr", Users), load: () => import("@/features/hr/pages/HrEmployeesPage") },
  { ...c("/hr/employees/:id", "Employee", ALL_STAFF, 10, "hr", User), load: () => import("@/features/hr/pages/HrEmployeeDetailPage") },
  { ...c("/hr/roster", "Roster", ALL_STAFF, 10, "hr", CalendarClock), load: () => import("@/features/hr/pages/HrRosterPage") },
  { ...c("/hr/attendance", "Attendance", ALL_STAFF, 10, "hr", Fingerprint), load: () => import("@/features/hr/pages/HrAttendancePage") },
  { ...c("/hr/leave", "Leave", ALL_STAFF, 10, "hr", Plane), load: () => import("@/features/hr/pages/HrLeavePage") },
  { ...c("/hr/payroll", "Payroll", ALL_STAFF, 10, "hr", Banknote), load: () => import("@/features/hr/pages/HrPayrollPage") },
  { ...c("/hr/payroll/:runId", "Payroll Run", ALL_STAFF, 10, "hr", Banknote), load: () => import("@/features/hr/pages/HrPayrollRunPage") },
  { ...c("/hr/holidays", "Holidays", ALL_STAFF, 10, "hr", PartyPopper), load: () => import("@/features/hr/pages/HrHolidaysPage") },
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

export function matchRoute(rawPathname: string): { route: RouteMeta; params: Record<string, string> } | null {
  const pathname = (rawPathname || "/").split("?")[0]?.split("#")[0] || "/";
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
