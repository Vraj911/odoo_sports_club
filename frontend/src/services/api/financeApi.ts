import { apiClient } from "@/lib/axios";

export interface InvoiceDto {
  id: string;
  invoiceNumber: string;
  memberId?: string;
  customerName?: string;
  customerPhone?: string;
  amount: number;
  taxAmount: number;
  total: number;
  status: "PAID" | "PENDING" | "CANCELLED" | "PARTIALLY_PAID";
  date: string;
  dueDate?: string;
  items?: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
}

export interface PaymentDueDto {
  id: string;
  memberId: string;
  memberName: string;
  refType: string;
  refId: string;
  amount: number;
  dueSince: string;
  status: "OPEN" | "COLLECTED" | "WRITTEN_OFF";
}

export interface RecordPaymentRequest {
  refType: "BOOKING" | "MEMBERSHIP" | "SHOP" | "BAR" | "DUE";
  refId: string;
  memberId?: string;
  amount: number;
  paymentMethod: "CASH" | "CARD" | "UPI" | "BANK_TRANSFER";
  tenderedCash?: number;
  cashShiftId?: string;
  notes?: string;
}

export interface PaymentResponseDto {
  paymentId: string;
  status: string;
  amount: number;
  tendered?: number;
  changeGiven?: number;
  paymentMethod: string;
  timestamp: string;
}

export const financeApi = {
  listInvoices: (status?: string) =>
    apiClient.get<InvoiceDto[]>("/api/invoices", status ? { status } : undefined),

  getInvoice: (id: string) =>
    apiClient.get<InvoiceDto>(`/api/invoices/${id}`),

  listDues: (memberId?: string) =>
    apiClient.get<PaymentDueDto[]>("/api/dues", memberId ? { memberId } : undefined),

  collectDue: (dueId: string, data: { paymentMethod: string; amount?: number; cashShiftId?: string }) =>
    apiClient.post<PaymentResponseDto>(`/api/dues/${dueId}/collect`, data),

  writeOffDue: (dueId: string, reason: string) =>
    apiClient.post<{ dueId: string; status: string }>(`/api/dues/${dueId}/write-off`, { reason }),

  payNow: (data: { intentId: string; memberId?: string; amount: number }) =>
    apiClient.post<PaymentResponseDto>("/api/payments/pay-now", data),

  recordManualPayment: (data: RecordPaymentRequest) =>
    apiClient.post<PaymentResponseDto>("/api/payments/manual", data),

  createRefund: (paymentId: string, data: { amount: number; reason: string }) =>
    apiClient.post<{ refundId: string; amount: number; status: string }>(
      `/api/payments/${paymentId}/refunds`,
      data
    ),
};
