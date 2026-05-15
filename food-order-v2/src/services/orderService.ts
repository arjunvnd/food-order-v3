import api from "./api";
import type { Order, OrderStatus, OrderType, CartItem } from "../types";

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
    const res = await api.post<Order>("/orders", payload);
    return res.data;
  },

  // Guest: pay with dummy code — backend reads body field named "code"
  async payOrder(orderId: string, paymentCode: string): Promise<Order> {
    const res = await api.post<Order>(`/orders/${orderId}/pay`, {
      code: paymentCode,
    });
    return res.data;
  },

  // Guest / Vendor: get order by id
  async getOrderById(orderId: string): Promise<Order> {
    const res = await api.get<Order>(`/orders/${orderId}`);
    return res.data;
  },

  // Vendor: get all their orders, with optional status filter
  async getVendorOrders(
    _vendorId: string,
    status?: OrderStatus,
  ): Promise<Order[]> {
    // Vendor-authenticated: backend derives vendor identity from JWT
    const params = status ? { status } : {};
    const res = await api.get<Order[]>(`/vendor/orders`, { params });
    return res.data;
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
    const res = await api.patch<Order>(`/vendor/orders/${orderId}/${action}`);
    return res.data;
  },

  // Helper to build order items from cart
  buildOrderItems(cartItems: CartItem[]) {
    return cartItems.map((i) => ({
      menuItemId: i.menuItem.id,
      quantity: i.quantity,
    }));
  },
};
