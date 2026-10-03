// Domain types for CCMS Owner Dashboard & Executive Reports (Phase 11)

export type TimeWindow = "TODAY" | "THIS_WEEK" | "THIS_MONTH";
export type ComparisonType = "PREV_PERIOD" | "LAST_YEAR";

export interface KPIMetric {
  value: number;
  formattedValue: string;
  deltaPercent: number;
  isPositive: boolean;
  sparkline: { v: number }[];
}

export interface RevenueBreakdownItem {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface OperationsKPIs {
  bookingsCount: number;
  bookingsDelta: number;
  utilisationRate: number; // e.g. 74%
  utilisationDelta: number;
  noShowRate: number; // e.g. 3.2%
  cancellationRate: number; // e.g. 5.1%
  socialFillRate: number; // e.g. 88%
}

export interface HeatmapCell {
  day: string; // Mon, Tue, ...
  hour: number; // 6..22
  occupancyPercent: number; // 0..100
  bookingsCount: number;
}

export interface MemberMetrics {
  totalActive: number;
  tierCounts: { tier: string; count: number; color: string }[];
  newMembersThisPeriod: number;
  renewalRate: number; // e.g. 91.4%
  churnRate: number; // e.g. 2.1%
  expiringIn30Days: {
    id: string;
    name: string;
    phone: string;
    tier: string;
    validTill: string;
    daysRemaining: number;
  }[];
}

export interface InventorySnippet {
  stockValue: number;
  lowStockCount: number;
  pendingOnlineOrders: number;
  bestSellers: { name: string; category: string; unitsSold: number; revenue: number }[];
  slowSellers: { name: string; category: string; stock: number; daysSinceSale: number }[];
  lowStockItems: { id: string; name: string; sku: string; stock: number; reorderLevel: number }[];
}

export interface BarSnippet {
  todayRevenue: number;
  ordersHandled: number;
  averageTicket: number;
  openTabsCount: number;
  openTabsValue: number;
  topItems: { name: string; count: number; revenue: number }[];
}

export interface CRMSnippet {
  newLeadsCount: number;
  pipelineValue: number;
  conversionRate: number;
  agingBuckets: {
    label: string; // "0–30 Days", "31–60 Days", "60+ Days"
    receivables: number;
    payables: number;
  }[];
}

export interface DrillDownItem {
  id: string;
  timestamp: string;
  source: string;
  description: string;
  customerName?: string;
  method: string;
  amount: number;
  status: string;
}

export interface ShareLinkRecord {
  id: string;
  token: string;
  title: string;
  scope: "EXECUTIVE_OVERVIEW" | "FINANCIAL_DETAILED" | "OPERATIONS_CAPACITY" | "FULL_BOARD_PACKAGE";
  timeWindow: TimeWindow;
  createdAt: string;
  expiresAt: string;
  viewsCount: number;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  createdByName: string;
  notes?: string;
}

export interface ScheduledReportRecord {
  id: string;
  title: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  sendTime: string; // e.g. "23:00" or "Monday 08:00"
  recipients: string[];
  scope: string;
  format: "PDF" | "CSV" | "EXCEL";
  enabled: boolean;
  lastSentAt?: string;
}
