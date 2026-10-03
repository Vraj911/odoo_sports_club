import { useSyncExternalStore, useCallback, useMemo } from "react";
import type {
  CartItem,
  MemberTier,
  Product,
  ProductCategory,
  ProductVariant,
  POSCustomer,
  POSCartSession,
  POSReceipt,
  ConsoleOrder,
  InventoryMovement,
  VariantStockInfo,
  PurchaseOrder,
  PurchaseOrderItem,
  ReturnRecord,
  ReturnItem,
  RestringJob,
  RestringStatus,
  OrderStatus,
  PaymentMethod,
  POSSplitItem,
} from "./types";
import { TIER_DISCOUNTS } from "./types";
import {
  SAMPLE_PRODUCTS,
  getProductBySlug,
  getProductById,
  getProductsByCategory,
  getProductsBySport,
  getFeaturedProducts,
  getTotalStock,
} from "./sampleData";

const RESERVATION_MS = 10 * 60 * 1000; // 10 minutes

// ─── Initial Stock Overrides & Reservations ─────────────────────────────
// Map of variantId -> onHand stock
const onHandStock = new Map<string, number>();
// Map of variantId -> list of { orderId, quantity }
const onlineReservations = new Map<string, { orderId: string; quantity: number }[]>();
// Map of variantId -> cart holds from public web shoppers
const cartHolds = new Map<string, number>();

// Initialize default on-hand stock from sample products
SAMPLE_PRODUCTS.forEach((prod) => {
  prod.variants.forEach((v) => {
    onHandStock.set(v.id, v.stock);
  });
});

// Seed specific online reservations for acceptance scenario
// PRD-004 (Head Radical MP G2) has onHand = 1, reserved = 1 for #SO-1042 (available = 0)
onHandStock.set("V-004A", 1);
onlineReservations.set("V-004A", [{ orderId: "SO-1042", quantity: 1 }]);

// Seed reservation for Yonex Astrox 99 Pro G4
onlineReservations.set("V-001A", [{ orderId: "SO-1043", quantity: 1 }]);

// ─── Seed Orders ────────────────────────────────────────────────────────
const INITIAL_ORDERS: ConsoleOrder[] = [
  {
    id: "ord-1042",
    orderNumber: "SO-1042",
    customerName: "Rohan Sharma",
    customerPhone: "+91 98201 55432",
    customerEmail: "rohan.sharma@gmail.com",
    memberId: "CC-000104",
    memberTier: "Gold",
    channel: "ONLINE",
    fulfillmentType: "PICKUP",
    slot: "Today, 18:30 IST",
    items: [
      {
        productId: "PRD-004",
        variantId: "V-004A",
        quantity: 1,
        reservedAt: Date.now() - 15 * 60 * 1000,
        name: "Head Radical MP 2024",
        brand: "Head",
        unitPrice: 18990,
        mrp: 20990,
        variantLabel: "Grip 2",
        stock: 0,
      },
    ],
    subtotal: 18990,
    discount: 2849,
    discountLabel: "Gold Member 15%",
    tax: 2905,
    total: 19046,
    status: "PLACED",
    paymentMethod: "UPI",
    paymentReference: "UPI-4291880921@okicici",
    pickupCode: "PC-1042",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    timeline: [
      { status: "PLACED", timestamp: "25m ago", note: "Order placed via online portal" },
      { status: "PAID", timestamp: "25m ago", note: "UPI Payment verified (Ref: 4291880921)" },
    ],
  },
  {
    id: "ord-1043",
    orderNumber: "SO-1043",
    customerName: "Priya Mehta",
    customerPhone: "+91 98202 99112",
    customerEmail: "priya.mehta@outlook.com",
    memberId: "CC-000108",
    memberTier: "Silver",
    channel: "ONLINE",
    fulfillmentType: "PICKUP",
    slot: "Today, 19:00 IST",
    items: [
      {
        productId: "PRD-001",
        variantId: "V-001A",
        quantity: 1,
        reservedAt: Date.now() - 45 * 60 * 1000,
        name: "Yonex Astrox 99 Pro",
        brand: "Yonex",
        unitPrice: 14999,
        mrp: 17990,
        variantLabel: "Grip G4",
        stock: 4,
      },
    ],
    subtotal: 14999,
    discount: 1200,
    discountLabel: "Silver Member 8%",
    tax: 2484,
    total: 16283,
    status: "PACKED",
    paymentMethod: "CARD",
    paymentReference: "HDFC-POS-882199",
    pickupCode: "PC-8821",
    createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    timeline: [
      { status: "PLACED", timestamp: "50m ago", note: "Order confirmed online" },
      { status: "PAID", timestamp: "50m ago", note: "HDFC Payment Gateway approved" },
      { status: "PACKED", timestamp: "20m ago", note: "Packed in Locker Bin #4 by Anita" },
    ],
  },
  {
    id: "ord-1044",
    orderNumber: "SO-1044",
    customerName: "Aarav Gupta",
    customerPhone: "+91 98333 44123",
    customerEmail: "aarav.gupta@corp.in",
    memberId: "CC-000115",
    memberTier: "Gold",
    channel: "ONLINE",
    fulfillmentType: "PICKUP",
    slot: "Today, 17:00 IST",
    items: [
      {
        productId: "PRD-003",
        variantId: "V-003A",
        quantity: 1,
        reservedAt: Date.now() - 90 * 60 * 1000,
        name: "Wilson Blade 98 v9",
        brand: "Wilson",
        unitPrice: 19999,
        mrp: 21990,
        variantLabel: "Grip 2",
        stock: 6,
      },
    ],
    subtotal: 19999,
    discount: 3000,
    discountLabel: "Gold Member 15%",
    tax: 3060,
    total: 20059,
    status: "READY_FOR_PICKUP",
    paymentMethod: "UPI",
    pickupCode: "PC-7734",
    createdAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    timeline: [
      { status: "PLACED", timestamp: "95m ago", note: "Order placed online" },
      { status: "PACKED", timestamp: "40m ago", note: "Checked & bagged" },
      { status: "READY_FOR_PICKUP", timestamp: "10m ago", note: "Staged at Pro Shop Counter" },
    ],
  },
  {
    id: "ord-1045",
    orderNumber: "SO-1045",
    customerName: "Sania Mirza",
    customerPhone: "+91 98111 22334",
    memberTier: "Guest",
    channel: "ONLINE",
    fulfillmentType: "DELIVERY",
    deliveryAddress: "Flat 901, Palm Court, Bandra West, Mumbai 400050",
    items: [
      {
        productId: "PRD-002",
        variantId: "V-002B",
        quantity: 1,
        reservedAt: Date.now() - 120 * 60 * 1000,
        name: "Babolat Pure Aero 2024",
        brand: "Babolat",
        unitPrice: 22490,
        mrp: 24990,
        variantLabel: "Grip 3",
        stock: 5,
      },
    ],
    subtotal: 22490,
    discount: 0,
    discountLabel: "No discount",
    tax: 4048,
    total: 26538,
    status: "OUT_FOR_DELIVERY",
    paymentMethod: "CARD",
    pickupCode: "DEL-9011",
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    timeline: [
      { status: "PLACED", timestamp: "2h ago", note: "Order placed online" },
      { status: "PACKED", timestamp: "1h ago", note: "Handed over to Dunzo Courier #DZ-881" },
      { status: "OUT_FOR_DELIVERY", timestamp: "35m ago", note: "Out for delivery with rider" },
    ],
  },
  {
    id: "ord-1040",
    orderNumber: "SO-1040",
    customerName: "Vikram Rao",
    customerPhone: "+91 99222 33445",
    memberId: "CC-000102",
    memberTier: "Gold",
    channel: "COUNTER",
    fulfillmentType: "PICKUP",
    items: [
      {
        productId: "PRD-074",
        variantId: "V-074A",
        quantity: 2,
        reservedAt: Date.now() - 180 * 60 * 1000,
        name: "Champions Club Headband",
        brand: "Champions Club",
        unitPrice: 299,
        mrp: 399,
        variantLabel: "Color: White",
        stock: 18,
      },
    ],
    subtotal: 598,
    discount: 90,
    discountLabel: "Gold Member 15%",
    tax: 91,
    total: 599,
    status: "COLLECTED",
    paymentMethod: "CASH",
    pickupCode: "POS-0081",
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 175 * 60 * 1000).toISOString(),
    timeline: [
      { status: "PLACED", timestamp: "3h ago", note: "Counter POS Transaction" },
      { status: "COLLECTED", timestamp: "3h ago", note: "Handed to customer by Vikram" },
    ],
  },
];

