// CCMS Finance Store using useSyncExternalStore for reactive client-side Finance state

import { useSyncExternalStore, useMemo } from "react";
import type {
  PaymentRecord,
  InvoiceRecord,
  BusinessClient,
  ExpenseRecord,
  Vendor,
  VendorBill,
  BillStatus,
  FinancialPeriod,
  CashReconciliationRecord,
  GatewaySettlementRecord,
  PaymentSource,
  PaymentMethod,
  ExpenseCategory,
  InvoiceLineItem,
} from "./types";
import {
  INITIAL_PAYMENTS,
  INITIAL_INVOICES,
  INITIAL_BUSINESS_CLIENTS,
  INITIAL_EXPENSES,
  INITIAL_VENDORS,
  INITIAL_VENDOR_BILLS,
  INITIAL_PERIODS,
  INITIAL_CASH_RECONCILIATION,
  INITIAL_GATEWAY_SETTLEMENTS,
  CLUB_FINANCE_PROFILE,
} from "./sampleData";
import { toast } from "@/components/ui/Toast";

interface FinanceState {
  payments: PaymentRecord[];
  invoices: InvoiceRecord[];
  businessClients: BusinessClient[];
  expenses: ExpenseRecord[];
  vendors: Vendor[];
  vendorBills: VendorBill[];
  periods: FinancialPeriod[];
  cashReconciliations: CashReconciliationRecord[];
  gatewaySettlements: GatewaySettlementRecord[];
  // Period lock modal state (HTTP 423 simulation)
  periodLockModal: {
    isOpen: boolean;
    periodName: string;
    attemptedAction: string;
  };
}

let state: FinanceState = {
  payments: INITIAL_PAYMENTS,
  invoices: INITIAL_INVOICES,
  businessClients: INITIAL_BUSINESS_CLIENTS,
  expenses: INITIAL_EXPENSES,
  vendors: INITIAL_VENDORS,
  vendorBills: INITIAL_VENDOR_BILLS,
  periods: INITIAL_PERIODS,
  cashReconciliations: INITIAL_CASH_RECONCILIATION,
  gatewaySettlements: INITIAL_GATEWAY_SETTLEMENTS,
  periodLockModal: {
    isOpen: false,
    periodName: "",
    attemptedAction: "",
  },
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): FinanceState {
  return state;
}

// ─── Period Lock Helper ─────────────────────────────────────────────
export function checkPeriodLocked(targetDate: string = new Date().toISOString()): {
  locked: boolean;
  periodName?: string;
  period?: FinancialPeriod;
} {
  const d = new Date(targetDate);
  const targetYear = d.getFullYear();
  const targetMonth = d.getMonth(); // 0-indexed

  // Look for a matching period that is CLOSED
  const matchingPeriod = state.periods.find((p) => {
    const pStart = new Date(p.startDate);
    const pEnd = new Date(p.endDate);
    return (
      (pStart.getFullYear() === targetYear && pStart.getMonth() === targetMonth) ||
      (d >= pStart && d <= pEnd)
    );
  });

  if (matchingPeriod && matchingPeriod.status === "CLOSED") {
    return { locked: true, periodName: matchingPeriod.name, period: matchingPeriod };
  }

  // Also check if current active month (e.g. October 2026) is closed
  const currentPeriod = state.periods.find((p) => p.status === "CLOSED" && p.name.includes("October"));
  if (currentPeriod) {
    return { locked: true, periodName: currentPeriod.name, period: currentPeriod };
  }

  return { locked: false };
}

// ─── Numbering Helper (Gap-free Sequential) ──────────────────────────
export function generateNextInvoiceNumber(): string {
  const invoiceNumbers = state.invoices
    .map((inv) => {
      const match = inv.invoiceNumber.match(/INV-\d{4}-(\d+)/);
      const seqStr = match?.[1] || "0";
      return match ? parseInt(seqStr, 10) : 0;
    })
    .filter((n) => !isNaN(n));

  const maxSeq = invoiceNumbers.length > 0 ? Math.max(...invoiceNumbers) : 45;
  const nextSeq = maxSeq + 1;
  const currentYear = new Date().getFullYear();
  return `INV-${currentYear}-${String(nextSeq).padStart(4, "0")}`;
}

