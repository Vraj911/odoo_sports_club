// ── Pro Shop domain types ──

export type ProductCategory =
  | "rackets"
  | "balls"
  | "shoes"
  | "apparel"
  | "grips"
  | "strings"
  | "bags"
  | "accessories";

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  rackets: "Rackets",
  balls: "Balls & Shuttles",
  shoes: "Footwear",
  apparel: "Apparel",
  grips: "Grips & Overwraps",
  strings: "Strings",
  bags: "Bags",
  accessories: "Accessories",
};

export const CATEGORY_EMOJI: Record<ProductCategory, string> = {
  rackets: "🏸",
  balls: "🎾",
  shoes: "👟",
  apparel: "👕",
  grips: "🤝",
  strings: "🧵",
  bags: "🎒",
  accessories: "🏅",
};

export type Sport = "tennis" | "padel" | "badminton" | "cricket-net";

export interface VariantAxis {
  label: string; // e.g. "Size", "Color", "Grip Size"
  options: string[];
}

export interface ProductVariant {
  id: string;
  sku: string;
  axes: Record<string, string>; // e.g. { size: "10", color: "White" }
  stock: number;
  price: number; // variant-specific price (may differ from base)
  image?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: ProductCategory;
  sport: Sport;
  description: string;
  features: string[];
  basePrice: number;
  mrp: number; // Maximum Retail Price
  variantAxes: VariantAxis[];
  variants: ProductVariant[];
  images: string[];
  rating: number; // 1-5
  reviewCount: number;
  tags: string[];
  isNew?: boolean;
  isBestseller?: boolean;
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  reservedAt: number; // Unix ms — for countdown
  /** Snapshot of product/variant info for display */
  name: string;
  brand: string;
  image?: string;
  unitPrice: number;
  mrp: number;
  variantLabel: string; // e.g. "Size 10 / White"
  stock: number;
}

export type MemberTier = "Gold" | "Silver" | "Junior" | "Guest";

export const TIER_DISCOUNTS: Record<MemberTier, { percent: number; label: string }> = {
  Gold: { percent: 15, label: "Gold Member 15%" },
  Silver: { percent: 8, label: "Silver Member 8%" },
  Junior: { percent: 10, label: "Junior Member 10%" },
  Guest: { percent: 0, label: "No discount" },
};

export interface ShopOrder {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountLabel: string;
  tax: number;
  total: number;
  status: "PLACED" | "PACKED" | "READY_FOR_PICKUP" | "COLLECTED";
  date: string;
  pickupCode: string;
}

export const RESERVATION_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// ─── Phase 6B: Console & POS Domain Types ──────────────────────────────

export type PaymentMethod = "CASH" | "UPI" | "CARD" | "SPLIT";

export interface POSSplitItem {
  id: string;
  method: "CASH" | "UPI" | "CARD";
  amount: number;
  reference?: string;
}

export interface POSCustomer {
  isWalkIn: boolean;
  memberId?: string;
  name: string;
  phone?: string;
  email?: string;
  tier: MemberTier;
}

export interface POSCartSession {
  id: string;
  label: string; // "Cart 1", "Cart 2", "Cart 3"
  customer: POSCustomer;
  items: CartItem[];
  createdAt: number;
}

export interface POSReceipt {
  receiptNo: string;
  date: string;
  time: string;
  cashierName: string;
  customerName: string;
  customerPhone?: string;
  memberTier: MemberTier;
  items: {
    name: string;
    variantLabel: string;
    quantity: number;
    unitPrice: number;
    mrp: number;
    total: number;
  }[];
  subtotal: number;
  discountAmount: number;
  discountLabel: string;
  taxAmount: number;
  taxRatePercent: number;
  total: number;
  paymentMethod: PaymentMethod;
  tenderedCash?: number;
  changeDue?: number;
  splitDetails?: POSSplitItem[];
  upiRef?: string;
  cardRef?: string;
}

export type OrderStatus =
  | "PLACED"
  | "PACKED"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "COLLECTED"
  | "DELIVERED"
  | "CANCELLED";

export interface ConsoleOrderTimelineItem {
  status: string;
  timestamp: string;
  note: string;
}

export interface ConsoleOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  memberId?: string;
  memberTier: MemberTier;
  channel: "ONLINE" | "COUNTER";
  fulfillmentType: "PICKUP" | "DELIVERY";
  deliveryAddress?: string;
  slot?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountLabel?: string;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  pickupCode: string;
  createdAt: string;
  updatedAt: string;
  timeline: ConsoleOrderTimelineItem[];
}

export interface InventoryMovement {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  sku: string;
  type: "receipt" | "adjustment" | "damage" | "sale" | "return";
  quantity: number; // + for incoming, - for outgoing
  reference: string;
  user: string;
  reason?: string;
  timestamp: string;
}

export interface VariantStockInfo {
  variantId: string;
  productId: string;
  productName: string;
  brand: string;
  category: ProductCategory;
  sport: Sport;
  sku: string;
  variantLabel: string;
  price: number;
  onHand: number;
  reserved: number; // units reserved for pending online orders
  available: number; // onHand - reserved
  reorderLevel: number;
  suggestedReorderQty: number;
  supplier: string;
  lastMovementDate: string;
}

export interface PurchaseOrderItem {
  variantId: string;
  productId: string;
  productName: string;
  variantLabel: string;
  sku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  status: "DRAFT" | "SENT" | "RECEIVED";
  items: PurchaseOrderItem[];
  subtotal: number;
  gst: number;
  total: number;
  createdAt: string;
  expectedDate: string;
  receivedAt?: string;
  billRecorded?: boolean;
  notes?: string;
}

export interface ReturnItem {
  variantId: string;
  productName: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  condition: "RESTOCK" | "WRITE_OFF";
}

export interface ReturnRecord {
  id: string;
  returnNumber: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  items: ReturnItem[];
  totalRefund: number;
  refundMethod: "ORIGINAL_PAYMENT" | "CREDIT_NOTE" | "CASH";
  creditNoteNumber?: string;
  reason: string;
  createdAt: string;
  processedBy: string;
}

export type RestringStatus = "RECEIVED" | "IN_PROGRESS" | "READY" | "COLLECTED";

export interface RestringJob {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  memberId?: string;
  racketBrand: string;
  racketModel: string;
  stringType: string;
  tensionMain: number; // lbs
  tensionCross: number; // lbs
  dueTime: string;
  price: number;
  status: RestringStatus;
  notes?: string;
  createdAt: string;
  billedAtPOS: boolean;
}

