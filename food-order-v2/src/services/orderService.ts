import api from "./api";
import type { Order, OrderStatus, GuestInfo, CartItem } from "../types";

interface PlaceOrderPayload {
  guestInfo: GuestInfo;
  vendorId: string;
  mallId: string;
  tableId: string;
  items: Array<{ menuItemId: string; quantity: number }>;
}

export const orderService = {
  // Guest: place order
  async placeOrder(payload: PlaceOrderPayload): Promise<Order> {
    const res = await api.post<Order>("/orders", payload);
    return res.data;
  },

  // Guest: pay with dummy code
  async payOrder(orderId: string, paymentCode: string): Promise<Order> {
    const res = await api.post<Order>(`/orders/${orderId}/pay`, {
      paymentCode,
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
    vendorId: string,
    status?: OrderStatus,
  ): Promise<Order[]> {
    const params = status ? { status } : {};
    const res = await api.get<Order[]>(`/vendors/${vendorId}/orders`, {
      params,
    });
    return res.data;
  },

  // Vendor: update order status
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<Order> {
    const res = await api.patch<Order>(`/orders/${orderId}/status`, { status });
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