export function generateNextPaymentId(): string {
  const paymentNumbers = state.payments
    .map((p) => {
      const match = p.id.match(/PAY-\d{4}-(\d+)/);
      const seqStr = match?.[1] || "0";
      return match ? parseInt(seqStr, 10) : 0;
    })
    .filter((n) => !isNaN(n));

  const maxSeq = paymentNumbers.length > 0 ? Math.max(...paymentNumbers) : 110;
  const nextSeq = maxSeq + 1;
  const currentYear = new Date().getFullYear();
  return `PAY-${currentYear}-${String(nextSeq).padStart(4, "0")}`;
}

export function generateNextCreditNoteNumber(): string {
  const currentYear = new Date().getFullYear();
  const count = state.invoices.reduce((sum, inv) => sum + inv.creditNotes.length, 0);
  return `CN-${currentYear}-${String(count + 1).padStart(4, "0")}`;
}

// ─── Actions ──────────────────────────────────────────────────────────

export function showPeriodLockModal(actionName: string, periodName: string = "October 2026") {
  state = {
    ...state,
    periodLockModal: {
      isOpen: true,
      periodName,
      attemptedAction: actionName,
    },
  };
  notify();
}

export function closePeriodLockModal() {
  state = {
    ...state,
    periodLockModal: {
      ...state.periodLockModal,
      isOpen: false,
    },
  };
  notify();
}

/** Record a manual or system payment into the shared ledger */
export function recordPayment(data: {
  source: PaymentSource;
  method: PaymentMethod;
  amount: number;
  ref: string;
  customerName: string;
  customerEmail?: string | undefined;
  customerPhone?: string | undefined;
  invoiceId?: string | undefined;
  orderId?: string | undefined;
  receivedBy: string;
  notes?: string | undefined;
}): { success: boolean; paymentId?: string; error?: string } {
  // Check period lock
  const lock = checkPeriodLocked();
  if (lock.locked) {
    showPeriodLockModal("Record Payment", lock.periodName);
    toast.error(`Period ${lock.periodName} is closed. Edits locked (423 PERIOD_CLOSED).`);
    return { success: false, error: "PERIOD_CLOSED" };
  }

  // Validate mandatory reference for UPI and Card manual confirmations
  if ((data.method === "UPI" || data.method === "CARD") && (!data.ref || !data.ref.trim())) {
    toast.error(`Transaction reference or UTR is mandatory for ${data.method} payments.`);
    return { success: false, error: "REF_REQUIRED" };
  }

  const paymentId = generateNextPaymentId();
  const newPayment: PaymentRecord = {
    id: paymentId,
    timestamp: new Date().toISOString(),
    ref: data.ref.trim(),
    source: data.source,
    method: data.method,
    amount: data.amount,
    status: "COMPLETED",
    invoiceId: data.invoiceId,
    orderId: data.orderId,
    receivedBy: data.receivedBy,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
    notes: data.notes,
  };

  // If tied to an invoice, apply it
  let updatedInvoices = state.invoices;
  if (data.invoiceId) {
    updatedInvoices = state.invoices.map((inv) => {
      if (inv.id !== data.invoiceId && inv.invoiceNumber !== data.invoiceId) return inv;
      const newPaid = [
        ...inv.paymentsApplied,
        {
          paymentId,
          amount: data.amount,
          date: new Date().toISOString(),
          method: data.method,
          ref: data.ref,
        },
      ];
      const totalPaid = newPaid.reduce((sum, p) => sum + p.amount, 0);
      const newBalance = Math.max(0, inv.totalAmount - totalPaid);
      const newStatus = newBalance <= 0 ? "PAID" : "PARTIAL";

      return {
        ...inv,
        balanceDue: newBalance,
        status: newStatus,
        paymentsApplied: newPaid,
        timeline: [
          ...inv.timeline,
          {
            id: `tl-${Date.now()}`,
            status: newStatus,
            timestamp: new Date().toISOString(),
            title: `Payment Applied (${data.method}: ${formatCurrency(data.amount)})`,
            note: `Ref: ${data.ref}`,
            actor: data.receivedBy,
          },
        ],
      };
    });
  }

  state = {
    ...state,
    payments: [newPayment, ...state.payments],
    invoices: updatedInvoices,
  };
  notify();

  toast.success(`Payment ${paymentId} for ${formatCurrency(data.amount)} recorded successfully!`);
  return { success: true, paymentId };
}

