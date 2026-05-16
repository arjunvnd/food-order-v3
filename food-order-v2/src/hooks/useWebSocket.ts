import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAppDispatch } from "./useAppStore";
import { updateOrderStatus, addVendorOrder } from "../store/slices/ordersSlice";
import { WS_EVENTS } from "../utils/constants";
import type { Order, OrderStatus, PaymentStatus } from "../types";
import { normalizeOrder } from "../services/orderService";

type SubscriptionTarget =
  | { type: "order"; orderId: string }
  | { type: "vendor"; vendorId: string };

// Callbacks so callers (e.g. VendorDashboard) can react to real-time events
type OnPaymentCallback = (orderId: string) => void;
type OnNewOrderCallback = (order: Order) => void;

export function useWebSocket(
  target: SubscriptionTarget,
  token?: string,
  onPayment?: OnPaymentCallback,
  onNewOrder?: OnNewOrderCallback,
) {
  const dispatch = useAppDispatch();
  const socketRef = useRef<Socket | null>(null);

  const orderId = target.type === "order" ? target.orderId : "";
  const vendorId = target.type === "vendor" ? target.vendorId : "";

  useEffect(() => {
    // In production (same-origin Render deploy) VITE_WS_URL can be omitted —
    // socket.io-client will connect to the page's own origin automatically.
    const wsUrl =
      (import.meta.env.VITE_WS_URL as string | undefined) ??
      window.location.origin;
    // Don't connect if we don't have the target ID yet
    if (target.type === "order" && !orderId) return;
    if (target.type === "vendor" && !vendorId) return;

    const socketOptions =
      target.type === "vendor"
        ? { auth: { vendorId }, ...(token ? { query: { token } } : {}) }
        : {};

    const socket = io(wsUrl, socketOptions);
    socketRef.current = socket;

    socket.on("connect", () => {
      if (target.type === "order") {
        // Customer: join the specific order room
        socket.emit(WS_EVENTS.JOIN_ORDER, orderId);
      }
      // Vendor: server joins the vendor room via handshake auth — no emit needed
    });

    // Order status change (ACCEPTED, REJECTED, COMPLETED) or payment (PAID)
    socket.on(
      WS_EVENTS.ORDER_STATUS,
      (data: { orderId: string; status: OrderStatus | PaymentStatus }) => {
        dispatch(updateOrderStatus({ orderId: data.orderId, status: data.status }));
        if (data.status === "PAID" && onPayment) {
          onPayment(data.orderId);
        }
      },
    );

    // Vendor: new order arrived — normalize from Prisma raw shape before use
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on(WS_EVENTS.NEW_ORDER, (rawOrder: any) => {
      const order = normalizeOrder(rawOrder);
      dispatch(addVendorOrder(order));
      if (onNewOrder) onNewOrder(order);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [target.type, orderId, vendorId, token, dispatch, onPayment, onNewOrder]);
}
