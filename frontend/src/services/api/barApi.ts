import { apiClient } from "@/lib/axios";

export interface BarTableDto {
  id: string;
  tableNumber: string;
  zone: string;
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED" | "BILL_REQUESTED" | "RESERVED";
  currentOrderId?: string;
  currentBillAmount?: number;
  openSince?: string;
}

export interface KdsTicketItemDto {
  name: string;
  quantity: number;
  notes?: string;
}

export interface KdsTicketDto {
  id: string;
  orderNumber: string;
  tableNumber: string;
  serverName: string;
  items: KdsTicketItemDto[];
  status: "PLACED" | "PREPARING" | "READY" | "SERVED";
  placedAt: string;
  elapsedMinutes: number;
}

export interface SplitBillAllocation {
  personIndex: number;
  amount: number;
}

export interface SplitBillResponse {
  orderId: string;
  ways: number;
  total: number;
  allocations: SplitBillAllocation[];
}

export interface CashShiftDto {
  id: string;
  staffUserId: string;
  scope: string;
  openedAt: string;
  closedAt?: string;
  openingFloat: number;
  expectedCash: number;
  countedCash: number;
  variance: number;
  status: "OPEN" | "CLOSED";
}

export const barApi = {
  getFloorPlan: () =>
    apiClient.get<BarTableDto[]>("/api/bar/floor"),

  getKdsQueue: () =>
    apiClient.get<KdsTicketDto[]>("/api/bar/kds"),

  splitBill: (orderId: string, ways: number) =>
    apiClient.get<SplitBillResponse>(`/api/bar/orders/${orderId}/split`, { ways }),

  transferTable: (tableId: string, targetTableId: string) =>
    apiClient.post<{ success: boolean; message: string }>(
      `/api/bar/tables/${tableId}/transfer`,
      undefined
    ),

  openShift: (data: { openingFloat: number; staffUserId?: string; scope?: string }) =>
    apiClient.post<CashShiftDto>("/api/bar/shifts/open", data),

  closeShift: (data: { shiftId: string; countedCash: number; notes?: string }) =>
    apiClient.post<CashShiftDto>("/api/bar/shifts/close", data),

  getActiveShift: () =>
    apiClient.get<CashShiftDto>("/api/bar/shifts/active"),
};
