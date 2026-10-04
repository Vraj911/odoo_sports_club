import { apiClient } from "@/lib/axios";

export interface BackendVariantResponse {
  id: string; // UUID
  productId: string; // UUID
  productName: string;
  sku: string;
  variantName: string;
  attributes: string; // JSON string or raw text
  price: number;
  taxRate: number;
  onHand: number;
  reserved: number;
  availableStock: number;
  reorderLevel: number;
  isLowStock: boolean;
  active: boolean;
}

export interface BackendProductResponse {
  id: string; // UUID
  category: string;
  name: string;
  description: string;
  brand: string;
  taxRate: number;
  active: boolean;
  variants: BackendVariantResponse[];
  createdAt: string;
}

export interface BackendShopOrderLineResponse {
  id: string;
  productVariantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountAmount: number;
  lineTotal: number;
}

export interface BackendShopOrderResponse {
  id: string; // UUID
  orderNumber: string;
  memberId?: string;
  memberName?: string;
  guestName?: string;
  guestPhone?: string;
  fulfillmentMethod: string;
  deliveryAddress?: string;
  status: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  items: BackendShopOrderLineResponse[];
  createdAt: string;
}

export interface CreateShopOrderPayload {
  memberId?: string;
  guestName?: string;
  guestPhone?: string;
  fulfillmentMethod: "PICKUP" | "DELIVERY";
  deliveryAddress?: string;
  items: {
    productVariantId: string;
    quantity: number;
  }[];
}

export interface PosCheckoutPayload {
  memberId?: string;
  guestName?: string;
  guestPhone?: string;
  items: {
    productVariantId: string;
    quantity: number;
  }[];
  paymentMethod: string; // "CASH" | "CARD" | "UPI"
  tendered?: number;
}

export interface StockMovementPayload {
  productVariantId: string;
  movementType: "RECEIPT" | "SALE" | "RETURN" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "DAMAGE" | "RESERVATION" | "RESERVATION_RELEASE";
  quantity: number;
  sourceType: "SHOP_ORDER" | "RETURN" | "ADJUSTMENT" | "DAMAGE" | "OTHER";
  sourceId?: string;
  performedByUserId?: string;
  notes?: string;
}

export interface RestockSuggestionDto {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  onHand: number;
  reorderLevel: number;
  suggestedReorderQuantity: number;
}

export const shopApi = {
  listProducts: (category?: string) =>
    apiClient.get<BackendProductResponse[]>("/api/public/products", category ? { category } : undefined),

  getProduct: (id: string) =>
    apiClient.get<BackendProductResponse>(`/api/shop/products/${id}`),

  listQuickSale: () =>
    apiClient.get<BackendVariantResponse[]>("/api/shop/quick-sale"),

  getLowStock: () =>
    apiClient.get<BackendVariantResponse[]>("/api/shop/inventory/low-stock"),

  getRestockSuggestions: () =>
    apiClient.get<RestockSuggestionDto[]>("/api/shop/inventory/restock-suggestions"),

  createOrder: (payload: CreateShopOrderPayload) =>
    apiClient.post<BackendShopOrderResponse>("/api/shop/orders", payload),

  posCheckout: (payload: PosCheckoutPayload) =>
    apiClient.post<BackendShopOrderResponse>("/api/shop/pos/checkout", payload),

  listOrders: (memberId?: string) =>
    apiClient.get<BackendShopOrderResponse[]>("/api/shop/orders", memberId ? { memberId } : undefined),

  getOrder: (id: string) =>
    apiClient.get<BackendShopOrderResponse>(`/api/shop/orders/${id}`),

  updateOrderStatus: (id: string, status: string, notes?: string) =>
    apiClient.patch<BackendShopOrderResponse>(`/api/shop/orders/${id}/status`, { status, notes }),

  cancelOrder: (id: string, reason?: string) =>
    apiClient.post<BackendShopOrderResponse>(`/api/shop/orders/${id}/cancel`, { reason }),

  recordStockMovement: (payload: StockMovementPayload) =>
    apiClient.post<Record<string, unknown>>("/api/shop/inventory/movement", payload),
};
