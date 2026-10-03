import { apiClient } from "@/lib/axios";

export interface ProductVariantDto {
  id: string;
  sku: string;
  barcode?: string;
  axes: Record<string, string>;
  price: number;
  stock: number;
  reservedStock?: number;
  isQuickSale?: boolean;
}

export interface ProductDto {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  sport: string;
  description?: string;
  basePrice: number;
  mrp: number;
  images: string[];
  variants: ProductVariantDto[];
}

export interface PosCheckoutItemRequest {
  variantId: string;
  quantity: number;
  unitPrice: number;
}

export interface PosCheckoutRequest {
  memberId?: string;
  customerName?: string;
  customerPhone?: string;
  items: PosCheckoutItemRequest[];
  paymentMethod: "CASH" | "CARD" | "UPI" | "SPLIT";
  tenderedCash?: number;
  splitDetails?: { method: string; amount: number }[];
  cashShiftId?: string;
}

export interface PosCheckoutResponse {
  orderId: string;
  orderNumber: string;
  total: number;
  paymentId: string;
  receiptNo: string;
  changeDue?: number;
}

export const shopApi = {
  listProducts: (category?: string) =>
    apiClient.get<ProductDto[]>("/api/public/products", category ? { category } : undefined),

  getProduct: (id: string) =>
    apiClient.get<ProductDto>(`/api/shop/products/${id}`),

  listQuickSale: () =>
    apiClient.get<ProductVariantDto[]>("/api/shop/quick-sale"),

  posCheckout: (data: PosCheckoutRequest) =>
    apiClient.post<PosCheckoutResponse>("/api/shop/pos/checkout", data),

  cancelOrder: (id: string, reason: string) =>
    apiClient.post<{ orderId: string; status: string }>(`/api/shop/orders/${id}/cancel`, { reason }),

  getRestockSuggestions: () =>
    apiClient.get<Record<string, unknown>[]>("/api/shop/inventory/restock-suggestions"),

  adjustInventory: (variantId: string, quantityDelta: number, reason: string) =>
    apiClient.post<{ variantId: string; newStock: number }>("/api/shop/inventory/adjust", {
      variantId,
      quantityDelta,
      reason,
    }),
};
