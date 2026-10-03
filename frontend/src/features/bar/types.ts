// Types for Bar, Restaurant, Café POS, Tabs, Kitchen Display System (KDS), Bill & Shift

export type TableStatus = "FREE" | "OCCUPIED" | "BILL_REQUESTED" | "RESERVED";

export interface ClubTable {
  id: string; // e.g. "T1", "T2", ...
  number: number;
  name: string; // "Table 1"
  seats: number;
  section: "MAIN_BAR" | "TERRACE" | "LOUNGE" | "COURTSIDE";
  status: TableStatus;
  currentOrderId?: string;
  waiterName?: string;
  waiterInitials?: string;
  activeStaffEditing?: string; // e.g. "Aarav is editing"
  occupiedSince?: string; // ISO
  billRequestedAt?: string;
  readyItemsCount?: number; // count of items marked READY on KDS
}

export type MenuCategory = "FOOD" | "SOFT_DRINKS" | "BEVERAGES" | "SNACKS";
export type PrepStation = "KITCHEN" | "BAR";

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  station: PrepStation;
  price: number; // in INR
  taxRate: number; // 0.05 for food (5%), 0.18 for alcohol/beverages (18%)
  description: string;
  isAvailable: boolean; // false = 86'd
  isAlcoholic?: boolean;
  stockQty?: number;
  reorderLevel?: number;
  imageUrl?: string;
  popularModifiers?: string[];
}

export type LineItemStatus = "NEW" | "SENT" | "PREPARING" | "READY" | "SERVED" | "VOIDED";

export interface OrderLineItem {
  lineId: string;
  menuItemId: string;
  name: string;
  price: number;
  taxRate: number;
  quantity: number;
  station: PrepStation;
  status: LineItemStatus;
  notes?: string;
  modifiers?: string[];
  sentAt?: string;
  preparedAt?: string;
  readyAt?: string;
  servedAt?: string;
  voidReason?: string;
  voidedBy?: string;
  assignedGuestName?: string;
}

export interface BarOrderCustomer {
  memberId?: string;
  name: string;
  tier?: "NONE" | "JUNIOR" | "SILVER" | "GOLD" | "PLATINUM";
  discountPercent?: number; // 0, 5, 8, 15, 20
  phone?: string;
  photoUrl?: string;
}

export type OrderDestination = {
  type: "TABLE" | "TAB" | "QUICK" | "COURT";
  targetId: string; // "T4", "TAB-01", "Court 3"
};

export interface BarOrder {
  id: string; // e.g. "ORD-1082"
  orderNumber: number;
  tableId?: string;
  tabId?: string;
  destination: OrderDestination;
  customer?: BarOrderCustomer;
  waiterId: string;
  waiterName: string;
  waiterInitials: string;
  items: OrderLineItem[];
  subtotal: number;
  discountAmount: number;
  discountDescription?: string;
  taxAmount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  isBillRequested?: boolean;
  isSettled?: boolean;
  courtBookingRef?: string;
}

export interface BarTab {
  id: string; // e.g. "TAB-01"
  tabNumber: number;
  name: string;
  memberId: string;
  memberName: string;
  memberTier: "SILVER" | "GOLD" | "PLATINUM";
  memberPhoto?: string;
  openedAt: string;
  activeTableIds: string[];
  orders: BarOrder[];
  runningTotal: number;
  creditLimit: number;
  status: "OPEN" | "SETTLED" | "MOVED_TO_ACCOUNT";
  movedToAccountAt?: string;
  movedToAccountBy?: string;
  movedToAccountAdminPin?: string;
}

export type BillSplitMode = "WHOLE" | "BY_ITEM" | "EQUAL_GUESTS";

export interface BillPaymentLeg {
  method: "CASH" | "UPI" | "CARD" | "MEMBER_TAB";
  amount: number;
  tendered?: number;
  change?: number;
  reference?: string; // UTR or Auth Code
}

export interface BarReceipt {
  receiptNumber: string;
  billNumber: string;
  orderId: string;
  tableName?: string;
  tabName?: string;
  waiterName: string;
  timestamp: string;
  customer?: BarOrderCustomer;
  items: {
    name: string;
    qty: number;
    price: number;
    amount: number;
    notes?: string;
  }[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  gstAmount: number;
  roundOff: number;
  grandTotal: number;
  payments: BillPaymentLeg[];
}

export interface ShiftState {
  shiftId: string;
  staffName: string;
  staffId: string;
  clockInTime: string;
  clockOutTime?: string;
  isOpen: boolean;
  openingFloat: number;
  cashMovements: {
    id: string;
    type: "CASH_IN" | "CASH_OUT";
    amount: number;
    reason: string;
    timestamp: string;
  }[];
  countedCash?: number;
  closedAt?: string;
}

export interface DailyClosingReport {
  date: string;
  closedAt?: string;
  closedBy?: string;
  isClosed: boolean;
  grossSales: number;
  memberDiscounts: number;
  taxesCollected: number;
  netRevenue: number;
  totalOrders: number;
  totalCovers: number;
  paymentBreakdown: {
    cash: number;
    upi: number;
    card: number;
    tabs: number;
  };
  categoryBreakdown: {
    food: number;
    beverages: number;
    softDrinks: number;
    snacks: number;
  };
  staffSales: {
    staffName: string;
    ordersCount: number;
    totalSales: number;
    avgPrepTimeMinutes: number;
  }[];
  unsettledTabsCount: number;
  reopenedAt?: string;
  reopenedBy?: string;
  reopenReason?: string;
}
