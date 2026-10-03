// Immutable Audit Log Store (AUTH-06, NFR-06)
import { useSyncExternalStore } from "react";
import type { AuditLogEntry } from "./types";
import { toast } from "@/components/ui/Toast";

export const INITIAL_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: "AUD-2026-1001",
    timestamp: "2026-10-03T22:15:00Z",
    userName: "Sunita Deshmukh",
    userRole: "ADMIN",
    action: "PERMISSION_GROUP_CHANGE",
    entity: "Staff Account",
    entityId: "STF-004 (Meera Iyer)",
    reason: "Assigned CRM capability group following front-desk promotions committee review.",
    approver: "Sunita Deshmukh (Admin)",
    beforeState: {
      staffId: "STF-004",
      name: "Meera Iyer",
      groups: ["FRONT_DESK"],
      status: "ACTIVE",
    },
    afterState: {
      staffId: "STF-004",
      name: "Meera Iyer",
      groups: ["FRONT_DESK", "CRM"],
      status: "ACTIVE",
    },
  },
  {
    id: "AUD-2026-1002",
    timestamp: "2026-10-03T18:30:00Z",
    userName: "Anita Desai",
    userRole: "STAFF",
    action: "STOCK_ADJUSTMENT",
    entity: "Pro Shop Inventory",
    entityId: "SKU-RKT-BAB01",
    reason: "Physical inventory audit write-off: Babolat racket hairline frame fracture during demo stringing.",
    approver: "Sunita Deshmukh (Admin)",
    beforeState: {
      sku: "SKU-RKT-BAB01",
      name: "Babolat Pure Drive 2026",
      stockQuantity: 12,
      condition: "NEW",
    },
    afterState: {
      sku: "SKU-RKT-BAB01",
      name: "Babolat Pure Drive 2026",
      stockQuantity: 11,
      writtenOffCount: 1,
      lossValue: 18500,
    },
  },
  {
    id: "AUD-2026-1003",
    timestamp: "2026-10-03T16:20:00Z",
    userName: "Rohit Verma",
    userRole: "STAFF",
    action: "REFUND",
    entity: "Booking Payment",
    entityId: "PAY-2026-0922",
    reason: "Member refund: Tennis Court 1 booking cancelled due to torrential monsoon rainfall.",
    approver: "Sunita Deshmukh (Admin)",
    beforeState: {
      paymentId: "PAY-2026-0922",
      bookingId: "BKG-7690",
      amount: 1200,
      paymentStatus: "COMPLETED",
    },
    afterState: {
      paymentId: "PAY-2026-0922",
      bookingId: "BKG-7690",
      amount: 1200,
      paymentStatus: "REFUNDED",
      refundTxn: "RF-UPI-9912048",
    },
  },
  {
    id: "AUD-2026-1004",
    timestamp: "2026-10-03T14:20:00Z",
    userName: "Sunita Deshmukh",
    userRole: "ADMIN",
    action: "CAP_OVERRIDE",
    entity: "Booking Cap Exception",
    entityId: "CC-000123 (Pratham Patel)",
    reason: "Hosting visiting club delegates from Bombay Gymkhana for corporate exhibition series.",
    approver: "Sunita Deshmukh (Admin)",
    beforeState: {
      memberId: "CC-000123",
      dailyCap: 2,
      targetDate: "2026-10-05",
    },
    afterState: {
      memberId: "CC-000123",
      dailyCap: 4,
      targetDate: "2026-10-05",
      overrideType: "EXPANSION",
    },
  },
  {
    id: "AUD-2026-1005",
    timestamp: "2026-10-02T23:45:00Z",
    userName: "Aarav Mehta",
    userRole: "STAFF",
    action: "DAY_REOPEN",
    entity: "Bar Register Session",
    entityId: "SHF-BAR-01",
    reason: "Reopen Afternoon Shift Register #1 to correct miscategorized ₹2,400 UPI transaction before Z-Report lock.",
    approver: "Sunita Deshmukh (Admin)",
    beforeState: {
      shiftId: "SHF-BAR-01",
      status: "CLOSED",
      totalReported: 46800,
    },
    afterState: {
      shiftId: "SHF-BAR-01",
      status: "REOPENED_FOR_AUDIT",
      totalReported: 49200,
    },
  },
  {
    id: "AUD-2026-1006",
    timestamp: "2026-10-01T17:15:00Z",
    userName: "Sunita Deshmukh",
    userRole: "ADMIN",
    action: "PRICE_OVERRIDE",
    entity: "Court Booking Tariff",
    entityId: "BKG-7714",
    reason: "State Ranking Tournament Finalist sponsorship entitlement applied as complimentary court reservation.",
    approver: "Sunita Deshmukh (Admin)",
    beforeState: {
      bookingId: "BKG-7714",
      court: "Tennis Court 1",
      standardRate: 1200,
    },
    afterState: {
      bookingId: "BKG-7714",
      court: "Tennis Court 1",
      standardRate: 1200,
      appliedRate: 0,
      waiverType: "SPONSORSHIP",
    },
  },
  {
    id: "AUD-2026-1007",
    timestamp: "2026-09-30T19:00:00Z",
    userName: "Sunita Deshmukh",
    userRole: "ADMIN",
    action: "PAYROLL_RUN",
    entity: "HR Payroll Cycle",
    entityId: "PAYROLL-2026-09",
    reason: "September 2026 biometric-verified salary cycle authorization across 28 permanent club staff.",
    approver: "Sunita Deshmukh (Admin)",
    beforeState: {
      payrollRun: "PAYROLL-2026-09",
      status: "DRAFT_CALCULATED",
      grossAmount: 642000,
    },
    afterState: {
      payrollRun: "PAYROLL-2026-09",
      status: "EXECUTED_DISBURSED",
      netDisbursed: 578000,
      tdsDeducted: 44000,
      pfContribution: 20000,
    },
  },
];

let entries: AuditLogEntry[] = [...INITIAL_AUDIT_LOG];
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export const adminAuditStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return entries;
  },

  /** Log a new permanent audit trail entry */
  logAction(entry: Omit<AuditLogEntry, "id" | "timestamp">) {
    const newEntry: AuditLogEntry = {
      id: `AUD-2026-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    entries = [newEntry, ...entries];
    emitChange();
  },

  /** Export audit log as formatted CSV download */
  exportCSV() {
    const headers = ["ID", "Timestamp", "User", "Role", "Action", "Entity", "Entity ID", "Reason", "Approver"];
    const rows = entries.map((e) => [
      e.id,
      e.timestamp,
      `"${e.userName.replace(/"/g, '""')}"`,
      e.userRole,
      e.action,
      `"${e.entity.replace(/"/g, '""')}"`,
      `"${e.entityId.replace(/"/g, '""')}"`,
      `"${e.reason.replace(/"/g, '""')}"`,
      `"${(e.approver || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ccms_immutable_audit_log_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Audit log exported to CSV successfully!");
  },
};

export function useAdminAuditStore() {
  const list = useSyncExternalStore(adminAuditStore.subscribe, adminAuditStore.getSnapshot);
  return {
    entries: list,
    logAction: adminAuditStore.logAction,
    exportCSV: adminAuditStore.exportCSV,
  };
}