// ─── Seed Inventory Movements ───────────────────────────────────────────
const INITIAL_MOVEMENTS: InventoryMovement[] = [
  {
    id: "MOV-1001",
    variantId: "V-001A",
    productId: "PRD-001",
    productName: "Yonex Astrox 99 Pro (G4)",
    sku: "YNX-AX99P-G4",
    type: "receipt",
    quantity: 10,
    reference: "PO-2026-081",
    user: "Vikram Staff",
    reason: "Goods Inward from Yonex India Logistics",
    timestamp: new Date(Date.now() - 48 * 3600 * 1000).toLocaleString("en-IN"),
  },
  {
    id: "MOV-1002",
    variantId: "V-002B",
    productId: "PRD-002",
    productName: "Babolat Pure Aero 2024 (G3)",
    sku: "BAB-PA24-G3",
    type: "sale",
    quantity: -1,
    reference: "POS-0082",
    user: "Priya Cashier",
    reason: "Walk-in Counter Sale",
    timestamp: new Date(Date.now() - 24 * 3600 * 1000).toLocaleString("en-IN"),
  },
  {
    id: "MOV-1003",
    variantId: "V-004C",
    productId: "PRD-004",
    productName: "Head Radical MP 2024 (G4)",
    sku: "HEAD-RAD-G4",
    type: "damage",
    quantity: -1,
    reference: "STK-ADJ-09",
    user: "Vikram Staff",
    reason: "Display frame hairline crack discovered during morning inspection",
    timestamp: new Date(Date.now() - 12 * 3600 * 1000).toLocaleString("en-IN"),
  },
  {
    id: "MOV-1004",
    variantId: "V-074C",
    productId: "PRD-074",
    productName: "Champions Club Headband (Lime)",
    sku: "CC-HB-LME",
    type: "adjustment",
    quantity: 5,
    reference: "AUD-2026-Q3",
    user: "Admin",
    reason: "Physical cycle count discrepancy correction",
    timestamp: new Date(Date.now() - 6 * 3600 * 1000).toLocaleString("en-IN"),
  },
];

// ─── Seed Purchase Orders ───────────────────────────────────────────────
const INITIAL_POS: PurchaseOrder[] = [
  {
    id: "PO-2026-092",
    poNumber: "PO-2026-092",
    supplier: "Yonex Sunrise India Pvt Ltd",
    status: "SENT",
    items: [
      {
        variantId: "V-001A",
        productId: "PRD-001",
        productName: "Yonex Astrox 99 Pro",
        variantLabel: "Grip Size G4",
        sku: "YNX-AX99P-G4",
        quantity: 12,
        unitCost: 10500,
        totalCost: 126000,
      },
      {
        variantId: "V-001B",
        productId: "PRD-001",
        productName: "Yonex Astrox 99 Pro",
        variantLabel: "Grip Size G5",
        sku: "YNX-AX99P-G5",
        quantity: 8,
        unitCost: 10500,
        totalCost: 84000,
      },
    ],
    subtotal: 210000,
    gst: 37800,
    total: 247800,
    createdAt: "2026-10-01",
    expectedDate: "2026-10-06",
    notes: "Urgent tournament restock ahead of Maharashtra State Open",
  },
  {
    id: "PO-2026-089",
    poNumber: "PO-2026-089",
    supplier: "Wilson Sports India",
    status: "RECEIVED",
    items: [
      {
        variantId: "V-003A",
        productId: "PRD-003",
        productName: "Wilson Blade 98 v9",
        variantLabel: "Grip 2",
        sku: "WIL-BL98-G2",
        quantity: 10,
        unitCost: 14200,
        totalCost: 142000,
      },
    ],
    subtotal: 142000,
    gst: 25560,
    total: 167560,
    createdAt: "2026-09-24",
    expectedDate: "2026-09-28",
    receivedAt: "2026-09-28",
    billRecorded: true,
    notes: "Goods received and verified by Store Manager. Bill recorded in FIN-10.",
  },
  {
    id: "PO-2026-095",
    poNumber: "PO-2026-095",
    supplier: "Babolat South Asia",
    status: "DRAFT",
    items: [
      {
        variantId: "V-002C",
        productId: "PRD-002",
        productName: "Babolat Pure Aero 2024",
        variantLabel: "Grip 4",
        sku: "BAB-PA24-G4",
        quantity: 6,
        unitCost: 15800,
        totalCost: 94800,
      },
    ],
    subtotal: 94800,
    gst: 17064,
    total: 111864,
    createdAt: "2026-10-03",
    expectedDate: "2026-10-10",
    notes: "Restock for low stock alert on Grip 4",
  },
];

