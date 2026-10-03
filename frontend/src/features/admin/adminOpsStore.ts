// CCMS Admin Operations Store with reactive state (Phase 11)

import { useSyncExternalStore } from "react";
import type {
  CourtResource,
  AdminResourceBooking,
  CourtBlockRecord,
  AdminOverrideRecord,
  AdminApprovalItem,
  UtilisationDataPoint,
} from "./types";
import { toast } from "@/components/ui/Toast";

export const ADMIN_COURTS: CourtResource[] = [
  { id: "CRT-T1", name: "Tennis Court 1 (Clay)", sport: "tennis", isIndoor: false, status: "OPERATIONAL" },
  { id: "CRT-T2", name: "Tennis Court 2 (Synthetic)", sport: "tennis", isIndoor: true, status: "OPERATIONAL" },
  { id: "CRT-T3", name: "Tennis Court 3 (Synthetic)", sport: "tennis", isIndoor: true, status: "OPERATIONAL" },
  { id: "CRT-B1", name: "Badminton Court 1 (Teak)", sport: "badminton", isIndoor: true, status: "OPERATIONAL" },
  { id: "CRT-B2", name: "Badminton Court 2 (Teak)", sport: "badminton", isIndoor: true, status: "OPERATIONAL" },
  { id: "CRT-S1", name: "Squash Court 1 (Glass Back)", sport: "squash", isIndoor: true, status: "OPERATIONAL" },
  { id: "CRT-P1", name: "Padel Court 1 (Panoramic)", sport: "padel", isIndoor: false, status: "OPERATIONAL" },
  { id: "CRT-P2", name: "Padel Court 2 (Standard)", sport: "padel", isIndoor: false, status: "OPERATIONAL" },
];

export const INITIAL_RESOURCE_BOOKINGS: AdminResourceBooking[] = [
  {
    id: "BKG-7712",
    courtId: "CRT-T2",
    courtName: "Tennis Court 2 (Synthetic)",
    sport: "tennis",
    date: "2026-10-05",
    startTime: "07:00",
    endTime: "08:00",
    memberName: "Rohan Varma",
    memberTier: "Gold",
    price: 1200,
    status: "CONFIRMED",
    notes: "Prefers Wilson US Open balls at court gate.",
  },
  {
    id: "BKG-7713",
    courtId: "CRT-T2",
    courtName: "Tennis Court 2 (Synthetic)",
    sport: "tennis",
    date: "2026-10-05",
    startTime: "08:00",
    endTime: "09:00",
    memberName: "Pratham Patel",
    memberTier: "Gold",
    price: 1200,
    status: "CONFIRMED",
    notes: "Regular morning sparring session.",
  },
  {
    id: "BKG-7714",
    courtId: "CRT-T1",
    courtName: "Tennis Court 1 (Clay)",
    sport: "tennis",
    date: "2026-10-05",
    startTime: "06:30",
    endTime: "07:30",
    memberName: "Vikram Malhotra",
    memberTier: "Silver",
    price: 1000,
    status: "CONFIRMED",
  },
  {
    id: "BKG-7715",
    courtId: "CRT-B1",
    courtName: "Badminton Court 1 (Teak)",
    sport: "badminton",
    date: "2026-10-05",
    startTime: "07:00",
    endTime: "08:00",
    memberName: "Ananya Iyer",
    memberTier: "Gold",
    price: 800,
    status: "CONFIRMED",
  },
  {
    id: "BKG-7716",
    courtId: "CRT-B2",
    courtName: "Badminton Court 2 (Teak)",
    sport: "badminton",
    date: "2026-10-05",
    startTime: "08:00",
    endTime: "09:00",
    memberName: "Pooja Reddy",
    memberTier: "Silver",
    price: 800,
    status: "CONFIRMED",
  },
  {
    id: "BKG-7717",
    courtId: "CRT-P1",
    courtName: "Padel Court 1 (Panoramic)",
    sport: "padel",
    date: "2026-10-05",
    startTime: "18:00",
    endTime: "19:00",
    memberName: "Kunal Shah",
    memberTier: "Guest",
    price: 1600,
    status: "CONFIRMED",
  },
  {
    id: "BKG-7718",
    courtId: "CRT-S1",
    courtName: "Squash Court 1 (Glass Back)",
    sport: "squash",
    date: "2026-10-05",
    startTime: "19:00",
    endTime: "20:00",
    memberName: "Devendra Mehta",
    memberTier: "Gold",
    price: 900,
    status: "CONFIRMED",
  },
];