/** Refund a payment (Admin only / ReasonDialog with PIN required) */
export function refundPayment(
  paymentId: string,
  amount: number,
  reason: string,
  mode: "GATEWAY" | "CASH_CREDIT_MEMO",
  refundedBy: string = "Administrator",
  pinUsed?: string
): { success: boolean; error?: string } {
  const lock = checkPeriodLocked();
  if (lock.locked) {
    showPeriodLockModal("Process Refund", lock.periodName);
    toast.error(`Period ${lock.periodName} is closed. Edits locked.`);
    return { success: false, error: "PERIOD_CLOSED" };
  }

  const payment = state.payments.find((p) => p.id === paymentId);
  if (!payment) return { success: false, error: "Payment not found" };

  if (amount > payment.amount) {
    toast.error("Refund amount cannot exceed original payment amount.");
    return { success: false, error: "AMOUNT_EXCEEDED" };
  }

  const isFullRefund = amount >= payment.amount;
  const newStatus = isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED";

  state = {
    ...state,
    payments: state.payments.map((p) => {
      if (p.id !== paymentId) return p;
      return {
        ...p,
        status: newStatus,
        refundedAmount: (p.refundedAmount || 0) + amount,
        refundReason: reason,
        refundedAt: new Date().toISOString(),
        refundedBy,
        refundAuditPinUsed: Boolean(pinUsed),
      };
    }),
  };
  notify();

  toast.success(`Refund of ${formatCurrency(amount)} processed successfully via ${mode}.`);
  return { success: true };
}

/** Create a gap-free sequential invoice */
export function createInvoice(data: {
  customerName: string;
  customerGstin?: string | undefined;
  customerEmail?: string | undefined;
  customerPhone?: string | undefined;
  customerAddress?: string | undefined;
  businessClientId?: string | undefined;
  dueDate: string;
  items: { description: string; hsn: string; qty: number; rate: number; gstRate: number }[];
  notes?: string | undefined;
  terms?: string | undefined;
  actor?: string | undefined;
}): InvoiceRecord {
  const lock = checkPeriodLocked();
  if (lock.locked) {
    showPeriodLockModal("Create Invoice", lock.periodName);
    toast.error(`Period ${lock.periodName} is closed. Edits locked.`);
    throw new Error("PERIOD_CLOSED");
  }

  const invoiceNumber = generateNextInvoiceNumber();
  const date = new Date().toISOString().split("T")[0] || "";

  let subtotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  const processedItems: InvoiceLineItem[] = data.items.map((item, idx) => {
    const taxable = item.qty * item.rate;
    const isInterState = data.customerGstin && !data.customerGstin.startsWith("27");
    const gstPct = item.gstRate || 18;
    const cgst = isInterState ? 0 : Math.round(((taxable * (gstPct / 2)) / 100) * 100) / 100;
    const sgst = isInterState ? 0 : Math.round(((taxable * (gstPct / 2)) / 100) * 100) / 100;
    const igst = isInterState ? Math.round(((taxable * gstPct) / 100) * 100) / 100 : 0;
    const total = taxable + cgst + sgst + igst;

    subtotal += taxable;
    cgstTotal += cgst;
    sgstTotal += sgst;
    igstTotal += igst;

    return {
      id: `item-${Date.now()}-${idx}`,
      description: item.description,
      hsn: item.hsn || "999691",
      qty: item.qty,
      rate: item.rate,
      taxableAmount: taxable,
      gstRate: gstPct,
      cgst,
      sgst,
      igst,
      total,
    };
  });

  const totalAmount = subtotal + cgstTotal + sgstTotal + igstTotal;

  const newInvoice: InvoiceRecord = {
    id: invoiceNumber,
    invoiceNumber,
    customerName: data.customerName,
    customerGstin: data.customerGstin,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
    customerAddress: data.customerAddress,
    businessClientId: data.businessClientId,
    date,
    dueDate: data.dueDate,
    status: "DRAFT",
    items: processedItems,
    subtotal,
    cgstTotal,
    sgstTotal,
    igstTotal,
    totalAmount,
    balanceDue: totalAmount,
    notes: data.notes || "Thank you for choosing Champions Sports Club.",
    terms: data.terms || "Payment is due upon receipt or as per corporate contract.",
    paymentsApplied: [],
    creditNotes: [],
    timeline: [
      {
        id: `tl-${Date.now()}`,
        status: "DRAFT",
        timestamp: new Date().toISOString(),
        title: "Invoice Draft Created",
        actor: data.actor || "Finance Staff",
      },
    ],
    reminderHistory: [],
  };

  state = {
    ...state,
    invoices: [newInvoice, ...state.invoices],
  };
  notify();

  toast.success(`Invoice ${invoiceNumber} created successfully!`);
  return newInvoice;
}