// ─── Seed Returns ───────────────────────────────────────────────────────
const INITIAL_RETURNS: ReturnRecord[] = [
  {
    id: "RET-01",
    returnNumber: "RET-2026-0041",
    orderNumber: "SO-1028",
    customerName: "Kavita Rao",
    customerPhone: "+91 98205 11223",
    items: [
      {
        variantId: "V-074B",
        productName: "Champions Club Headband",
        variantLabel: "Black",
        quantity: 1,
        unitPrice: 299,
        refundAmount: 299,
        condition: "RESTOCK",
      },
    ],
    totalRefund: 299,
    refundMethod: "ORIGINAL_PAYMENT",
    reason: "Customer ordered wrong color by mistake, unopened package",
    createdAt: "2026-10-02 14:15",
    processedBy: "Anita Staff",
  },
];

// ─── Seed Restringing Jobs ──────────────────────────────────────────────
const INITIAL_RESTRING: RestringJob[] = [
  {
    id: "RST-101",
    ticketNumber: "RST-2026-081",
    customerName: "Pratham Patel",
    customerPhone: "+91 98201 12345",
    memberId: "CC-000123",
    racketBrand: "Babolat",
    racketModel: "Pure Drive 2023",
    stringType: "Babolat RPM Blast 1.25mm",
    tensionMain: 54,
    tensionCross: 52,
    dueTime: "Today, 19:30 IST",
    price: 1200,
    status: "READY",
    notes: "Pre-match restringing for inter-club fixture. Stencil club logo.",
    createdAt: "2026-10-03 10:15",
    billedAtPOS: true,
  },
  {
    id: "RST-102",
    ticketNumber: "RST-2026-082",
    customerName: "Karthik Iyer",
    customerPhone: "+91 98209 88776",
    memberId: "CC-000142",
    racketBrand: "Yonex",
    racketModel: "Nanoflare 1000Z",
    stringType: "Yonex BG80 Power",
    tensionMain: 28,
    tensionCross: 28,
    dueTime: "Tomorrow, 11:00 IST",
    price: 850,
    status: "IN_PROGRESS",
    notes: "Handle with extra care; high tension player.",
    createdAt: "2026-10-03 12:40",
    billedAtPOS: false,
  },
  {
    id: "RST-103",
    ticketNumber: "RST-2026-083",
    customerName: "Siddharth Verma",
    customerPhone: "+91 98114 55667",
    racketBrand: "Wilson",
    racketModel: "Clash 100 Pro",
    stringType: "Luxilon ALU Power Rough",
    tensionMain: 52,
    tensionCross: 50,
    dueTime: "Tomorrow, 16:00 IST",
    price: 1450,
    status: "RECEIVED",
    notes: "Walk-in guest player. Replace bumper guard grommet if damaged.",
    createdAt: "2026-10-03 15:10",
    billedAtPOS: false,
  },
];

// ─── Default 3-slot POS Cart Sessions ───────────────────────────────────
const DEFAULT_POS_SESSIONS: POSCartSession[] = [
  {
    id: "pos-cart-1",
    label: "Cart 1",
    customer: { isWalkIn: true, name: "Walk-in Customer", tier: "Guest" },
    items: [],
    createdAt: Date.now(),
  },
  {
    id: "pos-cart-2",
    label: "Cart 2",
    customer: { isWalkIn: true, name: "Walk-in Customer", tier: "Guest" },
    items: [],
    createdAt: Date.now(),
  },
  {
    id: "pos-cart-3",
    label: "Cart 3",
    customer: { isWalkIn: true, name: "Walk-in Customer", tier: "Guest" },
    items: [],
    createdAt: Date.now(),
  },
];

// ─── Full Store State Interface ─────────────────────────────────────────
interface FullShopStoreState {
  // Public web shop state
  cart: CartItem[];
  searchQuery: string;
  categoryFilter: ProductCategory | "all";
  sportFilter: string;
  sortBy: "name" | "price-asc" | "price-desc" | "newest";

  // Console POS state
  posSessions: POSCartSession[];
  activePosSessionId: string;
  lastReceipt: POSReceipt | null;

  // Management state
  orders: ConsoleOrder[];
  movements: InventoryMovement[];
  purchaseOrders: PurchaseOrder[];
  returns: ReturnRecord[];
  restringJobs: RestringJob[];
}

