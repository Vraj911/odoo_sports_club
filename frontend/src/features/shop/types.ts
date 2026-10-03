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