/** Void an invoice (Admin only / ReasonDialog with PIN required; retains number) */
export function voidInvoice(
  invoiceId: string,
  reason: string,
  voidedBy: string = "Administrator",
  pinUsed?: string
): { success: boolean; error?: string } {
  const lock = checkPeriodLocked();
  if (lock.locked) {
    showPeriodLockModal("Void Invoice", lock.periodName);
    toast.error(`Period ${lock.periodName} is closed. Edits locked.`);
    return { success: false, error: "PERIOD_CLOSED" };
  }

  const invoice = state.invoices.find((i) => i.id === invoiceId || i.invoiceNumber === invoiceId);
  if (!invoice) return { success: false, error: "Invoice not found" };

  state = {
    ...state,
    invoices: state.invoices.map((inv) => {
      if (inv.id !== invoice.id) return inv;
      return {
        ...inv,
        status: "VOID",
        balanceDue: 0,
        voidReason: reason,
        voidedAt: new Date().toISOString(),
        voidedBy,
        voidAuditPinUsed: Boolean(pinUsed),
        timeline: [
          ...inv.timeline,
          {
            id: `tl-${Date.now()}`,
            status: "VOID",
            timestamp: new Date().toISOString(),
            title: "Invoice Voided (Gap-Free Number Retained)",
            note: reason,
            actor: voidedBy,
          },
        ],
      };
    }),
  };
  notify();

  toast.success(`Invoice ${invoice.invoiceNumber} has been marked VOID. Sequential number retained.`);
  return { success: true };
}

/** Issue a Credit Note against an invoice (Admin-only approval) */
export function issueCreditNote(
  invoiceId: string,
  amount: number,
  reason: string,
  approvedBy: string = "Administrator",
  pinUsed?: string
): { success: boolean; creditNoteNumber?: string; error?: string } {
  const lock = checkPeriodLocked();
  if (lock.locked) {
    showPeriodLockModal("Issue Credit Note", lock.periodName);
    toast.error(`Period ${lock.periodName} is closed. Edits locked.`);
    return { success: false, error: "PERIOD_CLOSED" };
  }

  const invoice = state.invoices.find((i) => i.id === invoiceId || i.invoiceNumber === invoiceId);
  if (!invoice) return { success: false, error: "Invoice not found" };

  if (amount > invoice.balanceDue && invoice.balanceDue > 0) {
    toast.warning("Credit note exceeds outstanding balance. Remaining balance will be zero.");
  }

  const cnNumber = generateNextCreditNoteNumber();
  const newCreditNote = {
    id: `cn-${Date.now()}`,
    creditNoteNumber: cnNumber,
    amount,
    reason,
    date: new Date().toISOString().split("T")[0] || "",
    approvedBy,
    auditPinUsed: Boolean(pinUsed),
  };

  const newBalance = Math.max(0, invoice.balanceDue - amount);
  const newStatus = newBalance === 0 ? "PAID" : invoice.status;

  state = {
    ...state,
    invoices: state.invoices.map((inv) => {
      if (inv.id !== invoice.id) return inv;
      return {
        ...inv,
        balanceDue: newBalance,
        status: newStatus,
        creditNotes: [...inv.creditNotes, newCreditNote],
        timeline: [
          ...inv.timeline,
          {
            id: `tl-${Date.now()}`,
            status: "CREDIT_NOTE",
            timestamp: new Date().toISOString(),
            title: `Credit Note Issued: ${cnNumber} (${formatCurrency(amount)})`,
            note: reason,
            actor: approvedBy,
          },
        ],
      };
    }),
  };
  notify();

  toast.success(`Credit Note ${cnNumber} issued for ${formatCurrency(amount)}.`);
  return { success: true, creditNoteNumber: cnNumber };
}