export const INITIAL_COURT_BLOCKS: CourtBlockRecord[] = [
  {
    id: "BLK-001",
    courtId: "CRT-T1",
    courtName: "Tennis Court 1 (Clay)",
    sport: "tennis",
    date: "2026-10-06",
    startTime: "12:00",
    endTime: "16:00",
    reason: "MAINTENANCE",
    notes: "Clay court rolling and base line repainting maintenance.",
    status: "ACTIVE",
    blockedBy: "Sunita Deshmukh (Admin)",
    createdAt: "2026-10-02T11:00:00Z",
    affectedBookingIds: [],
  },
  {
    id: "BLK-002",
    courtId: "CRT-P2",
    courtName: "Padel Court 2 (Standard)",
    sport: "padel",
    date: "2026-10-10",
    startTime: "08:00",
    endTime: "14:00",
    reason: "TOURNAMENT",
    notes: "Mumbai Monsoon Padel Trophy Open Championship Quarter-Finals.",
    status: "ACTIVE",
    blockedBy: "Sunita Deshmukh (Admin)",
    createdAt: "2026-10-01T15:30:00Z",
    affectedBookingIds: ["BKG-7722", "BKG-7723"],
  },
];

export const INITIAL_OVERRIDES: AdminOverrideRecord[] = [
  {
    id: "OVR-2026-081",
    type: "DAILY_CAP",
    memberId: "CC-000123",
    memberName: "Pratham Patel",
    targetDate: "2026-10-05",
    beforeValue: "2 Bookings/Day (Cap)",
    afterValue: "4 Bookings/Day (Granted)",
    reason: "Hosting visiting club delegates from Bombay Gymkhana for exhibition series.",
    approvedBy: "Sunita Deshmukh (Admin)",
    timestamp: "2026-10-03T14:20:00Z",
  },
  {
    id: "OVR-2026-082",
    type: "PRICE_OVERRIDE",
    memberId: "CC-000144",
    memberName: "Ananya Iyer",
    targetDate: "2026-10-02",
    beforeValue: "₹1,200 / hr",
    afterValue: "₹0 / hr (Complimentary)",
    reason: "State Ranking Tournament Finalist sponsorship entitlement.",
    approvedBy: "Sunita Deshmukh (Admin)",
    timestamp: "2026-10-01T16:45:00Z",
  },
  {
    id: "OVR-2026-083",
    type: "TIER_DISCOUNT",
    memberId: "CC-000189",
    memberName: "Vikram Malhotra",
    targetDate: "2026-09-28",
    beforeValue: "Standard Silver (10%)",
    afterValue: "Gold Pro Rate (20%)",
    reason: "Goodwill adjustment following court surface delay on Court 3.",
    approvedBy: "Sunita Deshmukh (Admin)",
    timestamp: "2026-09-28T18:10:00Z",
  },
];

