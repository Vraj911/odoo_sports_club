// Types for CCMS Finance module (Payments Ledger, Invoices, Clients, Expenses, Vendors, GST, P&L, Periods)

export type PaymentSource = "COURT" | "MEMBERSHIP" | "SHOP" | "BAR" | "OTHER";
export type PaymentMethod = "CASH" | "CARD" | "UPI" | "ONLINE";
export type PaymentStatus = "COMPLETED" | "REFUNDED" | "PARTIALLY_REFUNDED" | "FAILED" | "FAILED_RETRIED";

export interface PaymentRetryEvent {
  timestamp: string;
  attempt: number;
  status: "FAILED" | "SUCCESS";
  reason?: string;
  gatewayResponse?: string;
}

export interface PaymentRecord {
  id: string; // e.g. "PAY-2026-0101"
  timestamp: string; // ISO string
  ref: string; // Transaction reference or UPI ID
  source: PaymentSource;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  invoiceId?: string | undefined; // e.g. "INV-2026-0041"
  orderId?: string | undefined; // e.g. "BKG-7712", "ORD-1081", "SHP-3391"
  receivedBy: string; // Staff member or System
  gatewayTxnId?: string | undefined;
  customerName: string;
  customerEmail?: string | undefined;
  customerPhone?: string | undefined;
  refundedAmount?: number | undefined;
  refundReason?: string | undefined;
  refundedAt?: string | undefined;
  refundedBy?: string | undefined;
  refundAuditPinUsed?: boolean | undefined;
  notes?: string | undefined;
  retryHistory?: PaymentRetryEvent[] | undefined;
  isDuplicateWebhook?: boolean | undefined;
}

export type InvoiceStatus = "DRAFT" | "SENT" | "PARTIAL" | "PAID" | "OVERDUE" | "VOID";

export interface InvoiceLineItem {
  id: string;
  description: string;
  hsn: string;
  qty: number;
  rate: number;
  taxableAmount: number;
  gstRate: number; // e.g. 18 for 18%
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface InvoicePaymentApplied {
  paymentId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  ref: string;
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  amount: number;
  reason: string;
  date: string;
  approvedBy: string;
  auditPinUsed?: boolean | undefined;
}

export interface InvoiceTimelineEvent {
  id: string;
  status: string;
  timestamp: string;
  title: string;
  note?: string | undefined;
  actor: string;
}

export interface InvoiceReminderHistory {
  id: string;
  sentAt: string;
  sentTo: string;
  channel: "EMAIL" | "SMS" | "WHATSAPP";
  status: "DELIVERED" | "READ" | "FAILED";
  messageSnippet: string;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string; // gap-free sequential e.g. "INV-2026-0042"
  customerName: string;
  customerGstin?: string | undefined;
  customerEmail?: string | undefined;
  customerPhone?: string | undefined;
  customerAddress?: string | undefined;
  businessClientId?: string | undefined;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceLineItem[];
  subtotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalAmount: number;
  balanceDue: number;
  notes?: string | undefined;
  terms?: string | undefined;
  paymentsApplied: InvoicePaymentApplied[];
  creditNotes: CreditNote[];
  timeline: InvoiceTimelineEvent[];
  reminderHistory: InvoiceReminderHistory[];
  voidReason?: string | undefined;
  voidedAt?: string | undefined;
  voidedBy?: string | undefined;
  voidAuditPinUsed?: boolean | undefined;
}

export interface UnbilledClientItem {
  id: string;
  type: "COURT_BOOKING" | "MEMBERSHIP" | "COACHING" | "TOURNAMENT";
  description: string;
  date: string;
  hoursOrUnits?: number | undefined;
  amount: number;
  taxableAmount: number;
  gstAmount: number;
}

export interface BusinessClient {
  id: string;
  name: string;
  gstin: string;
  billingAddress: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  ratePlan: string;
  negotiatedDiscountPercent: number;
  activeBookingsCount: number;
  activeMembershipsCount: number;
  unbilledCourtHours: number;
  unbilledAmount: number;
  unbilledItems: UnbilledClientItem[];
  pastInvoicesCount: number;
  totalRevenueContribution: number;
  paymentTermsDays: number;
}

export type ExpenseCategory = "rent" | "utilities" | "maintenance" | "supplies" | "marketing" | "other";

export interface ExpenseRecord {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  paymentStatus: "PAID" | "PENDING";
  method: "CASH" | "BANK_TRANSFER" | "UPI" | "CARD";
  vendorId?: string | undefined;
  vendorName: string;
  billNumber?: string | undefined;
  receiptFileName?: string | undefined;
  recordedBy: string;
  notes?: string | undefined;
}

export interface Vendor {
  id: string;
  name: string;
  gstin: string;
  category: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  paymentTermsDays: number;
  totalBilled: number;
  totalOutstanding: number;
}

export type BillStatus = "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE";

export interface VendorBillPayment {
  paymentId: string;
  date: string;
  amount: number;
  method: string;
  ref: string;
}

export interface VendorBill {
  id: string;
  billNumber: string;
  vendorId: string;
  vendorName: string;
  date: string;
  dueDate: string;
  amount: number;
  taxAmount: number;
  paidAmount: number;
  status: BillStatus;
  category: ExpenseCategory;
  itemsDescription: string;
  receiptAttachment?: string | undefined;
  payments: VendorBillPayment[];
}

export interface FinancialPeriod {
  id: string; // e.g. "FY26-M07"
  name: string; // e.g. "October 2026"
  fiscalYear: string; // "2026-2027"
  startDate: string;
  endDate: string;
  status: "OPEN" | "CLOSED";
  closedAt?: string | undefined;
  closedBy?: string | undefined;
  reopenReason?: string | undefined;
  reopenedAt?: string | undefined;
  reopenedBy?: string | undefined;
  totalRevenue: number;
  totalExpense: number;
  netOperatingProfit: number;
}

export interface CashReconciliationRecord {
  id: string;
  date: string;
  registerName: string; // e.g. "Front Desk Terminal 1", "Bar Main POS", "Shop Counter"
  systemCalculatedCash: number;
  actualCountedCash: number;
  variance: number;
  status: "MATCHED" | "DISCREPANCY" | "SIGNED_OFF";
  cashierName: string;
  signedOffBy?: string | undefined;
  signedOffAt?: string | undefined;
  notes?: string | undefined;
}

export interface GatewaySettlementRecord {
  id: string;
  date: string;
  gateway: "Razorpay" | "PineLabs POS" | "PayTM UPI";
  batchId: string;
  grossAmount: number;
  feeGst: number;
  netSettlement: number;
  status: "MATCHED" | "UNMATCHED";
  bankRef?: string | undefined;
  matchedAt?: string | undefined;
  matchedBy?: string | undefined;
  unmatchedReason?: string | undefined;
}

export interface ReceivablesAgingBucket {
  range: "0-30 days" | "31-60 days" | "60+ days";
  amount: number;
  count: number;
  invoices: { id: string; invoiceNumber: string; customerName: string; amount: number; daysOverdue: number }[];
}