/** Send payment reminder to customer (Email / WhatsApp / SMS) */
export function sendInvoiceReminder(
  invoiceId: string,
  channel: "EMAIL" | "SMS" | "WHATSAPP"
): { success: boolean } {
  const invoice = state.invoices.find((i) => i.id === invoiceId || i.invoiceNumber === invoiceId);
  if (!invoice) return { success: false };

  const target = channel === "EMAIL" ? invoice.customerEmail || "customer email" : invoice.customerPhone || "phone";
  const newReminder = {
    id: `rem-${Date.now()}`,
    sentAt: new Date().toISOString(),
    sentTo: target,
    channel,
    status: "DELIVERED" as const,
    messageSnippet: `Reminder: Invoice ${invoice.invoiceNumber} balance ${formatCurrency(invoice.balanceDue)} due.`,
  };

  state = {
    ...state,
    invoices: state.invoices.map((inv) => {
      if (inv.id !== invoice.id) return inv;
      return {
        ...inv,
        reminderHistory: [newReminder, ...inv.reminderHistory],
      };
    }),
  };
  notify();

  toast.success(`Payment reminder sent via ${channel} to ${target}!`);
  return { success: true };
}

/** Generate consolidated monthly invoice for a corporate business client */
export function generateConsolidatedInvoice(
  clientId: string,
  monthName: string = "October 2026",
  actor: string = "Finance Team"
): InvoiceRecord | null {
  const lock = checkPeriodLocked();
  if (lock.locked) {
    showPeriodLockModal("Generate Consolidated Invoice", lock.periodName);
    toast.error(`Period ${lock.periodName} is closed. Edits locked.`);
    return null;
  }

  const client = state.businessClients.find((c) => c.id === clientId);
  if (!client) {
    toast.error("Business client not found");
    return null;
  }

  if (client.unbilledItems.length === 0) {
    toast.info("No unbilled items found for this corporate client.");
    return null;
  }

  const dueDate =
    new Date(Date.now() + client.paymentTermsDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0] || "";

  const items = client.unbilledItems.map((item) => ({
    description: `${item.description} (${item.date})`,
    hsn: "999691",
    qty: item.hoursOrUnits || 1,
    rate: Math.round(item.taxableAmount / (item.hoursOrUnits || 1)),
    gstRate: 18,
  }));

  const invoice = createInvoice({
    customerName: client.name,
    customerGstin: client.gstin,
    customerEmail: client.contactEmail,
    customerPhone: client.contactPhone,
    customerAddress: client.billingAddress,
    businessClientId: client.id,
    dueDate,
    items,
    notes: `Consolidated Monthly Invoice for ${monthName}. Applied negotiated package: ${client.ratePlan}.`,
    terms: `Payment terms: Net ${client.paymentTermsDays} days. Please quote ${generateNextInvoiceNumber()} on remittance.`,
    actor,
  });

  // Clear unbilled items
  state = {
    ...state,
    businessClients: state.businessClients.map((c) => {
      if (c.id !== clientId) return c;
      return {
        ...c,
        unbilledAmount: 0,
        unbilledCourtHours: 0,
        unbilledItems: [],
        pastInvoicesCount: c.pastInvoicesCount + 1,
        totalRevenueContribution: c.totalRevenueContribution + invoice.totalAmount,
      };
    }),
  };
  notify();

  toast.success(
    `Consolidated invoice ${invoice.invoiceNumber} created for ${client.name} (${formatCurrency(
      invoice.totalAmount
    )})!`
  );
  return invoice;
}

/** Record an operating expense */
export function recordExpense(data: {
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  paymentStatus: "PAID" | "PENDING";
  method: "CASH" | "BANK_TRANSFER" | "UPI" | "CARD";
  vendorName: string;
  billNumber?: string | undefined;
  receiptFileName?: string | undefined;
  recordedBy: string;
  notes?: string | undefined;
}): ExpenseRecord {
  const lock = checkPeriodLocked(data.date);
  if (lock.locked) {
    showPeriodLockModal("Record Expense", lock.periodName);
    toast.error(`Period ${lock.periodName} is closed. Edits locked.`);
    throw new Error("PERIOD_CLOSED");
  }

  const newExpense: ExpenseRecord = {
    id: `EXP-${new Date().getFullYear()}-${String(state.expenses.length + 82).padStart(4, "0")}`,
    ...data,
  };

  state = {
    ...state,
    expenses: [newExpense, ...state.expenses],
  };
  notify();

  toast.success(`Expense ${newExpense.id} for ${formatCurrency(data.amount)} recorded!`);
  return newExpense;
}