export const INITIAL_APPROVALS: AdminApprovalItem[] = [
  {
    id: "APP-001",
    type: "TAB_TRANSFER",
    title: "Lounge Tab Transfer to Member Account",
    description: "Transfer unpaid Table 4 dinner tab balance of ₹1,850 to Member Pratham Patel (CC-000123).",
    requestedBy: "Aarav Mehta (Lounge Bar Lead)",
    requestedAt: "2026-10-03T22:15:00Z",
    amount: 1850,
    entityRef: "TAB-402",
    status: "PENDING",
  },
  {
    id: "APP-002",
    type: "VOID_COMP",
    title: "F&B Item Void / Comp Authorization",
    description: "Comp 2x Cold Brew and Wagyu Sliders (₹1,450) due to 45min kitchen ticket delay.",
    requestedBy: "Kabir Khan (Kitchen Lead)",
    requestedAt: "2026-10-03T21:40:00Z",
    amount: 1450,
    entityRef: "ORD-9912",
    status: "PENDING",
  },
  {
    id: "APP-003",
    type: "STOCK_WRITEOFF",
    title: "Pro Shop Damaged Inventory Write-off",
    description: "Write-off 1x Babolat Pure Drive 2026 (₹18,500) with hairline graphite fracture during stringing test.",
    requestedBy: "Anita Desai (Pro Shop Manager)",
    requestedAt: "2026-10-03T18:00:00Z",
    amount: 18500,
    entityRef: "SKU-RKT-BAB01",
    status: "PENDING",
  },
  {
    id: "APP-004",
    type: "BAR_REOPEN",
    title: "Emergency Bar Shift Re-open for Late Audit",
    description: "Reopen Afternoon Shift Register #1 to correct a miscategorized ₹2,400 UPI transaction before final Z-Report.",
    requestedBy: "Aarav Mehta (Bar)",
    requestedAt: "2026-10-03T17:30:00Z",
    entityRef: "SHF-BAR-01",
    status: "PENDING",
  },
  {
    id: "APP-005",
    type: "REFUND",
    title: "Weather Disruption Court Refund",
    description: "Process ₹1,200 full refund to UPI for Tennis Court 1 booking cancelled due to sudden rainfall.",
    requestedBy: "Rohit Verma (Front Desk)",
    requestedAt: "2026-10-03T16:15:00Z",
    amount: 1200,
    entityRef: "BKG-7690",
    status: "PENDING",
  },
  {
    id: "APP-006",
    type: "LEAVE_APPROVAL",
    title: "Staff Medical Leave Approval (4 Days)",
    description: "Meera Iyer (Front Desk) medical leave request from 07 Oct to 10 Oct 2026.",
    requestedBy: "Meera Iyer",
    requestedAt: "2026-10-02T10:00:00Z",
    entityRef: "LEV-002",
    status: "PENDING",
  },
];

interface AdminOpsState {
  courts: CourtResource[];
  bookings: AdminResourceBooking[];
  blocks: CourtBlockRecord[];
  overrides: AdminOverrideRecord[];
  approvals: AdminApprovalItem[];
  selectedDate: string; // YYYY-MM-DD
}

