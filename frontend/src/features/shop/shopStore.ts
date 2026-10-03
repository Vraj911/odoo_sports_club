import { useSyncExternalStore, useCallback, useMemo } from "react";
import type {
  CartItem,
  MemberTier,
  Product,
  ProductCategory,
  ProductVariant,
  RESERVATION_DURATION_MS,
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

// ─── Mutable inventory state (mutated by cart operations) ───────────────
const inventoryOverrides = new Map<string, number>(); // variantId → stock override

function getEffectiveStock(variantId: string, originalStock: number): number {
  return inventoryOverrides.has(variantId)
    ? inventoryOverrides.get(variantId)!
    : originalStock;
}

// ─── Cart Store ─────────────────────────────────────────────────────────

interface ShopStoreState {
  cart: CartItem[];
  searchQuery: string;
  categoryFilter: ProductCategory | "all";
  sportFilter: string;
  sortBy: "name" | "price-asc" | "price-desc" | "newest";
}

const RESERVATION_MS = 10 * 60 * 1000; // 10 minutes

let state: ShopStoreState = {
  cart: [],
  searchQuery: "",
  categoryFilter: "all",
  sportFilter: "all",
  sortBy: "name",
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

export const shopStore = {
  getState: () => state,

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

  setSort: (sort: ShopStoreState["sortBy"]) => {
    state = { ...state, sortBy: sort };
    notify();
  },

  addToCart: (product: Product, variant: ProductVariant, qty: number = 1): boolean => {
    const effectiveStock = getEffectiveStock(variant.id, variant.stock);
    const existing = state.cart.find((c) => c.variantId === variant.id);
    const currentQty = existing ? existing.quantity : 0;
    if (currentQty + qty > effectiveStock) return false; // can't exceed stock

    // Reserve stock
    const newStock = effectiveStock - qty;
    inventoryOverrides.set(variant.id, newStock);

    const variantLabel = Object.entries(variant.axes)
      .map(([, v]) => v)
      .join(" / ");

    if (existing) {
      state = {
        ...state,
        cart: state.cart.map((c) =>
          c.variantId === variant.id
            ? { ...c, quantity: c.quantity + qty, stock: newStock }
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
        stock: newStock,
      };
      state = { ...state, cart: [...state.cart, item] };
    }
    notify();
    return true;
  },

  updateQuantity: (variantId: string, newQty: number) => {
    const item = state.cart.find((c) => c.variantId === variantId);
    if (!item) return;

    // Find original stock
    let originalStock = 0;
    for (const prod of SAMPLE_PRODUCTS) {
      const v = prod.variants.find((vr) => vr.id === variantId);
      if (v) { originalStock = v.stock; break; }
    }

    const otherReserved = originalStock - item.stock - item.quantity;
    // item.stock is current free stock. To change qty, recalculate.
    const freeStock = originalStock - (otherReserved < 0 ? 0 : otherReserved);
    if (newQty > freeStock) return;

    if (newQty <= 0) {
      shopStore.removeFromCart(variantId);
      return;
    }

    // Update
    const newFreeStock = freeStock - newQty;
    inventoryOverrides.set(variantId, newFreeStock);
    state = {
      ...state,
      cart: state.cart.map((c) =>
        c.variantId === variantId
          ? { ...c, quantity: newQty, stock: newFreeStock }
          : c
      ),
    };
    notify();
  },

  removeFromCart: (variantId: string) => {
    const item = state.cart.find((c) => c.variantId === variantId);
    if (!item) return;

    // Restore stock
    const currentFreeStock = getEffectiveStock(variantId, 0);
    inventoryOverrides.set(variantId, currentFreeStock + item.quantity);

    state = {
      ...state,
      cart: state.cart.filter((c) => c.variantId !== variantId),
    };
    notify();
  },

  clearCart: () => {
    // Restore all stock
    for (const item of state.cart) {
      const currentFreeStock = getEffectiveStock(item.variantId, 0);
      inventoryOverrides.set(item.variantId, currentFreeStock + item.quantity);
    }
    state = { ...state, cart: [] };
    notify();
  },

  /** Prune expired reservations (called by a timer) */
  pruneExpired: () => {
    const now = Date.now();
    const expired = state.cart.filter((c) => now - c.reservedAt > RESERVATION_MS);
    if (expired.length === 0) return;

    for (const item of expired) {
      const currentFreeStock = getEffectiveStock(item.variantId, 0);
      inventoryOverrides.set(item.variantId, currentFreeStock + item.quantity);
    }

    state = {
      ...state,
      cart: state.cart.filter((c) => now - c.reservedAt <= RESERVATION_MS),
    };
    notify();
  },

  getVariantStock: (variantId: string, originalStock: number): number => {
    return getEffectiveStock(variantId, originalStock);
  },
};

// ─── Hook ───────────────────────────────────────────────────────────────

export function useShop() {
  const store = useSyncExternalStore(subscribe, getSnapshot);

  const filteredProducts = useMemo(() => {
    let products = [...SAMPLE_PRODUCTS];

    // Category filter
    if (store.categoryFilter !== "all") {
      products = products.filter((p) => p.category === store.categoryFilter);
    }

    // Sport filter
    if (store.sportFilter !== "all") {
      products = products.filter((p) => p.sport === store.sportFilter);
    }

    // Search
    if (store.searchQuery.trim()) {
      const q = store.searchQuery.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort
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
      const tax = Math.round(afterDiscount * 0.18); // 18% GST
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
    // Actions
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
    // Re-exports
    getProductBySlug,
    getProductById,
    getProductsByCategory,
    getFeaturedProducts,
    getTotalStock,
  };
}