/** Add a new vendor */
export function addVendor(data: Omit<Vendor, "id" | "totalBilled" | "totalOutstanding">): Vendor {
  const newVendor: Vendor = {
    id: `VEN-${String(state.vendors.length + 1).padStart(3, "0")}`,
    ...data,
    totalBilled: 0,
    totalOutstanding: 0,
  };

  state = {
    ...state,
    vendors: [...state.vendors, newVendor],
  };
  notify();

  toast.success(`Vendor ${newVendor.name} added successfully!`);
  return newVendor;
}

/** Record a new vendor bill */
export function recordVendorBill(data: {
  billNumber: string;
  vendorId: string;
  date: string;
  dueDate: string;
  amount: number;
  taxAmount: number;
  category: ExpenseCategory;
  itemsDescription: string;
  receiptAttachment?: string | undefined;
}): VendorBill {
  const lock = checkPeriodLocked(data.date);
  if (lock.locked) {
    showPeriodLockModal("Record Vendor Bill", lock.periodName);
    toast.error(`Period ${lock.periodName} is closed. Edits locked.`);
    throw new Error("PERIOD_CLOSED");
  }

  const vendor = state.vendors.find((v) => v.id === data.vendorId);
  const vendorName = vendor ? vendor.name : "Unknown Vendor";

  const newBill: VendorBill = {
    id: `VB-${new Date().getFullYear()}-${String(state.vendorBills.length + 42).padStart(4, "0")}`,
    billNumber: data.billNumber,
    vendorId: data.vendorId,
    vendorName,
    date: data.date,
    dueDate: data.dueDate,
    amount: data.amount,
    taxAmount: data.taxAmount,
    paidAmount: 0,
    status: "UNPAID",
    category: data.category,
    itemsDescription: data.itemsDescription,
    receiptAttachment: data.receiptAttachment,
    payments: [],
  };

  // Update vendor outstanding
  const updatedVendors = state.vendors.map((v) => {
    if (v.id !== data.vendorId) return v;
    return {
      ...v,
      totalBilled: v.totalBilled + data.amount,
      totalOutstanding: v.totalOutstanding + data.amount,
    };
  });

  state = {
    ...state,
    vendorBills: [newBill, ...state.vendorBills],
    vendors: updatedVendors,
  };
  notify();

  toast.success(`Vendor Bill ${newBill.billNumber} from ${vendorName} recorded!`);
  return newBill;
}

/** Record payment for a vendor bill */
export function recordVendorBillPayment(
  billId: string,
  amount: number,
  method: string,
  ref: string
): { success: boolean; error?: string } {
  const lock = checkPeriodLocked();
  if (lock.locked) {
    showPeriodLockModal("Record Vendor Bill Payment", lock.periodName);
    toast.error(`Period ${lock.periodName} is closed. Edits locked.`);
    return { success: false, error: "PERIOD_CLOSED" };
  }

  const bill = state.vendorBills.find((b) => b.id === billId);
  if (!bill) return { success: false, error: "Bill not found" };

  const newPaidAmount = bill.paidAmount + amount;
  const newStatus = newPaidAmount >= bill.amount ? "PAID" : "PARTIAL";

  const newPayment = {
    paymentId: `PAY-VB-${Date.now()}`,
    date: new Date().toISOString().split("T")[0] || "",
    amount,
    method,
    ref,
  };

  const updatedBills: VendorBill[] = state.vendorBills.map((b) => {
    if (b.id !== billId) return b;
    return {
      ...b,
      paidAmount: newPaidAmount,
      status: newStatus as BillStatus,
      payments: [...b.payments, newPayment],
    };
  });

  // Update vendor outstanding
  const updatedVendors = state.vendors.map((v) => {
    if (v.id !== bill.vendorId) return v;
    return {
      ...v,
      totalOutstanding: Math.max(0, v.totalOutstanding - amount),
    };
  });

  state = {
    ...state,
    vendorBills: updatedBills,
    vendors: updatedVendors,
  };
  notify();

  toast.success(`Payment of ${formatCurrency(amount)} recorded for bill ${bill.billNumber}!`);
  return { success: true };
}