let state: AdminOpsState = {
  courts: ADMIN_COURTS,
  bookings: INITIAL_RESOURCE_BOOKINGS,
  blocks: INITIAL_COURT_BLOCKS,
  overrides: INITIAL_OVERRIDES,
  approvals: INITIAL_APPROVALS,
  selectedDate: "2026-10-05",
};

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export const adminOpsStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },

  setSelectedDate(date: string) {
    state = { ...state, selectedDate: date };
    emitChange();
  },

  rescheduleBooking(bookingId: string, targetCourtId: string, newStartTime: string) {
    const targetCourt = state.courts.find((c) => c.id === targetCourtId);
    if (!targetCourt) return;

    // Calculate new end time (assuming 60 min session)
    const parts = newStartTime.split(":");
    const h = Number(parts[0] || "0");
    const m = Number(parts[1] || "0");
    const endH = String(h + 1).padStart(2, "0");
    const newEndTime = `${endH}:${String(m).padStart(2, "0")}`;

    state = {
      ...state,
      bookings: state.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              courtId: targetCourt.id,
              courtName: targetCourt.name,
              sport: targetCourt.sport,
              startTime: newStartTime,
              endTime: newEndTime,
              notes: `${b.notes || ""}; Rescheduled by Admin to ${targetCourt.name} at ${newStartTime}`,
            }
          : b
      ),
    };
    emitChange();
    toast.success(`Booking ${bookingId} rescheduled to ${targetCourt.name} at ${newStartTime}!`);
  },

  createCourtBlock(params: {
    courtId: string;
    date: string;
    startTime: string;
    endTime: string;
    reason: CourtBlockRecord["reason"];
    notes: string;
    cancelAffectedBookings: boolean;
    cancellationReason?: string;
  }) {
    const court = state.courts.find((c) => c.id === params.courtId);
    if (!court) return;

    // Detect affected bookings
    const affected = state.bookings.filter(
      (b) =>
        b.courtId === params.courtId &&
        b.date === params.date &&
        b.status !== "CANCELLED" &&
        b.startTime >= params.startTime &&
        b.startTime < params.endTime
    );

    const affectedIds = affected.map((b) => b.id);

    // Cancel affected bookings if requested
    let updatedBookings = state.bookings;
    if (params.cancelAffectedBookings && affectedIds.length > 0) {
      updatedBookings = state.bookings.map((b) =>
        affectedIds.includes(b.id)
          ? {
              ...b,
              status: "CANCELLED" as const,
              notes: `${b.notes || ""}; Cancelled due to court block: ${params.cancellationReason || params.notes}`,
            }
          : b
      );
    }

    const newBlock: CourtBlockRecord = {
      id: `BLK-${Date.now().toString().slice(-4)}`,
      courtId: court.id,
      courtName: court.name,
      sport: court.sport,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      reason: params.reason,
      notes: params.notes,
      status: "ACTIVE",
      blockedBy: "Sunita Deshmukh (Admin)",
      createdAt: new Date().toISOString(),
      affectedBookingIds: affectedIds,
    };

    state = {
      ...state,
      blocks: [newBlock, ...state.blocks],
      bookings: updatedBookings,
    };
    emitChange();
    toast.success(
      `Court ${court.name} blocked (${params.startTime} - ${params.endTime}). ${
        params.cancelAffectedBookings ? `${affectedIds.length} affected bookings cancelled & refunded.` : ""
      }`
    );
  },

  unblockCourt(blockId: string) {
    state = {
      ...state,
      blocks: state.blocks.map((blk) =>
        blk.id === blockId ? { ...blk, status: "RELEASED" as const } : blk
      ),
    };
    emitChange();
    toast.info("Court maintenance block lifted. Court returned to available inventory.");
  },

  grantCapOverride(params: {
    memberId: string;
    memberName: string;
    targetDate: string;
    maxBookings: number;
    reason: string;
  }) {
    const newOverride: AdminOverrideRecord = {
      id: `OVR-${Date.now().toString().slice(-4)}`,
      type: "DAILY_CAP",
      memberId: params.memberId,
      memberName: params.memberName,
      targetDate: params.targetDate,
      beforeValue: "2 Bookings/Day (Default Cap)",
      afterValue: `${params.maxBookings} Bookings/Day (Override)`,
      reason: params.reason,
      approvedBy: "Sunita Deshmukh (Admin)",
      timestamp: new Date().toISOString(),
    };

    state = {
      ...state,
      overrides: [newOverride, ...state.overrides],
    };
    emitChange();
    toast.success(`Daily booking cap override granted for ${params.memberName}!`);
  },

  approveItem(id: string, approver: string, comment?: string) {
    state = {
      ...state,
      approvals: state.approvals.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "APPROVED" as const,
              reviewedBy: approver,
              reviewComment: comment || "Approved by Admin",
              reviewedAt: new Date().toISOString(),
            }
          : item
      ),
    };
    emitChange();
    toast.success("Request approved and action executed.");
  },

  rejectItem(id: string, approver: string, comment?: string) {
    state = {
      ...state,
      approvals: state.approvals.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "REJECTED" as const,
              reviewedBy: approver,
              reviewComment: comment || "Declined due to policy guidelines",
              reviewedAt: new Date().toISOString(),
            }
          : item
      ),
    };
    emitChange();
    toast.info("Request rejected. Staff member notified.");
  },
};

export function useAdminOpsStore() {
  const current = useSyncExternalStore(adminOpsStore.subscribe, adminOpsStore.getSnapshot);

  // Compute utilisation analytics
  const utilisationData: UtilisationDataPoint[] = current.courts.map((court) => {
    const courtBookings = current.bookings.filter(
      (b) => b.courtId === court.id && b.status !== "CANCELLED"
    );
    const availableHours = 16; // 06:00 to 22:00
    const bookedHours = courtBookings.length * 1.0;
    const utilisationRate = Math.min(100, Math.round((bookedHours / availableHours) * 100));
    const revenue = courtBookings.reduce((sum, b) => sum + b.price, 0);

    return {
      courtId: court.id,
      courtName: court.name,
      sport: court.sport,
      availableHours,
      bookedHours,
      utilisationRate,
      peakHour: "18:00 – 21:00",
      revenue,
    };
  });

  return {
    ...current,
    utilisationData,
    setSelectedDate: adminOpsStore.setSelectedDate,
    rescheduleBooking: adminOpsStore.rescheduleBooking,
    createCourtBlock: adminOpsStore.createCourtBlock,
    unblockCourt: adminOpsStore.unblockCourt,
    grantCapOverride: adminOpsStore.grantCapOverride,
    approveItem: adminOpsStore.approveItem,
    rejectItem: adminOpsStore.rejectItem,
  };
}
