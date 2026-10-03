// CCMS Owner Executive Store with reactive client-side state (Phase 11)

import { useSyncExternalStore, useMemo } from "react";
import type {
  TimeWindow,
  ComparisonType,
  KPIMetric,
  RevenueBreakdownItem,
  OperationsKPIs,
  MemberMetrics,
  InventorySnippet,
  BarSnippet,
  CRMSnippet,
  DrillDownItem,
  ShareLinkRecord,
  ScheduledReportRecord,
  HeatmapCell,
} from "./types";
import {
  INITIAL_SHARE_LINKS,
  INITIAL_SCHEDULED_REPORTS,
  generatePeakHoursHeatmap,
} from "./sampleData";
import { INITIAL_PAYMENTS, INITIAL_EXPENSES, INITIAL_VENDOR_BILLS } from "../finance/sampleData";
import { toast } from "@/components/ui/Toast";

export function formatINR(val: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCsv = (str: string | number) => {
    const text = String(str ?? "").replace(/"/g, '""');
    return `"${text}"`;
  };

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.map(escapeCsv).join(","), ...rows.map((row) => row.map(escapeCsv).join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

interface OwnerState {
  timeWindow: TimeWindow;
  comparison: ComparisonType;
  shareLinks: ShareLinkRecord[];
  scheduledReports: ScheduledReportRecord[];
  heatmapData: HeatmapCell[];
  // Drill-down drawer state
  drillDown: {
    isOpen: boolean;
    title: string;
    subtitle: string;
    items: DrillDownItem[];
  };
}

let state: OwnerState = {
  timeWindow: "THIS_MONTH",
  comparison: "PREV_PERIOD",
  shareLinks: INITIAL_SHARE_LINKS,
  scheduledReports: INITIAL_SCHEDULED_REPORTS,
  heatmapData: generatePeakHoursHeatmap(),
  drillDown: {
    isOpen: false,
    title: "",
    subtitle: "",
    items: [],
  },
};

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export const ownerStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },

  setTimeWindow(window: TimeWindow) {
    state = { ...state, timeWindow: window };
    emitChange();
  },

  setComparison(comparison: ComparisonType) {
    state = { ...state, comparison };
    emitChange();
  },

  openDrillDown(title: string, subtitle: string, items: DrillDownItem[]) {
    state = {
      ...state,
      drillDown: {
        isOpen: true,
        title,
        subtitle,
        items,
      },
    };
    emitChange();
  },

  closeDrillDown() {
    state = {
      ...state,
      drillDown: {
        ...state.drillDown,
        isOpen: false,
      },
    };
    emitChange();
  },

  createShareLink(params: {
    title: string;
    scope: ShareLinkRecord["scope"];
    timeWindow: TimeWindow;
    expiresInDays: number;
    notes?: string;
  }) {
    const token = `shr-${Math.random().toString(36).substring(2, 9)}-${Date.now().toString(36)}`;
    const expires = new Date();
    expires.setDate(expires.getDate() + params.expiresInDays);

    const newLink: ShareLinkRecord = {
      id: `SHR-${Date.now().toString().slice(-4)}`,
      token,
      title: params.title,
      scope: params.scope,
      timeWindow: params.timeWindow,
      createdAt: new Date().toISOString(),
      expiresAt: expires.toISOString(),
      viewsCount: 0,
      status: "ACTIVE",
      createdByName: "Sunita Deshmukh (Admin)",
      ...(params.notes ? { notes: params.notes } : {}),
    };

    state = {
      ...state,
      shareLinks: [newLink, ...state.shareLinks],
    };
    emitChange();
    toast.success("Read-only share link generated successfully!");
    return newLink;
  },

  revokeShareLink(id: string) {
    state = {
      ...state,
      shareLinks: state.shareLinks.map((link) =>
        link.id === id ? { ...link, status: "REVOKED" } : link
      ),
    };
    emitChange();
    toast.info("Share link has been revoked. Future viewers will see 'Link no longer valid'.");
  },

  getShareLinkByToken(token: string): ShareLinkRecord | null {
    const link = state.shareLinks.find((l) => l.token === token);
    if (!link) return null;
    return link;
  },

  incrementLinkViews(token: string) {
    state = {
      ...state,
      shareLinks: state.shareLinks.map((l) =>
        l.token === token ? { ...l, viewsCount: l.viewsCount + 1 } : l
      ),
    };
    emitChange();
  },

  toggleScheduledReport(id: string, enabled: boolean) {
    state = {
      ...state,
      scheduledReports: state.scheduledReports.map((r) =>
        r.id === id ? { ...r, enabled } : r
      ),
    };
    emitChange();
    toast.success(`Scheduled report ${enabled ? "activated" : "paused"}.`);
  },
};

export function useOwnerStore() {
  const current = useSyncExternalStore(ownerStore.subscribe, ownerStore.getSnapshot);

  // Compute finance-derived totals
  const computedMetrics = useMemo(() => {
    const { timeWindow, comparison } = current;

    // Filter payments according to timeWindow
    const allCompletedPayments = INITIAL_PAYMENTS.filter((p) => p.status === "COMPLETED");

    let filteredPayments = allCompletedPayments;
    let factor = 1.0;
    let deltaRevenue = 14.8;
    let deltaExpense = 6.2;
    let deltaNet = 22.4;

    if (timeWindow === "TODAY") {
      factor = 0.08; // ~8% of monthly
      filteredPayments = allCompletedPayments.slice(0, 3); // latest today
      deltaRevenue = 8.4;
      deltaExpense = 3.1;
      deltaNet = 11.2;
    } else if (timeWindow === "THIS_WEEK") {
      factor = 0.35; // ~35% of monthly
      filteredPayments = allCompletedPayments.slice(0, 10);
      deltaRevenue = 12.1;
      deltaExpense = 5.4;
      deltaNet = 18.5;
    } else {
      factor = 1.0; // full month
      filteredPayments = allCompletedPayments;
      deltaRevenue = comparison === "LAST_YEAR" ? 28.6 : 14.8;
      deltaExpense = comparison === "LAST_YEAR" ? 11.2 : 6.2;
      deltaNet = comparison === "LAST_YEAR" ? 36.4 : 22.4;
    }

    // Revenue calculations (strict ledger sync)
    const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

    // Revenue by source
    const sourceBuckets: Record<string, number> = {
      COURT: 0,
      MEMBERSHIP: 0,
      SHOP: 0,
      BAR: 0,
    };
    for (const p of filteredPayments) {
      const cur = sourceBuckets[p.source] ?? 0;
      sourceBuckets[p.source] = cur + p.amount;
    }

    const courtRev = sourceBuckets["COURT"] ?? 0;
    const memRev = sourceBuckets["MEMBERSHIP"] ?? 0;
    const shopRev = sourceBuckets["SHOP"] ?? 0;
    const barRev = sourceBuckets["BAR"] ?? 0;

    const revenueBySource: RevenueBreakdownItem[] = [
      {
        name: "Court Bookings",
        amount: courtRev,
        percentage: totalRevenue ? Math.round((courtRev / totalRevenue) * 100) : 0,
        color: "#d5f63a", // Volt
      },
      {
        name: "Memberships",
        amount: memRev,
        percentage: totalRevenue ? Math.round((memRev / totalRevenue) * 100) : 0,
        color: "#38bdf8", // Sky blue
      },
      {
        name: "Pro Shop",
        amount: shopRev,
        percentage: totalRevenue ? Math.round((shopRev / totalRevenue) * 100) : 0,
        color: "#fb923c", // Amber/Orange
      },
      {
        name: "Lounge & Bar",
        amount: barRev,
        percentage: totalRevenue ? Math.round((barRev / totalRevenue) * 100) : 0,
        color: "#a78bfa", // Purple
      },
    ];

    // Revenue by method
    const methodBuckets: Record<string, number> = {
      UPI: 0,
      CARD: 0,
      CASH: 0,
      ONLINE: 0,
    };
    for (const p of filteredPayments) {
      const cur = methodBuckets[p.method] ?? 0;
      methodBuckets[p.method] = cur + p.amount;
    }

    const upiRev = methodBuckets["UPI"] ?? 0;
    const cardRev = methodBuckets["CARD"] ?? 0;
    const onlineRev = methodBuckets["ONLINE"] ?? 0;
    const cashRev = methodBuckets["CASH"] ?? 0;

    const revenueByMethod: RevenueBreakdownItem[] = [
      {
        name: "UPI / QR",
        amount: upiRev,
        percentage: totalRevenue ? Math.round((upiRev / totalRevenue) * 100) : 0,
        color: "#10b981", // Emerald
      },
      {
        name: "Card (EDC POS)",
        amount: cardRev,
        percentage: totalRevenue ? Math.round((cardRev / totalRevenue) * 100) : 0,
        color: "#3b82f6", // Blue
      },
      {
        name: "Online Gateway",
        amount: onlineRev,
        percentage: totalRevenue ? Math.round((onlineRev / totalRevenue) * 100) : 0,
        color: "#d5f63a", // Volt
      },
      {
        name: "Cash Drawer",
        amount: cashRev,
        percentage: totalRevenue ? Math.round((cashRev / totalRevenue) * 100) : 0,
        color: "#f59e0b", // Amber
      },
    ];

    // Expenses calculation
    const baseExpenses = INITIAL_EXPENSES.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = Math.round(baseExpenses * factor);

    const netProfit = totalRevenue - totalExpenses;

    // Amounts Owed (Payables + October Payroll liabilities + GST)
    const unpaidBills = INITIAL_VENDOR_BILLS.filter((b) => b.status !== "PAID").reduce(
      (sum, b) => sum + (b.amount + b.taxAmount - b.paidAmount),
      0
    );
    const amountsOwed = Math.round((unpaidBills + 524000) * factor); // ~5.24L staff payroll liability

    // Receivables (Uncollected corporate invoices + member dues)
    const receivables = Math.round(184200 * factor);

    // KPI Cards Object
    const kpis: {
      revenue: KPIMetric;
      expenses: KPIMetric;
      netProfit: KPIMetric;
      amountsOwed: KPIMetric;
      receivables: KPIMetric;
    } = {
      revenue: {
        value: totalRevenue,
        formattedValue: formatINR(totalRevenue),
        deltaPercent: deltaRevenue,
        isPositive: true,
        sparkline: [{ v: 12 }, { v: 15 }, { v: 14 }, { v: 18 }, { v: 22 }, { v: 24 }, { v: 27 }],
      },
      expenses: {
        value: totalExpenses,
        formattedValue: formatINR(totalExpenses),
        deltaPercent: deltaExpense,
        isPositive: false, // higher expense
        sparkline: [{ v: 8 }, { v: 9 }, { v: 8 }, { v: 10 }, { v: 11 }, { v: 10 }, { v: 12 }],
      },
      netProfit: {
        value: netProfit,
        formattedValue: formatINR(netProfit),
        deltaPercent: deltaNet,
        isPositive: true,
        sparkline: [{ v: 4 }, { v: 6 }, { v: 6 }, { v: 8 }, { v: 11 }, { v: 14 }, { v: 15 }],
      },
      amountsOwed: {
        value: amountsOwed,
        formattedValue: formatINR(amountsOwed),
        deltaPercent: 4.2,
        isPositive: false,
        sparkline: [{ v: 10 }, { v: 9 }, { v: 11 }, { v: 10 }, { v: 9 }, { v: 10 }, { v: 8 }],
      },
      receivables: {
        value: receivables,
        formattedValue: formatINR(receivables),
        deltaPercent: 12.8,
        isPositive: true,
        sparkline: [{ v: 22 }, { v: 20 }, { v: 18 }, { v: 19 }, { v: 16 }, { v: 14 }, { v: 12 }],
      },
    };

    // Operations KPIs
    const operations: OperationsKPIs = {
      bookingsCount: Math.round(184 * factor),
      bookingsDelta: 16.4,
      utilisationRate: 78.4,
      utilisationDelta: 5.2,
      noShowRate: 3.1,
      cancellationRate: 4.8,
      socialFillRate: 91.2,
    };

    // Members Metrics
    const members: MemberMetrics = {
      totalActive: 342,
      tierCounts: [
        { tier: "Gold VIP", count: 88, color: "#d5f63a" },
        { tier: "Silver", count: 146, color: "#38bdf8" },
        { tier: "Bronze", count: 84, color: "#fb923c" },
        { tier: "Guest Play", count: 24, color: "#a78bfa" },
      ],
      newMembersThisPeriod: Math.round(28 * factor),
      renewalRate: 92.6,
      churnRate: 1.8,
      expiringIn30Days: [
        { id: "CC-000123", name: "Pratham Patel", phone: "+91 98201 12345", tier: "Gold", validTill: "2026-11-14", daysRemaining: 42 },
        { id: "CC-000144", name: "Ananya Iyer", phone: "+91 98401 55667", tier: "Gold", validTill: "2026-10-18", daysRemaining: 15 },
        { id: "CC-000189", name: "Vikram Malhotra", phone: "+91 98210 11223", tier: "Silver", validTill: "2026-10-22", daysRemaining: 19 },
        { id: "CC-000210", name: "Pooja Reddy", phone: "+91 98112 33445", tier: "Silver", validTill: "2026-10-29", daysRemaining: 26 },
      ],
    };

    // Inventory snippet
    const inventory: InventorySnippet = {
      stockValue: 842500,
      lowStockCount: 4,
      pendingOnlineOrders: 3,
      bestSellers: [
        { name: "Yonex Mavis 350 Shuttle (Yellow)", category: "Shuttles", unitsSold: 142, revenue: 163300 },
        { name: "Head Tour XT Tennis Balls (3-Can)", category: "Balls", unitsSold: 98, revenue: 63700 },
        { name: "Wilson Pro Overgrip 3-Pack", category: "Grips", unitsSold: 84, revenue: 37800 },
      ],
      slowSellers: [
        { name: "Tecnifibre Carboflex 125 Squash Racket", category: "Rackets", stock: 8, daysSinceSale: 24 },
        { name: "Babolat Pure Drive 2026", category: "Rackets", stock: 5, daysSinceSale: 18 },
      ],
      lowStockItems: [
        { id: "SKU-001", name: "Head Tour XT Tennis Balls", sku: "BALL-TEN-HD01", stock: 3, reorderLevel: 15 },
        { id: "SKU-004", name: "Wilson Pro Overgrip", sku: "ACC-GRP-WIL01", stock: 4, reorderLevel: 20 },
        { id: "SKU-009", name: "Electrolyte Hydration Drink (Lime)", sku: "FNB-BEV-HYD01", stock: 6, reorderLevel: 24 },
      ],
    };

    // Bar snippet
    const bar: BarSnippet = {
      todayRevenue: Math.round(48600 * factor),
      ordersHandled: Math.round(76 * factor),
      averageTicket: 640,
      openTabsCount: 4,
      openTabsValue: 8450,
      topItems: [
        { name: "Cold Brew Highball", count: 42, revenue: 15960 },
        { name: "Avocado Chicken Sourdough", count: 28, revenue: 12600 },
        { name: "Protein Whey Smoothie (Berry)", count: 24, revenue: 8400 },
      ],
    };

    // CRM snippet
    const crm: CRMSnippet = {
      newLeadsCount: Math.round(36 * factor),
      pipelineValue: 1420000,
      conversionRate: 34.2,
      agingBuckets: [
        { label: "0–30 Days", receivables: 112000, payables: 84000 },
        { label: "31–60 Days", receivables: 48000, payables: 24000 },
        { label: "60+ Days", receivables: 24200, payables: 12000 },
      ],
    };

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      kpis,
      revenueBySource,
      revenueByMethod,
      operations,
      members,
      inventory,
      bar,
      crm,
      filteredPayments,
    };
  }, [current.timeWindow, current.comparison]);

  return {
    ...current,
    ...computedMetrics,
    setTimeWindow: ownerStore.setTimeWindow,
    setComparison: ownerStore.setComparison,
    openDrillDown: ownerStore.openDrillDown,
    closeDrillDown: ownerStore.closeDrillDown,
    createShareLink: ownerStore.createShareLink,
    revokeShareLink: ownerStore.revokeShareLink,
    getShareLinkByToken: ownerStore.getShareLinkByToken,
    incrementLinkViews: ownerStore.incrementLinkViews,
    toggleScheduledReport: ownerStore.toggleScheduledReport,
  };
}
