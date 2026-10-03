// Sample data and baseline configurations for CCMS Owner Dashboard (Phase 11)

import type {
  ShareLinkRecord,
  ScheduledReportRecord,
  HeatmapCell,
} from "./types";

export const INITIAL_SHARE_LINKS: ShareLinkRecord[] = [
  {
    id: "SHR-101",
    token: "board-oct26-exec",
    title: "October 2026 Executive Summary",
    scope: "EXECUTIVE_OVERVIEW",
    timeWindow: "THIS_MONTH",
    createdAt: "2026-10-01T10:00:00Z",
    expiresAt: "2026-10-31T23:59:59Z",
    viewsCount: 14,
    status: "ACTIVE",
    createdByName: "Sunita Deshmukh (Admin)",
    notes: "Prepared for Managing Director and Advisory Board review.",
  },
  {
    id: "SHR-102",
    token: "finance-q3-audit",
    title: "Q3 2026 Financial & Tax Reconciliation",
    scope: "FINANCIAL_DETAILED",
    timeWindow: "THIS_MONTH",
    createdAt: "2026-09-30T16:30:00Z",
    expiresAt: "2026-10-15T23:59:59Z",
    viewsCount: 38,
    status: "ACTIVE",
    createdByName: "Sunita Deshmukh (Admin)",
    notes: "Shared with external auditors (KPMG Mumbai).",
  },
  {
    id: "SHR-103",
    token: "revoked-partner-digest",
    title: "Commercial Partner Performance (Revoked)",
    scope: "OPERATIONS_CAPACITY",
    timeWindow: "THIS_WEEK",
    createdAt: "2026-09-20T12:00:00Z",
    expiresAt: "2026-10-20T12:00:00Z",
    viewsCount: 6,
    status: "REVOKED",
    createdByName: "Sunita Deshmukh (Admin)",
    notes: "Access revoked due to NDA expiry.",
  },
  {
    id: "SHR-104",
    token: "expired-aug26-report",
    title: "August 2026 Monthly Closing Pack",
    scope: "FULL_BOARD_PACKAGE",
    timeWindow: "THIS_MONTH",
    createdAt: "2026-08-31T20:00:00Z",
    expiresAt: "2026-09-30T23:59:59Z",
    viewsCount: 52,
    status: "EXPIRED",
    createdByName: "Sunita Deshmukh (Admin)",
    notes: "Archived historical report.",
  },
];

export const INITIAL_SCHEDULED_REPORTS: ScheduledReportRecord[] = [
  {
    id: "SCH-01",
    title: "Daily Nightly Closing & Shift Reconciliation",
    frequency: "DAILY",
    sendTime: "23:45 IST (Daily)",
    recipients: ["owner@championsclub.in", "gm@championsclub.in"],
    scope: "Daily Cash, POS, Court Bookings & Shift Float Z-Report",
    format: "PDF",
    enabled: true,
    lastSentAt: "Yesterday at 23:45",
  },
  {
    id: "SCH-02",
    title: "Weekly Club Utilisation & Operations Digest",
    frequency: "WEEKLY",
    sendTime: "Monday 07:00 IST",
    recipients: ["owner@championsclub.in", "operations@championsclub.in"],
    scope: "Court Utilisation, Peak Hours, No-Shows & Social Session Fill",
    format: "EXCEL",
    enabled: true,
    lastSentAt: "29 Sep 2026 at 07:00",
  },
  {
    id: "SCH-03",
    title: "Monthly Board Financial Package & P&L",
    frequency: "MONTHLY",
    sendTime: "1st of Month 09:00 IST",
    recipients: ["owner@championsclub.in", "board@championsclub.in", "cfo@championsclub.in"],
    scope: "Full Financial Ledger, Department P&L, GST & Payroll Liabilities",
    format: "PDF",
    enabled: true,
    lastSentAt: "01 Oct 2026 at 09:00",
  },
];

// Generates 7 days (Mon..Sun) × 17 hours (06:00..22:00) with realistic peak morning & evening court utilisation
export function generatePeakHoursHeatmap(): HeatmapCell[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const cells: HeatmapCell[] = [];

  for (const day of days) {
    const isWeekend = day === "Sat" || day === "Sun";
    for (let hour = 6; hour <= 22; hour++) {
      let occupancy = 25; // baseline

      if (hour >= 6 && hour <= 9) {
        // Morning rush
        occupancy = isWeekend ? 94 : 82;
      } else if (hour >= 10 && hour <= 15) {
        // Afternoon lull
        occupancy = isWeekend ? 72 : 36;
      } else if (hour >= 16 && hour <= 21) {
        // Evening peak
        occupancy = isWeekend ? 98 : 91;
      } else {
        // Late night 22:00
        occupancy = 45;
      }

      // Add a slight variance based on day
      const dayFactor = day === "Wed" ? 0.95 : day === "Sat" ? 1.05 : 1.0;
      const finalOccupancy = Math.min(100, Math.max(10, Math.round(occupancy * dayFactor)));

      cells.push({
        day,
        hour,
        occupancyPercent: finalOccupancy,
        bookingsCount: Math.round((finalOccupancy / 100) * 12), // 12 total courts
      });
    }
  }

  return cells;
}