let state: FullShopStoreState = {
  cart: [],
  searchQuery: "",
  categoryFilter: "all",
  sportFilter: "all",
  sortBy: "name",
  posSessions: DEFAULT_POS_SESSIONS,
  activePosSessionId: "pos-cart-1",
  lastReceipt: null,
  orders: INITIAL_ORDERS,
  movements: INITIAL_MOVEMENTS,
  purchaseOrders: INITIAL_POS,
  returns: INITIAL_RETURNS,
  restringJobs: INITIAL_RESTRING,
};

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}
function getSnapshot() {
  return state;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ─── Helper Stock Calculations ──────────────────────────────────────────
export function getVariantStockDetail(variantId: string) {
  const onHand = onHandStock.get(variantId) ?? 0;
  const reservations = onlineReservations.get(variantId) ?? [];
  const reserved = reservations.reduce((sum, r) => sum + r.quantity, 0);
  const cartHold = cartHolds.get(variantId) ?? 0;
  const available = Math.max(0, onHand - reserved - cartHold);

  return {
    onHand,
    reserved,
    cartHold,
    available,
    reservedOrders: reservations,
  };
}

// ─── Main Shop Store API ────────────────────────────────────────────────
export const shopStore = {
  getState: () => state,

  // ─── Public Shop Filters & Cart ───
  setSearch: (q: string) => {
    state = { ...state, searchQuery: q };
    notify();
  },
  setCategory: (cat: ProductCategory | "all") => {
    state = { ...state, categoryFilter: cat };
    notify();
  },
  setSport: (sport: string) => {
    state = { ...state, sportFilter: sport };
    notify();
  },
  setSort: (sort: FullShopStoreState["sortBy"]) => {
    state = { ...state, sortBy: sort };
    notify();
  },

  addToCart: (product: Product, variant: ProductVariant, qty: number = 1): boolean => {
    const detail = getVariantStockDetail(variant.id);
    const existing = state.cart.find((c) => c.variantId === variant.id);
    const currentInCart = existing ? existing.quantity : 0;

    if (currentInCart + qty > detail.available) {
      return false;
    }

    // Record cart hold
    cartHolds.set(variant.id, (cartHolds.get(variant.id) ?? 0) + qty);

    const variantLabel = Object.entries(variant.axes)
      .map(([, v]) => v)
      .join(" / ");

    if (existing) {
      state = {
        ...state,
        cart: state.cart.map((c) =>
          c.variantId === variant.id
            ? { ...c, quantity: c.quantity + qty }
            : c
        ),
      };
    } else {
      const item: CartItem = {
        productId: product.id,
        variantId: variant.id,
        quantity: qty,
        reservedAt: Date.now(),
        name: product.name,
        brand: product.brand,
        image: product.images[0],
        unitPrice: variant.price,
        mrp: product.mrp,
        variantLabel: variantLabel || "Standard",
        stock: detail.available - qty,
      };
      state = { ...state, cart: [...state.cart, item] };
    }
    notify();
    return true;
  },

  updateQuantity: (variantId: string, newQty: number) => {
    const item = state.cart.find((c) => c.variantId === variantId);
    if (!item) return;

    const currentHold = cartHolds.get(variantId) ?? item.quantity;
    const diff = newQty - item.quantity;
    const detail = getVariantStockDetail(variantId);

    if (diff > 0 && diff > detail.available) return;

    if (newQty <= 0) {
      shopStore.removeFromCart(variantId);
      return;
    }

    cartHolds.set(variantId, currentHold + diff);
    state = {
      ...state,
      cart: state.cart.map((c) =>
        c.variantId === variantId ? { ...c, quantity: newQty } : c
      ),
    };
    notify();
  },

  removeFromCart: (variantId: string) => {
    const item = state.cart.find((c) => c.variantId === variantId);
    if (!item) return;

    const currentHold = cartHolds.get(variantId) ?? item.quantity;
    cartHolds.set(variantId, Math.max(0, currentHold - item.quantity));

    state = {
      ...state,
      cart: state.cart.filter((c) => c.variantId !== variantId),
    };
    notify();
  },

  clearCart: () => {
    state.cart.forEach((item) => {
      const currentHold = cartHolds.get(item.variantId) ?? item.quantity;
      cartHolds.set(item.variantId, Math.max(0, currentHold - item.quantity));
    });
    state = { ...state, cart: [] };
    notify();
  },

  pruneExpired: () => {
    const now = Date.now();
    const expired = state.cart.filter((c) => now - c.reservedAt > RESERVATION_MS);
    if (expired.length === 0) return;

    expired.forEach((item) => {
      const currentHold = cartHolds.get(item.variantId) ?? item.quantity;
      cartHolds.set(item.variantId, Math.max(0, currentHold - item.quantity));
    });

    state = {
      ...state,
      cart: state.cart.filter((c) => now - c.reservedAt <= RESERVATION_MS),
    };
    notify();
  },

  getVariantStock: (variantId: string, originalStock: number): number => {
    const detail = getVariantStockDetail(variantId);
    return detail.available;
  },

  // ─── Phase 6B: POS Console Cart & Sessions ────────────────────────────
  switchPOSSession: (sessionId: string) => {
    state = { ...state, activePosSessionId: sessionId };
    notify();
  },

  setPOSCustomer: (customer: POSCustomer) => {
    state = {
      ...state,
      posSessions: state.posSessions.map((s) =>
        s.id === state.activePosSessionId ? { ...s, customer } : s
      ),
    };
    notify();
  },

  /**
   * POS Add To Cart with STRICT check on online reservations.
   * If stock is reserved for an online order, counter sale is BLOCKED with the exact message.
   */
  posAddToCart: (
    product: Product,
    variant: ProductVariant,
    qty: number = 1
  ): { ok: boolean; error?: string; message?: string; reservedOrderId?: string } => {
    const active = state.posSessions.find((s) => s.id === state.activePosSessionId);
    if (!active) return { ok: false, error: "NO_ACTIVE_SESSION", message: "No active cart session." };

    const detail = getVariantStockDetail(variant.id);
    const existing = active.items.find((i) => i.variantId === variant.id);
    const existingQty = existing ? existing.quantity : 0;
    const requestedTotal = existingQty + qty;

    // Check if onHand has physical stock but it's reserved for online orders
    if (requestedTotal > detail.available) {
      if (detail.reservedOrders.length > 0) {
        const orderNumber = detail.reservedOrders[0].orderId;
        return {
          ok: false,
          error: "STOCK_INSUFFICIENT",
          message: `Last unit is reserved for online order #${orderNumber}`,
          reservedOrderId: orderNumber,
        };
      }
      return {
        ok: false,
        error: "STOCK_OUT",
        message: `Only ${detail.available} unit(s) available in stock.`,
      };
    }

    const variantLabel = Object.entries(variant.axes)
      .map(([, v]) => v)
      .join(" / ");

    let updatedItems: CartItem[];
    if (existing) {
      updatedItems = active.items.map((i) =>
        i.variantId === variant.id ? { ...i, quantity: i.quantity + qty } : i
      );
    } else {
      const newItem: CartItem = {
        productId: product.id,
        variantId: variant.id,
        quantity: qty,
        reservedAt: Date.now(),
        name: product.name,
        brand: product.brand,
        image: product.images[0],
        unitPrice: variant.price,
        mrp: product.mrp,
        variantLabel: variantLabel || "Standard",
        stock: detail.available - qty,
      };
      updatedItems = [...active.items, newItem];
    }

    state = {
      ...state,
      posSessions: state.posSessions.map((s) =>
        s.id === state.activePosSessionId ? { ...s, items: updatedItems } : s
      ),
    };
    notify();
    return { ok: true };
  },

  posUpdateQty: (variantId: string, qty: number): { ok: boolean; message?: string } => {
    const active = state.posSessions.find((s) => s.id === state.activePosSessionId);
    if (!active) return { ok: false };

    if (qty <= 0) {
      return shopStore.posRemoveItem(variantId);
    }

    const detail = getVariantStockDetail(variantId);
    if (qty > detail.available) {
      if (detail.reservedOrders.length > 0) {
        const orderNumber = detail.reservedOrders[0].orderId;
        return {
          ok: false,
          message: `Last unit is reserved for online order #${orderNumber}`,
        };
      }
      return { ok: false, message: `Only ${detail.available} units available.` };
    }

    const updated = active.items.map((i) =>
      i.variantId === variantId ? { ...i, quantity: qty } : i
    );

    state = {
      ...state,
      posSessions: state.posSessions.map((s) =>
        s.id === state.activePosSessionId ? { ...s, items: updated } : s
      ),
    };
    notify();
    return { ok: true };
  },

  posRemoveItem: (variantId: string): { ok: boolean } => {
    const active = state.posSessions.find((s) => s.id === state.activePosSessionId);
    if (!active) return { ok: false };

    state = {
      ...state,
      posSessions: state.posSessions.map((s) =>
        s.id === state.activePosSessionId
          ? { ...s, items: s.items.filter((i) => i.variantId !== variantId) }
          : s
      ),
    };
    notify();
    return { ok: true };
  },

  posClearCart: () => {
    state = {
      ...state,
      posSessions: state.posSessions.map((s) =>
        s.id === state.activePosSessionId
          ? {
              ...s,
              items: [],
              customer: { isWalkIn: true, name: "Walk-in Customer", tier: "Guest" },
            }
          : s
      ),
    };
    notify();
  },

  /**
   * Finalize and charge the active POS Cart
   */
  chargePOSCart: (params: {
    paymentMethod: PaymentMethod;
    tenderedCash?: number;
    splitDetails?: POSSplitItem[];
    upiRef?: string;
    cardRef?: string;
    staffName: string;
  }): POSReceipt => {
    const active = state.posSessions.find((s) => s.id === state.activePosSessionId)!;
    const subtotal = active.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const tier = active.customer.tier;
    const discountRate = TIER_DISCOUNTS[tier].percent / 100;
    const discountAmount = Math.round(subtotal * discountRate);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = Math.round(afterDiscount * 0.18);
    const total = afterDiscount + taxAmount;

    const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;
    const now = new Date();

    // 1. Deduct on-hand stock and create inventory movement for each line
    const newMovements: InventoryMovement[] = [];
    active.items.forEach((item) => {
      const current = onHandStock.get(item.variantId) ?? item.quantity;
      onHandStock.set(item.variantId, Math.max(0, current - item.quantity));

      newMovements.push({
        id: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        variantId: item.variantId,
        productId: item.productId,
        productName: item.name,
        sku: item.name.slice(0, 3).toUpperCase() + "-" + item.variantLabel,
        type: "sale",
        quantity: -item.quantity,
        reference: receiptNo,
        user: params.staffName,
        reason: `POS Sale to ${active.customer.name}`,
        timestamp: now.toLocaleString("en-IN"),
      });
    });

    const receipt: POSReceipt = {
      receiptNo,
      date: now.toLocaleDateString("en-IN"),
      time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      cashierName: params.staffName,
      customerName: active.customer.name,
      customerPhone: active.customer.phone,
      memberTier: tier,
      items: active.items.map((i) => ({
        name: i.name,
        variantLabel: i.variantLabel,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        mrp: i.mrp,
        total: i.unitPrice * i.quantity,
      })),
      subtotal,
      discountAmount,
      discountLabel: TIER_DISCOUNTS[tier].label,
      taxAmount,
      taxRatePercent: 18,
      total,
      paymentMethod: params.paymentMethod,
      tenderedCash: params.tenderedCash,
      changeDue: params.tenderedCash ? Math.max(0, params.tenderedCash - total) : 0,
      splitDetails: params.splitDetails,
      upiRef: params.upiRef,
      cardRef: params.cardRef,
    };

    // 2. Also record in console orders queue as COLLECTED counter order
    const counterOrder: ConsoleOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: receiptNo.replace("RCP", "SO"),
      customerName: active.customer.name,
      customerPhone: active.customer.phone || "+91 99999 00000",
      memberId: active.customer.memberId,
      memberTier: tier,
      channel: "COUNTER",
      fulfillmentType: "PICKUP",
      items: active.items,
      subtotal,
      discount: discountAmount,
      discountLabel: TIER_DISCOUNTS[tier].label,
      tax: taxAmount,
      total,
      status: "COLLECTED",
      paymentMethod: params.paymentMethod,
      pickupCode: receiptNo,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      timeline: [
        { status: "PLACED", timestamp: "Just now", note: `Counter sale by ${params.staffName}` },
        { status: "COLLECTED", timestamp: "Just now", note: "Handed to customer immediately" },
      ],
    };

    // Reset current active cart and save receipt
    state = {
      ...state,
      lastReceipt: receipt,
      movements: [...newMovements, ...state.movements],
      orders: [counterOrder, ...state.orders],
      posSessions: state.posSessions.map((s) =>
        s.id === state.activePosSessionId
          ? {
              ...s,
              items: [],
              customer: { isWalkIn: true, name: "Walk-in Customer", tier: "Guest" },
            }
          : s
      ),
    };
    notify();

    // Sync POS checkout with backend
    import("@/services/api/shopApi").then(({ shopApi }) => {
      shopApi
        .posCheckout({
          memberId: active.customer.memberId,
          customerName: active.customer.name,
          customerPhone: active.customer.phone,
          items: active.items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
          paymentMethod: params.paymentMethod,
          tenderedCash: params.tenderedCash,
        })
        .catch(() => {});
    });

    return receipt;
  },

  clearLastReceipt: () => {
    state = { ...state, lastReceipt: null };
    notify();
  },

  // ─── Phase 6B: Orders Queue Management ────────────────────────────────
  advanceOrderStatus: (
    orderId: string,
    nextStatus: OrderStatus,
    staffNote?: string
  ) => {
    const order = state.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!order) return;

    // If order was collected/delivered, release online reservation & reduce onHand
    if (nextStatus === "COLLECTED" || nextStatus === "DELIVERED") {
      order.items.forEach((item) => {
        const reservations = onlineReservations.get(item.variantId) || [];
        onlineReservations.set(
          item.variantId,
          reservations.filter((r) => r.orderId !== order.orderNumber && r.orderId !== order.id)
        );
        const curOnHand = onHandStock.get(item.variantId) ?? item.quantity;
        onHandStock.set(item.variantId, Math.max(0, curOnHand - item.quantity));
      });
    }

    const note = staffNote || `Status updated to ${nextStatus}`;
    const newTimeline = [
      ...order.timeline,
      { status: nextStatus, timestamp: "Just now", note },
    ];

    state = {
      ...state,
      orders: state.orders.map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: nextStatus,
              updatedAt: new Date().toISOString(),
              timeline: newTimeline,
            }
          : o
      ),
    };
    notify();
  },

  verifyPickupCode: (code: string): ConsoleOrder | undefined => {
    const clean = code.trim().toUpperCase();
    return state.orders.find(
      (o) =>
        o.pickupCode.toUpperCase() === clean ||
        o.orderNumber.toUpperCase() === clean ||
        o.id.toUpperCase() === clean
    );
  },

  cancelOrder: (orderId: string, reason: string) => {
    const order = state.orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!order) return;

    // Release online reservations
    order.items.forEach((item) => {
      const reservations = onlineReservations.get(item.variantId) || [];
      onlineReservations.set(
        item.variantId,
        reservations.filter((r) => r.orderId !== order.orderNumber && r.orderId !== order.id)
      );
    });

    const newTimeline = [
      ...order.timeline,
      { status: "CANCELLED", timestamp: "Just now", note: `Cancelled: ${reason}` },
    ];

    state = {
      ...state,
      orders: state.orders.map((o) =>
        o.id === order.id
          ? {
              ...o,
              status: "CANCELLED",
              updatedAt: new Date().toISOString(),
              timeline: newTimeline,
            }
          : o
      ),
    };
    notify();
  },

  // ─── Phase 6B: Inventory Adjustments & Movements ──────────────────────
  adjustStock: (params: {
    variantId: string;
    productId: string;
    productName: string;
    sku: string;
    type: "receipt" | "adjustment" | "damage";
    qtyDelta: number;
    reason: string;
    staffName: string;
  }) => {
    const currentOnHand = onHandStock.get(params.variantId) ?? 0;
    const newOnHand = Math.max(0, currentOnHand + params.qtyDelta);
    onHandStock.set(params.variantId, newOnHand);

    const movement: InventoryMovement = {
      id: `MOV-${Date.now()}`,
      variantId: params.variantId,
      productId: params.productId,
      productName: params.productName,
      sku: params.sku,
      type: params.type,
      quantity: params.qtyDelta,
      reference: `ADJ-${Date.now().toString().slice(-4)}`,
      user: params.staffName,
      reason: params.reason,
      timestamp: new Date().toLocaleString("en-IN"),
    };

    state = {
      ...state,
      movements: [movement, ...state.movements],
    };
    notify();
  },

  // ─── Phase 6B: Purchase Orders ────────────────────────────────────────
  createPurchaseOrder: (params: {
    supplier: string;
    items: PurchaseOrderItem[];
    notes?: string;
  }): PurchaseOrder => {
    const subtotal = params.items.reduce((s, i) => s + i.totalCost, 0);
    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst;
    const poNumber = `PO-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newPO: PurchaseOrder = {
      id: poNumber,
      poNumber,
      supplier: params.supplier,
      status: "DRAFT",
      items: params.items,
      subtotal,
      gst,
      total,
      createdAt: new Date().toISOString().split("T")[0],
      expectedDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      notes: params.notes,
    };

    state = {
      ...state,
      purchaseOrders: [newPO, ...state.purchaseOrders],
    };
    notify();
    return newPO;
  },

  receivePurchaseOrder: (poId: string, staffName: string) => {
    const po = state.purchaseOrders.find((p) => p.id === poId || p.poNumber === poId);
    if (!po || po.status === "RECEIVED") return;

    // Increase on-hand stock and create movements
    const movements: InventoryMovement[] = [];
    const now = new Date();
    po.items.forEach((item) => {
      const cur = onHandStock.get(item.variantId) ?? 0;
      onHandStock.set(item.variantId, cur + item.quantity);

      movements.push({
        id: `MOV-PO-${Date.now()}-${item.variantId}`,
        variantId: item.variantId,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        type: "receipt",
        quantity: item.quantity,
        reference: po.poNumber,
        user: staffName,
        reason: `Goods receipt for PO ${po.poNumber} from ${po.supplier}`,
        timestamp: now.toLocaleString("en-IN"),
      });
    });

    state = {
      ...state,
      purchaseOrders: state.purchaseOrders.map((p) =>
        p.id === po.id
          ? {
              ...p,
              status: "RECEIVED",
              receivedAt: now.toISOString().split("T")[0],
            }
          : p
      ),
      movements: [...movements, ...state.movements],
    };
    notify();
  },

  recordSupplierBill: (poId: string) => {
    state = {
      ...state,
      purchaseOrders: state.purchaseOrders.map((p) =>
        p.id === poId ? { ...p, billRecorded: true } : p
      ),
    };
    notify();
  },

  // ─── Phase 6B: Returns ────────────────────────────────────────────────
  processReturn: (params: {
    orderNumber: string;
    customerName: string;
    customerPhone?: string;
    items: ReturnItem[];
    totalRefund: number;
    refundMethod: ReturnRecord["refundMethod"];
    reason: string;
    staffName: string;
  }): ReturnRecord => {
    const returnNumber = `RET-2026-${Math.floor(100 + Math.random() * 900)}`;
    const creditNoteNumber =
      params.refundMethod === "CREDIT_NOTE"
        ? `CN-2026-${Math.floor(1000 + Math.random() * 9000)}`
        : undefined;

    const newMovements: InventoryMovement[] = [];
    const now = new Date();

    params.items.forEach((item) => {
      if (item.condition === "RESTOCK") {
        const cur = onHandStock.get(item.variantId) ?? 0;
        onHandStock.set(item.variantId, cur + item.quantity);

        newMovements.push({
          id: `MOV-RET-${Date.now()}-${item.variantId}`,
          variantId: item.variantId,
          productId: "PRD",
          productName: item.productName,
          sku: item.variantLabel,
          type: "return",
          quantity: item.quantity,
          reference: returnNumber,
          user: params.staffName,
          reason: `Restocked customer return (${params.reason})`,
          timestamp: now.toLocaleString("en-IN"),
        });
      } else {
        newMovements.push({
          id: `MOV-DMG-${Date.now()}-${item.variantId}`,
          variantId: item.variantId,
          productId: "PRD",
          productName: item.productName,
          sku: item.variantLabel,
          type: "damage",
          quantity: -item.quantity,
          reference: returnNumber,
          user: params.staffName,
          reason: `Damaged item written off from return (${params.reason})`,
          timestamp: now.toLocaleString("en-IN"),
        });
      }
    });

    const record: ReturnRecord = {
      id: returnNumber,
      returnNumber,
      orderNumber: params.orderNumber,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      items: params.items,
      totalRefund: params.totalRefund,
      refundMethod: params.refundMethod,
      creditNoteNumber,
      reason: params.reason,
      createdAt: now.toLocaleString("en-IN"),
      processedBy: params.staffName,
    };

    state = {
      ...state,
      returns: [record, ...state.returns],
      movements: [...newMovements, ...state.movements],
    };
    notify();
    return record;
  },

  // ─── Phase 6B: Restringing ────────────────────────────────────────────
  createRestringJob: (job: Omit<RestringJob, "id" | "ticketNumber" | "createdAt" | "billedAtPOS">): RestringJob => {
    const ticketNumber = `RST-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newJob: RestringJob = {
      ...job,
      id: ticketNumber,
      ticketNumber,
      createdAt: new Date().toLocaleString("en-IN"),
      billedAtPOS: false,
    };

    state = {
      ...state,
      restringJobs: [newJob, ...state.restringJobs],
    };
    notify();
    return newJob;
  },

  updateRestringStatus: (id: string, newStatus: RestringStatus) => {
    state = {
      ...state,
      restringJobs: state.restringJobs.map((j) =>
        j.id === id || j.ticketNumber === id ? { ...j, status: newStatus } : j
      ),
    };
    notify();
  },

  addRestringToPOS: (jobId: string) => {
    const job = state.restringJobs.find((j) => j.id === jobId || j.ticketNumber === jobId);
    if (!job) return;

    const active = state.posSessions.find((s) => s.id === state.activePosSessionId);
    if (!active) return;

    const item: CartItem = {
      productId: "SRV-RESTRING",
      variantId: `VRST-${job.ticketNumber}`,
      quantity: 1,
      reservedAt: Date.now(),
      name: `Racket Restring Service (#${job.ticketNumber})`,
      brand: `${job.racketBrand} ${job.racketModel}`,
      unitPrice: job.price,
      mrp: job.price,
      variantLabel: `${job.stringType} (${job.tensionMain}/${job.tensionCross} lbs)`,
      stock: 999,
    };

    state = {
      ...state,
      restringJobs: state.restringJobs.map((j) =>
        j.id === job.id ? { ...j, billedAtPOS: true } : j
      ),
      posSessions: state.posSessions.map((s) =>
        s.id === state.activePosSessionId
          ? {
              ...s,
              customer: {
                isWalkIn: false,
                name: job.customerName,
                phone: job.customerPhone,
                memberId: job.memberId,
                tier: job.memberId ? "Gold" : "Guest",
              },
              items: [...s.items, item],
            }
          : s
      ),
    };
    notify();
  },
};

