import { useEffect, useRef } from "react";
import { useAppDispatch } from "./useAppStore";
import { updateOrderStatus, addVendorOrder } from "../store/slices/ordersSlice";
import { WS_EVENTS } from "../utils/constants";
import type { Order, OrderStatus } from "../types";

type SubscriptionTarget =
  | { type: "order"; orderId: string }
  | { type: "vendor"; vendorId: string };

interface WsMessage {
  event: string;
  data: unknown;
}

export function useWebSocket(target: SubscriptionTarget, token?: string) {
  const dispatch = useAppDispatch();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL as string;
    if (!wsUrl) return;

    let active = true;

    function connect() {
      if (!active) return;

      const url = token ? `${wsUrl}?token=${encodeURIComponent(token)}` : wsUrl;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        const subscribeEvent =
          target.type === "order"
            ? {
                event: WS_EVENTS.SUBSCRIBE_ORDER,
                data: { orderId: target.orderId },
              }
            : {
                event: WS_EVENTS.SUBSCRIBE_VENDOR,
                data: { vendorId: target.vendorId },
              };
        ws.send(JSON.stringify(subscribeEvent));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as WsMessage;

          if (msg.event === WS_EVENTS.ORDER_STATUS_UPDATED) {
            const { orderId, status } = msg.data as {
              orderId: string;
              status: OrderStatus;
            };
            dispatch(updateOrderStatus({ orderId, status }));
          }

          if (msg.event === WS_EVENTS.NEW_ORDER) {
            dispatch(addVendorOrder(msg.data as Order));
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (active) {
          reconnectTimeout.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      active = false;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [
    target.type,
    "orderId" in target ? target.orderId : "",
    "vendorId" in target ? target.vendorId : "",
    token,
    dispatch,
  ]);
}