/** Close a financial period (Finance Group or Admin; locks all edits across screens) */
export function closeFinancialPeriod(
  periodId: string,
  closedBy: string = "Finance Head",
  pin?: string
): { success: boolean; error?: string } {
  const period = state.periods.find((p) => p.id === periodId);
  if (!period) return { success: false, error: "Period not found" };

  state = {
    ...state,
    periods: state.periods.map((p) => {
      if (p.id !== periodId) return p;
      return {
        ...p,
        status: "CLOSED",
        closedAt: new Date().toISOString(),
        closedBy,
      };
    }),
  };
  notify();

  toast.success(`Financial Period ${period.name} closed successfully. Edits are now locked.`);
  return { success: true };
}

/** Reopen a closed financial period (Admin only, requires audited justification) */
export function reopenFinancialPeriod(
  periodId: string,
  reason: string,
  reopenedBy: string = "Super Admin",
  pin?: string
): { success: boolean; error?: string } {
  const period = state.periods.find((p) => p.id === periodId);
  if (!period) return { success: false, error: "Period not found" };

  state = {
    ...state,
    periods: state.periods.map((p) => {
      if (p.id !== periodId) return p;
      return {
        ...p,
        status: "OPEN",
        reopenedAt: new Date().toISOString(),
        reopenedBy,
        reopenReason: reason,
      };
    }),
  };
  notify();

  toast.success(`Financial Period ${period.name} reopened for audited modifications.`);
  return { success: true };
}

/** Match gateway settlement batch */
export function matchGatewaySettlement(id: string, bankRef: string, matchedBy: string = "Accounts Desk") {
  state = {
    ...state,
    gatewaySettlements: state.gatewaySettlements.map((s) => {
      if (s.id !== id) return s;
      return {
        ...s,
        status: "MATCHED",
        bankRef,
        matchedAt: new Date().toISOString(),
        matchedBy,
      };
    }),
  };
  notify();

  toast.success(`Gateway settlement ${id} matched with bank clearance ref ${bankRef}!`);
}

/** Sign off daily cash reconciliation (Admin only) */
export function signOffCashReconciliation(id: string, signedOffBy: string = "Finance Manager", pin?: string) {
  state = {
    ...state,
    cashReconciliations: state.cashReconciliations.map((cr) => {
      if (cr.id !== id) return cr;
      return {
        ...cr,
        status: "SIGNED_OFF",
        signedOffBy,
        signedOffAt: new Date().toISOString(),
      };
    }),
  };
  notify();

  toast.success(`Daily cash drawer record ${id} signed off by ${signedOffBy}!`);
}

// ─── Format Currency Utility ──────────────────────────────────────────
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Hook ─────────────────────────────────────────────────────────────
export function useFinanceStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);

  // Computations
  const totalRevenueMTD = useMemo(() => {
    return snapshot.payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0);
  }, [snapshot.payments]);

  const totalOutstandingReceivables = useMemo(() => {
    return snapshot.invoices
      .filter((i) => i.status !== "PAID" && i.status !== "VOID")
      .reduce((sum, i) => sum + i.balanceDue, 0);
  }, [snapshot.invoices]);

  const totalOutstandingPayables = useMemo(() => {
    return snapshot.vendorBills
      .filter((b) => b.status !== "PAID")
      .reduce((sum, b) => sum + (b.amount - b.paidAmount), 0);
  }, [snapshot.vendorBills]);

  const totalExpensesMTD = useMemo(() => {
    return snapshot.expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [snapshot.expenses]);

  const activePeriod = useMemo(() => {
    return snapshot.periods.find((p) => p.status === "OPEN") || snapshot.periods[0];
  }, [snapshot.periods]);

  return {
    ...snapshot,
    totalRevenueMTD,
    totalOutstandingReceivables,
    totalOutstandingPayables,
    totalExpensesMTD,
    activePeriod,
    clubProfile: CLUB_FINANCE_PROFILE,
  };
}
