// Client-side unified store for CCMS Bar & Café POS, Floor, KDS, Tabs, Bill, Shift & Daily Closing
// Built with native useSyncExternalStore for flawless React 18/19 SSR and client reactivity.

import { useSyncExternalStore, useMemo } from "react";
import {
  ClubTable,
  MenuItem,
  BarOrder,
  BarTab,
  ShiftState,
  DailyClosingReport,
  OrderLineItem,
  BarOrderCustomer,
  BillPaymentLeg,
  BillSplitMode,
  BarReceipt,
  LineItemStatus,
} from "./types";
import {
  initialTables,
  initialMenuItems,
  initialOpenTabs,
  initialOrders,
  initialShift,
  initialDailyClosing,
} from "./sampleData";

interface BarState {
  tables: ClubTable[];
  menuItems: MenuItem[];
  orders: BarOrder[];
  tabs: BarTab[];
  activeShift: ShiftState;
  dailyClosing: DailyClosingReport;
  soundChimeEnabled: boolean;
  activeStaffName: string;
  activeStaffInitials: string;
}

let state: BarState = {
  tables: initialTables,
  menuItems: initialMenuItems,
  orders: initialOrders,
  tabs: initialOpenTabs,
  activeShift: initialShift,
  dailyClosing: initialDailyClosing,
  soundChimeEnabled: true,
  activeStaffName: "Aarav Mehta",
  activeStaffInitials: "AM",
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

function getSnapshot(): BarState {
  return state;
}

// Calculate financial totals for an order
function recalculateOrderTotals(
  items: OrderLineItem[],
  customer?: BarOrderCustomer
): { subtotal: number; discountAmount: number; discountDescription?: string; taxAmount: number; total: number } {
  const activeItems = items.filter((i) => i.status !== "VOIDED");
  const subtotal = activeItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Auto discount based on member tier (Gold 15%, Silver 8%, Junior 5%, Platinum 20%)
  let discountPercent = customer?.discountPercent ?? 0;
  if (!discountPercent && customer?.tier) {
    if (customer.tier === "PLATINUM") discountPercent = 20;
    else if (customer.tier === "GOLD") discountPercent = 15;
    else if (customer.tier === "SILVER") discountPercent = 8;
    else if (customer.tier === "JUNIOR") discountPercent = 5;
  }

  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const discountDescription =
    discountPercent > 0 ? `Member discount (${customer?.tier || "Tier"} ${discountPercent}%)` : undefined;

  const discountedFactor = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 1;
  const taxAmount = Math.round(
    activeItems.reduce((acc, item) => {
      const itemSub = item.price * item.quantity * discountedFactor;
      return acc + itemSub * item.taxRate;
    }, 0)
  );

  const total = Math.max(0, subtotal - discountAmount + taxAmount);

  return { subtotal, discountAmount, discountDescription, taxAmount, total };
}

// Store Actions
export const barActions = {
  getTable: (tableId: string) => {
    return state.tables.find((t) => t.id === tableId);
  },

  getOrder: (orderId: string) => {
    return state.orders.find((o) => o.id === orderId);
  },

  getOrderForTable: (tableId: string) => {
    const table = state.tables.find((t) => t.id === tableId);
    if (table?.currentOrderId) {
      const existing = state.orders.find((o) => o.id === table.currentOrderId);
      if (existing && !existing.isSettled) return existing;
    }

    const orderNumber = 1000 + state.orders.length + 1;
    const newOrderId = `ORD-${orderNumber}`;
    const newOrder: BarOrder = {
      id: newOrderId,
      orderNumber,
      tableId,
      destination: { type: "TABLE", targetId: tableId },
      waiterId: "STF-02",
      waiterName: state.activeStaffName,
      waiterInitials: state.activeStaffInitials,
      items: [],
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      total: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    state = {
      ...state,
      orders: [newOrder, ...state.orders],
      tables: state.tables.map((t) =>
        t.id === tableId
          ? {
              ...t,
              currentOrderId: newOrderId,
              waiterName: state.activeStaffName,
              waiterInitials: state.activeStaffInitials,
            }
          : t
      ),
    };
    notify();

    return newOrder;
  },

  setCustomerOnOrder: (orderId: string, customer: BarOrderCustomer) => {
    let discountPercent = customer.discountPercent ?? 0;
    if (customer.tier === "PLATINUM") discountPercent = 20;
    else if (customer.tier === "GOLD") discountPercent = 15;
    else if (customer.tier === "SILVER") discountPercent = 8;
    else if (customer.tier === "JUNIOR") discountPercent = 5;

    const custWithDiscount = { ...customer, discountPercent };
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;

    const totals = recalculateOrderTotals(order.items, custWithDiscount);
    const updatedOrder: BarOrder = {
      ...order,
      customer: custWithDiscount,
      ...totals,
      updatedAt: new Date().toISOString(),
    };

    state = {
      ...state,
      orders: state.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
    };
    notify();
  },

  clearCustomerFromOrder: (orderId: string) => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;

    const totals = recalculateOrderTotals(order.items, undefined);
    const updatedOrder: BarOrder = {
      ...order,
      customer: undefined,
      discountAmount: 0,
      discountDescription: undefined,
      ...totals,
      updatedAt: new Date().toISOString(),
    };

    state = {
      ...state,
      orders: state.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
    };
    notify();
  },

  addItemToOrder: (
    orderId: string,
    menuItem: MenuItem,
    quantity = 1,
    modifiers: string[] = [],
    notes = ""
  ) => {
    if (!menuItem.isAvailable) {
      return { success: false, error: `${menuItem.name} is currently 86'd (Unavailable).` };
    }

    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: "Order not found." };

    const existingLineIdx = order.items.findIndex(
      (i) =>
        i.menuItemId === menuItem.id &&
        i.status === "NEW" &&
        (i.notes || "") === (notes || "") &&
        JSON.stringify(i.modifiers || []) === JSON.stringify(modifiers || [])
    );

    let updatedItems: OrderLineItem[];
    if (existingLineIdx >= 0) {
      updatedItems = [...order.items];
      updatedItems[existingLineIdx] = {
        ...updatedItems[existingLineIdx],
        quantity: updatedItems[existingLineIdx].quantity + quantity,
      };
    } else {
      const newLine: OrderLineItem = {
        lineId: `L-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        taxRate: menuItem.taxRate,
        quantity,
        station: menuItem.station,
        status: "NEW",
        modifiers,
        notes,
      };
      updatedItems = [...order.items, newLine];
    }

    const totals = recalculateOrderTotals(updatedItems, order.customer);
    const updatedOrder: BarOrder = {
      ...order,
      items: updatedItems,
      ...totals,
      updatedAt: new Date().toISOString(),
    };

    const updatedTables = order.tableId
      ? state.tables.map((t) =>
          t.id === order.tableId && t.status === "FREE"
            ? { ...t, status: "OCCUPIED" as const, occupiedSince: new Date().toISOString() }
            : t
        )
      : state.tables;

    state = {
      ...state,
      orders: state.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
      tables: updatedTables,
    };
    notify();

    return { success: true };
  },

  updateLineQuantity: (orderId: string, lineId: string, delta: number) => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: "Order not found." };

    const line = order.items.find((i) => i.lineId === lineId);
    if (!line) return { success: false, error: "Item not found." };

    if (line.status !== "NEW") {
      return {
        success: false,
        error: "Sent items cannot be directly edited. Use void/comp with Admin PIN.",
      };
    }

    const newQty = line.quantity + delta;
    let updatedItems: OrderLineItem[];
    if (newQty <= 0) {
      updatedItems = order.items.filter((i) => i.lineId !== lineId);
    } else {
      updatedItems = order.items.map((i) => (i.lineId === lineId ? { ...i, quantity: newQty } : i));
    }

    const totals = recalculateOrderTotals(updatedItems, order.customer);
    const updatedOrder: BarOrder = {
      ...order,
      items: updatedItems,
      ...totals,
      updatedAt: new Date().toISOString(),
    };

    state = {
      ...state,
      orders: state.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
    };
    notify();

    return { success: true };
  },

  updateLineModifiers: (orderId: string, lineId: string, modifiers: string[], notes: string) => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;

    const updatedItems = order.items.map((i) =>
      i.lineId === lineId ? { ...i, modifiers, notes } : i
    );

    state = {
      ...state,
      orders: state.orders.map((o) => (o.id === orderId ? { ...o, items: updatedItems } : o)),
    };
    notify();
  },

  voidOrCompLine: (orderId: string, lineId: string, reason: string, adminPin: string, isComp = false) => {
    if (adminPin !== "1234" && adminPin !== "9999" && adminPin !== "0000") {
      return { success: false, error: "Invalid Admin PIN. Authorized approval required." };
    }

    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: "Order not found." };

    const updatedItems = order.items.map((i) => {
      if (i.lineId === lineId) {
        return {
          ...i,
          status: "VOIDED" as const,
          voidReason: `${isComp ? "[COMPED] " : "[VOIDED] "}${reason}`,
          voidedBy: `Admin PIN: ${adminPin}`,
        };
      }
      return i;
    });

    const totals = recalculateOrderTotals(updatedItems, order.customer);
    const updatedOrder: BarOrder = {
      ...order,
      items: updatedItems,
      ...totals,
      updatedAt: new Date().toISOString(),
    };

    state = {
      ...state,
      orders: state.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
    };
    notify();

    return { success: true };
  },

  sendOrderToStation: (orderId: string) => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return { sentCount: 0 };

    const now = new Date().toISOString();
    let sentCount = 0;

    const updatedItems = order.items.map((item) => {
      if (item.status === "NEW") {
        sentCount += 1;
        return {
          ...item,
          status: "SENT" as const,
          sentAt: now,
        };
      }
      return item;
    });

    const updatedOrder: BarOrder = {
      ...order,
      items: updatedItems,
      updatedAt: now,
    };

    const updatedTables = order.tableId
      ? state.tables.map((t) =>
          t.id === order.tableId
            ? {
                ...t,
                status: "OCCUPIED" as const,
                occupiedSince: t.occupiedSince || now,
              }
            : t
        )
      : state.tables;

    state = {
      ...state,
      orders: state.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
      tables: updatedTables,
    };
    notify();

    return { sentCount };
  },

  updateKDSLineStatus: (orderId: string, lineId: string, newStatus: LineItemStatus) => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;

    const now = new Date().toISOString();
    const updatedItems = order.items.map((item) => {
      if (item.lineId === lineId) {
        return {
          ...item,
          status: newStatus,
          preparedAt: newStatus === "PREPARING" ? now : item.preparedAt,
          readyAt: newStatus === "READY" ? now : item.readyAt,
          servedAt: newStatus === "SERVED" ? now : item.servedAt,
        };
      }
      return item;
    });

    const updatedOrder = { ...order, items: updatedItems, updatedAt: now };
    const readyCount = updatedItems.filter((i) => i.status === "READY").length;

    const updatedTables = order.tableId
      ? state.tables.map((t) => (t.id === order.tableId ? { ...t, readyItemsCount: readyCount } : t))
      : state.tables;

    state = {
      ...state,
      orders: state.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
      tables: updatedTables,
    };
    notify();
  },

  markLineServed: (orderId: string, lineId: string) => {
    barActions.updateKDSLineStatus(orderId, lineId, "SERVED");
  },

  requestBillForTable: (tableId: string) => {
    state = {
      ...state,
      tables: state.tables.map((t) =>
        t.id === tableId
          ? { ...t, status: "BILL_REQUESTED" as const, billRequestedAt: new Date().toISOString() }
          : t
      ),
      orders: state.orders.map((o) => (o.tableId === tableId ? { ...o, isBillRequested: true } : o)),
    };
    notify();
  },

  transferOrMergeTable: (sourceTableId: string, targetTableId: string, mode: "TRANSFER" | "MERGE") => {
    const sourceTable = state.tables.find((t) => t.id === sourceTableId);
    const targetTable = state.tables.find((t) => t.id === targetTableId);

    if (!sourceTable || !targetTable) return { success: false, message: "Tables not found." };
    if (!sourceTable.currentOrderId) return { success: false, message: "Source table has no active order." };

    const sourceOrder = state.orders.find((o) => o.id === sourceTable.currentOrderId);
    if (!sourceOrder) return { success: false, message: "Active order not found." };

    if (mode === "TRANSFER") {
      const updatedSourceOrder = {
        ...sourceOrder,
        tableId: targetTableId,
        destination: { type: "TABLE" as const, targetId: targetTableId },
      };

      const updatedTables = state.tables.map((t) => {
        if (t.id === sourceTableId) {
          return {
            ...t,
            status: "FREE" as const,
            currentOrderId: undefined,
            occupiedSince: undefined,
            readyItemsCount: 0,
          };
        }
        if (t.id === targetTableId) {
          return {
            ...t,
            status: "OCCUPIED" as const,
            currentOrderId: sourceOrder.id,
            occupiedSince: sourceTable.occupiedSince || new Date().toISOString(),
            readyItemsCount: sourceTable.readyItemsCount,
          };
        }
        return t;
      });

      state = {
        ...state,
        tables: updatedTables,
        orders: state.orders.map((o) => (o.id === sourceOrder.id ? updatedSourceOrder : o)),
      };
      notify();

      return { success: true, message: `Transferred ${sourceTable.name} to ${targetTable.name}.` };
    } else {
      let targetOrder = targetTable.currentOrderId
        ? state.orders.find((o) => o.id === targetTable.currentOrderId)
        : undefined;

      if (!targetOrder) {
        return barActions.transferOrMergeTable(sourceTableId, targetTableId, "TRANSFER");
      }

      const mergedItems = [...targetOrder.items, ...sourceOrder.items];
      const mergedTotals = recalculateOrderTotals(mergedItems, targetOrder.customer || sourceOrder.customer);

      const updatedTargetOrder: BarOrder = {
        ...targetOrder,
        items: mergedItems,
        ...mergedTotals,
        updatedAt: new Date().toISOString(),
      };

      const updatedTables = state.tables.map((t) => {
        if (t.id === sourceTableId) {
          return {
            ...t,
            status: "FREE" as const,
            currentOrderId: undefined,
            occupiedSince: undefined,
            readyItemsCount: 0,
          };
        }
        if (t.id === targetTableId) {
          return {
            ...t,
            status: "OCCUPIED" as const,
            readyItemsCount: (t.readyItemsCount || 0) + (sourceTable.readyItemsCount || 0),
          };
        }
        return t;
      });

      state = {
        ...state,
        tables: updatedTables,
        orders: state.orders
          .filter((o) => o.id !== sourceOrder.id)
          .map((o) => (o.id === targetOrder.id ? updatedTargetOrder : o)),
      };
      notify();

      return { success: true, message: `Merged ${sourceTable.name} into ${targetTable.name}.` };
    }
  },

  attachOrderToCourt: (orderId: string, courtName: string) => {
    state = {
      ...state,
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              courtBookingRef: courtName,
              destination: { type: "COURT", targetId: courtName },
            }
          : o
      ),
    };
    notify();
  },

  openNewTab: (
    memberId: string,
    memberName: string,
    tier: "SILVER" | "GOLD" | "PLATINUM",
    creditLimit = 10000,
    tableId?: string
  ) => {
    const tabNumber = state.tabs.length + 1;
    const newTabId = `TAB-${tabNumber.toString().padStart(2, "0")}`;

    const newTab: BarTab = {
      id: newTabId,
      tabNumber,
      name: memberName,
      memberId,
      memberName,
      memberTier: tier,
      openedAt: new Date().toISOString(),
      activeTableIds: tableId ? [tableId] : [],
      orders: [],
      runningTotal: 0,
      creditLimit,
      status: "OPEN",
    };

    state = {
      ...state,
      tabs: [newTab, ...state.tabs],
    };
    notify();

    return newTab;
  },

  moveTabToMemberAccount: (tabId: string, reason: string, adminPin: string) => {
    if (adminPin !== "1234" && adminPin !== "9999") {
      return { success: false, error: "Admin PIN required to move tab balance to member account." };
    }

    const tab = state.tabs.find((t) => t.id === tabId);
    if (!tab) return { success: false, error: "Tab not found." };

    const updatedTab: BarTab = {
      ...tab,
      status: "MOVED_TO_ACCOUNT",
      movedToAccountAt: new Date().toISOString(),
      movedToAccountBy: `Admin PIN: ${adminPin} (${reason})`,
      movedToAccountAdminPin: adminPin,
    };

    const remainingOpen = state.tabs.filter((t) => t.id !== tabId && t.status === "OPEN").length;

    state = {
      ...state,
      tabs: state.tabs.map((t) => (t.id === tabId ? updatedTab : t)),
      dailyClosing: {
        ...state.dailyClosing,
        unsettledTabsCount: remainingOpen,
      },
    };
    notify();

    return { success: true };
  },

  settleBill: (
    orderId: string,
    payments: BillPaymentLeg[],
    splitMode: BillSplitMode,
    subtotalOverride?: number
  ) => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: "Order not found." };

    const receiptNumber = `RCP-BAR-${Math.floor(100000 + Math.random() * 900000)}`;
    const billNumber = `BILL-${order.orderNumber}`;

    const settledOrder: BarOrder = {
      ...order,
      isSettled: true,
      updatedAt: new Date().toISOString(),
    };

    const updatedTables = order.tableId
      ? state.tables.map((t) =>
          t.id === order.tableId
            ? {
                ...t,
                status: "FREE" as const,
                currentOrderId: undefined,
                occupiedSince: undefined,
                billRequestedAt: undefined,
                readyItemsCount: 0,
              }
            : t
        )
      : state.tables;

    const receipt: BarReceipt = {
      receiptNumber,
      billNumber,
      orderId,
      tableName: order.tableId ? state.tables.find((t) => t.id === order.tableId)?.name : undefined,
      tabName: order.tabId ? state.tabs.find((t) => t.id === order.tabId)?.name : undefined,
      waiterName: order.waiterName,
      timestamp: new Date().toISOString(),
      customer: order.customer,
      items: order.items
        .filter((i) => i.status !== "VOIDED")
        .map((i) => ({
          name: i.name,
          qty: i.quantity,
          price: i.price,
          amount: i.price * i.quantity,
          notes: i.notes,
        })),
      subtotal: order.subtotal,
      discountPercent: order.customer?.discountPercent || 0,
      discountAmount: order.discountAmount,
      gstAmount: order.taxAmount,
      roundOff: 0,
      grandTotal: order.total,
      payments,
    };

    let cashAdd = 0;
    let upiAdd = 0;
    let cardAdd = 0;
    let tabAdd = 0;
    payments.forEach((p) => {
      if (p.method === "CASH") cashAdd += p.amount;
      else if (p.method === "UPI") upiAdd += p.amount;
      else if (p.method === "CARD") cardAdd += p.amount;
      else if (p.method === "MEMBER_TAB") tabAdd += p.amount;
    });

    const updatedClosing: DailyClosingReport = {
      ...state.dailyClosing,
      grossSales: state.dailyClosing.grossSales + order.subtotal,
      memberDiscounts: state.dailyClosing.memberDiscounts + order.discountAmount,
      taxesCollected: state.dailyClosing.taxesCollected + order.taxAmount,
      netRevenue: state.dailyClosing.netRevenue + order.total,
      totalOrders: state.dailyClosing.totalOrders + 1,
      totalCovers: state.dailyClosing.totalCovers + (order.tableId ? 2 : 1),
      paymentBreakdown: {
        cash: state.dailyClosing.paymentBreakdown.cash + cashAdd,
        upi: state.dailyClosing.paymentBreakdown.upi + upiAdd,
        card: state.dailyClosing.paymentBreakdown.card + cardAdd,
        tabs: state.dailyClosing.paymentBreakdown.tabs + tabAdd,
      },
    };

    state = {
      ...state,
      orders: state.orders.map((o) => (o.id === orderId ? settledOrder : o)),
      tables: updatedTables,
      dailyClosing: updatedClosing,
    };
    notify();

    return { success: true, receipt };
  },

  toggleMenuItemAvailability: (menuItemId: string) => {
    state = {
      ...state,
      menuItems: state.menuItems.map((m) =>
        m.id === menuItemId ? { ...m, isAvailable: !m.isAvailable } : m
      ),
    };
    notify();
  },

  adjustBarStock: (menuItemId: string, newQty: number, reason: string) => {
    state = {
      ...state,
      menuItems: state.menuItems.map((m) =>
        m.id === menuItemId
          ? {
              ...m,
              stockQty: Math.max(0, newQty),
              isAvailable: newQty > 0 ? m.isAvailable : false,
            }
          : m
      ),
    };
    notify();
  },

  clockInOutShift: (pin: string) => {
    if (state.activeShift.isOpen) {
      const closedShift: ShiftState = {
        ...state.activeShift,
        isOpen: false,
        clockOutTime: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };
      state = { ...state, activeShift: closedShift };
      notify();
      return { success: true, message: `Clocked out ${state.activeShift.staffName}.` };
    } else {
      const openedShift: ShiftState = {
        shiftId: `SHF-${Date.now()}`,
        staffName: "Aarav Mehta",
        staffId: "STF-02",
        clockInTime: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        isOpen: true,
        openingFloat: 5000,
        cashMovements: [
          {
            id: `CM-${Date.now()}`,
            type: "CASH_IN",
            amount: 5000,
            reason: "Opening float",
            timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          },
        ],
      };
      state = { ...state, activeShift: openedShift };
      notify();
      return { success: true, message: "Clocked in successfully as Aarav Mehta." };
    }
  },

  recordCashMovement: (type: "CASH_IN" | "CASH_OUT", amount: number, reason: string) => {
    const newMovement = {
      id: `CM-${Date.now()}`,
      type,
      amount,
      reason,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    state = {
      ...state,
      activeShift: {
        ...state.activeShift,
        cashMovements: [...state.activeShift.cashMovements, newMovement],
      },
    };
    notify();
  },

  closeShift: (countedCash: number) => {
    const netMovements = state.activeShift.cashMovements.reduce(
      (acc, m) => (m.type === "CASH_IN" ? acc + m.amount : acc - m.amount),
      0
    );
    const expectedCash = netMovements;
    const variance = countedCash - expectedCash;

    const updatedShift: ShiftState = {
      ...state.activeShift,
      isOpen: false,
      countedCash,
      closedAt: new Date().toISOString(),
    };

    state = { ...state, activeShift: updatedShift };
    notify();

    return { variance };
  },

  closeDailyOperations: () => {
    const updatedClosing: DailyClosingReport = {
      ...state.dailyClosing,
      isClosed: true,
      closedAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      closedBy: "Admin",
    };

    state = { ...state, dailyClosing: updatedClosing };
    notify();

    return { success: true };
  },

  reopenDailyOperations: (adminPin: string, reason: string) => {
    if (adminPin !== "1234" && adminPin !== "9999") {
      return { success: false, error: "Invalid Admin PIN. Reopening day requires admin authorization." };
    }

    const updatedClosing: DailyClosingReport = {
      ...state.dailyClosing,
      isClosed: false,
      reopenedAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      reopenedBy: `Admin PIN: ${adminPin}`,
      reopenReason: reason,
    };

    state = { ...state, dailyClosing: updatedClosing };
    notify();

    return { success: true };
  },

  toggleSoundChime: () => {
    state = { ...state, soundChimeEnabled: !state.soundChimeEnabled };
    notify();
  },

  simulateIncomingOrder: () => {
    const num = 1090 + Math.floor(Math.random() * 50);
    const freeTables = state.tables.filter((t) => t.status === "FREE");
    const targetTable = freeTables.length > 0 ? freeTables[0] : undefined;

    const sampleItems = [
      state.menuItems[0], // fries
      state.menuItems[2], // kathi roll
      state.menuItems[14], // gin & tonic
      state.menuItems[16], // beer
    ];

    const randomItem = sampleItems[Math.floor(Math.random() * sampleItems.length)];
    const orderId = `ORD-${num}`;

    const newOrder: BarOrder = {
      id: orderId,
      orderNumber: num,
      tableId: targetTable?.id,
      destination: targetTable
        ? { type: "TABLE", targetId: targetTable.id }
        : { type: "QUICK", targetId: `Takeaway #${num}` },
      customer: { name: "Guest " + num, tier: "NONE", discountPercent: 0 },
      waiterId: "STF-02",
      waiterName: state.activeStaffName,
      waiterInitials: state.activeStaffInitials,
      items: [
        {
          lineId: `L-SIM-${Date.now()}`,
          menuItemId: randomItem.id,
          name: randomItem.name,
          price: randomItem.price,
          taxRate: randomItem.taxRate,
          quantity: 1,
          station: randomItem.station,
          status: "NEW",
          sentAt: new Date().toISOString(),
        },
      ],
      subtotal: randomItem.price,
      discountAmount: 0,
      taxAmount: Math.round(randomItem.price * randomItem.taxRate),
      total: Math.round(randomItem.price * (1 + randomItem.taxRate)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedTables = targetTable
      ? state.tables.map((t) =>
          t.id === targetTable.id
            ? {
                ...t,
                status: "OCCUPIED" as const,
                currentOrderId: orderId,
                occupiedSince: new Date().toISOString(),
              }
            : t
        )
      : state.tables;

    state = {
      ...state,
      orders: [newOrder, ...state.orders],
      tables: updatedTables,
    };
    notify();
  },
};

// React hook connecting to external store
export function useBarStore() {
  const currentSnapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return useMemo(
    () => ({
      ...currentSnapshot,
      ...barActions,
    }),
    [currentSnapshot]
  );
}
