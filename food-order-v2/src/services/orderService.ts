import api from "./api";
import type { Order, OrderStatus, OrderType, PaymentStatus, CartItem } from "../types";

// ─── Backend raw shapes ───────────────────────────────────────────────────────
// The Prisma response nests vendor/table/menuItem objects and uses `unitPrice`.
// normalizeOrder flattens these into the frontend Order type.

interface RawOrderItem {
  menuItemId: string;
  quantity: number;
  unitPrice: number; // coerced from Decimal by axios interceptor
  menuItem: { name: string };
}

interface RawOrder {
  id: string;
  guestName: string | null;
  guestPhone: string | null;
  vendorId: string;
  vendor: { restaurantName: string };
  mallId: string | null;
  tableId: string | null;
  table: { tableNumber: string } | null;
  orderType: OrderType;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  items: RawOrderItem[];
}

export function normalizeOrder(raw: RawOrder): Order {
  return {
    id: raw.id,
    guestName: raw.guestName ?? "",
    guestPhone: raw.guestPhone ?? "",
    vendorId: raw.vendorId,
    vendorName: raw.vendor?.restaurantName ?? "",
    mallId: raw.mallId ?? null,
    tableId: raw.tableId ?? null,
    tableNumber: raw.table?.tableNumber ?? null,
    orderType: raw.orderType,
    totalAmount: raw.totalAmount,
    status: raw.status,
    paymentStatus: raw.paymentStatus ?? "UNPAID",
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    items: (raw.items ?? []).map((item) => ({
      menuItemId: item.menuItemId,
      menuItemName: item.menuItem?.name ?? "",
      price: item.unitPrice,
      quantity: item.quantity,
    })),
  };
}

interface PlaceOrderPayload {
  guestName: string;
  guestPhone: string;
  vendorId: string;
  mallId?: string | null;
  tableId?: string | null;
  orderType: OrderType;
  items: Array<{ menuItemId: string; quantity: number }>;
}

export const orderService = {
  // Guest: place order
  async placeOrder(payload: PlaceOrderPayload): Promise<Order> {
    const res = await api.post<RawOrder>("/orders", payload);
    return normalizeOrder(res.data);
  },

  // Guest: pay with dummy code — backend reads body field named "code"
  async payOrder(orderId: string, paymentCode: string): Promise<Order> {
    const res = await api.post<RawOrder>(`/orders/${orderId}/pay`, {
      code: paymentCode,
    });
    return normalizeOrder(res.data);
  },

  // Guest / Vendor: get order by id
  async getOrderById(orderId: string): Promise<Order> {
    const res = await api.get<RawOrder>(`/orders/${orderId}`);
    return normalizeOrder(res.data);
  },

  // Vendor: get all their orders, with optional status filter
  async getVendorOrders(
    _vendorId: string,
    status?: OrderStatus,
  ): Promise<Order[]> {
    // Vendor-authenticated: backend derives vendor identity from JWT
    const params = status ? { status } : {};
    const res = await api.get<RawOrder[]>(`/vendor/orders`, { params });
    return res.data.map(normalizeOrder);
  },

  // Vendor: update order status — routes to the correct dedicated endpoint
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<Order> {
    const actionMap: Partial<Record<OrderStatus, string>> = {
      ACCEPTED: "accept",
      REJECTED: "reject",
      COMPLETED: "complete",
    };
    const action = actionMap[status];
    if (!action) throw new Error(`Cannot transition to status ${status}`);
    const res = await api.patch<RawOrder>(`/vendor/orders/${orderId}/${action}`);
    return normalizeOrder(res.data);
  },

  // Helper to build order items from cart
  buildOrderItems(cartItems: CartItem[]) {
    return cartItems.map((i) => ({
      menuItemId: i.menuItem.id,
      quantity: i.quantity,
    }));
  },
};