// ─── Custom Hook: useShopConsole() ──────────────────────────────────────
export function useShopConsole() {
  const store = useSyncExternalStore(subscribe, getSnapshot);

  // Computed: Active POS cart session
  const activeSession = useMemo(() => {
    return (
      store.posSessions.find((s) => s.id === store.activePosSessionId) ||
      store.posSessions[0]
    );
  }, [store.posSessions, store.activePosSessionId]);

  const posSubtotal = useMemo(() => {
    return activeSession.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
  }, [activeSession.items]);

  const posItemCount = useMemo(() => {
    return activeSession.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [activeSession.items]);

  const posTotals = useMemo(() => {
    const tier = activeSession.customer.tier;
    const discountRate = TIER_DISCOUNTS[tier].percent / 100;
    const discount = Math.round(posSubtotal * discountRate);
    const afterDiscount = posSubtotal - discount;
    const tax = Math.round(afterDiscount * 0.18);
    const total = afterDiscount + tax;
    return {
      subtotal: posSubtotal,
      discount,
      discountPercent: TIER_DISCOUNTS[tier].percent,
      discountLabel: TIER_DISCOUNTS[tier].label,
      afterDiscount,
      tax,
      total,
    };
  }, [posSubtotal, activeSession.customer.tier]);

  // Inventory Table Projection with On-Hand, Reserved, Available
  const inventoryList = useMemo<VariantStockInfo[]>(() => {
    const list: VariantStockInfo[] = [];
    SAMPLE_PRODUCTS.forEach((prod) => {
      prod.variants.forEach((v) => {
        const detail = getVariantStockDetail(v.id);
        const variantLabel =
          Object.entries(v.axes)
            .map(([, val]) => val)
            .join(" / ") || "Standard";

        list.push({
          variantId: v.id,
          productId: prod.id,
          productName: prod.name,
          brand: prod.brand,
          category: prod.category,
          sport: prod.sport,
          sku: v.sku,
          variantLabel,
          price: v.price,
          onHand: detail.onHand,
          reserved: detail.reserved,
          available: detail.available,
          reorderLevel: 3,
          suggestedReorderQty: 10,
          supplier: prod.brand === "Yonex" ? "Yonex Sunrise India" : `${prod.brand} India`,
          lastMovementDate: "2026-10-02",
        });
      });
    });
    return list;
  }, [store.movements]);

  // Low stock items: available <= reorderLevel
  const lowStockItems = useMemo(() => {
    return inventoryList.filter((item) => item.available <= item.reorderLevel);
  }, [inventoryList]);

  // Pending online orders count
  const pendingOrdersCount = useMemo(() => {
    return store.orders.filter(
      (o) => o.status === "PLACED" || o.status === "PACKED" || o.status === "READY_FOR_PICKUP"
    ).length;
  }, [store.orders]);

  return {
    ...store,
    activeSession,
    posSubtotal,
    posItemCount,
    posTotals,
    inventoryList,
    lowStockItems,
    lowStockCount: lowStockItems.length,
    pendingOrdersCount,

    // POS Methods
    switchPOSSession: shopStore.switchPOSSession,
    setPOSCustomer: shopStore.setPOSCustomer,
    posAddToCart: shopStore.posAddToCart,
    posUpdateQty: shopStore.posUpdateQty,
    posRemoveItem: shopStore.posRemoveItem,
    posClearCart: shopStore.posClearCart,
    chargePOSCart: shopStore.chargePOSCart,
    clearLastReceipt: shopStore.clearLastReceipt,

    // Orders Queue
    advanceOrderStatus: shopStore.advanceOrderStatus,
    verifyPickupCode: shopStore.verifyPickupCode,
    cancelOrder: shopStore.cancelOrder,

    // Inventory & Movements
    adjustStock: shopStore.adjustStock,
    getVariantStockDetail,

    // POs & Returns & Restring
    createPurchaseOrder: shopStore.createPurchaseOrder,
    receivePurchaseOrder: shopStore.receivePurchaseOrder,
    recordSupplierBill: shopStore.recordSupplierBill,
    processReturn: shopStore.processReturn,
    createRestringJob: shopStore.createRestringJob,
    updateRestringStatus: shopStore.updateRestringStatus,
    addRestringToPOS: shopStore.addRestringToPOS,
  };
}

// ─── Standard useShop() hook for Public Portal ───────────────────────────
export function useShop() {
  const store = useSyncExternalStore(subscribe, getSnapshot);

  const filteredProducts = useMemo(() => {
    let products = [...SAMPLE_PRODUCTS];

    if (store.categoryFilter !== "all") {
      products = products.filter((p) => p.category === store.categoryFilter);
    }

    if (store.sportFilter !== "all") {
      products = products.filter((p) => p.sport === store.sportFilter);
    }

    if (store.searchQuery.trim()) {
      const q = store.searchQuery.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    switch (store.sortBy) {
      case "price-asc":
        products.sort((a, b) => a.basePrice - b.basePrice);
        break;
      case "price-desc":
        products.sort((a, b) => b.basePrice - a.basePrice);
        break;
      case "newest":
        products.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case "name":
      default:
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return products;
  }, [store.categoryFilter, store.sportFilter, store.searchQuery, store.sortBy]);

  const cartSubtotal = useMemo(
    () => store.cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [store.cart]
  );

  const cartItemCount = useMemo(
    () => store.cart.reduce((sum, item) => sum + item.quantity, 0),
    [store.cart]
  );

  const getCartTotals = useCallback(
    (tier: MemberTier) => {
      const subtotal = cartSubtotal;
      const discount = Math.round(subtotal * (TIER_DISCOUNTS[tier].percent / 100));
      const afterDiscount = subtotal - discount;
      const tax = Math.round(afterDiscount * 0.18);
      const total = afterDiscount + tax;
      return {
        subtotal,
        discount,
        discountPercent: TIER_DISCOUNTS[tier].percent,
        discountLabel: TIER_DISCOUNTS[tier].label,
        afterDiscount,
        tax,
        total,
      };
    },
    [cartSubtotal]
  );

  return {
    ...store,
    products: SAMPLE_PRODUCTS,
    filteredProducts,
    cartSubtotal,
    cartItemCount,
    getCartTotals,
    setSearch: shopStore.setSearch,
    setCategory: shopStore.setCategory,
    setSport: shopStore.setSport,
    setSort: shopStore.setSort,
    addToCart: shopStore.addToCart,
    updateQuantity: shopStore.updateQuantity,
    removeFromCart: shopStore.removeFromCart,
    clearCart: shopStore.clearCart,
    pruneExpired: shopStore.pruneExpired,
    getVariantStock: shopStore.getVariantStock,
    getProductBySlug,
    getProductById,
    getProductsByCategory,
    getFeaturedProducts,
    getTotalStock,
  };
}
