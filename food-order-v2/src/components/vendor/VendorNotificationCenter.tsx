import { useEffect, useState, useCallback } from "react";
import { Snackbar, Alert } from "@mui/material";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import { useWebSocket } from "../../hooks/useWebSocket";
import { addNotification } from "../../store/slices/notificationsSlice";
import { playBeep } from "../../utils/notificationSound";
import type { Order } from "../../types";

/**
 * Mounted once at the vendor layout level (not per-page) so the socket
 * connection, bell notifications, sound and toasts survive navigation
 * across all /vendor/* pages instead of only working on the Dashboard.
 */
export default function VendorNotificationCenter() {
  const dispatch = useAppDispatch();
  const vendorId = useAppSelector((s) => s.auth.vendorId ?? "");
  const vendorOrders = useAppSelector((s) => s.orders.vendorOrders);

  const [paymentToast, setPaymentToast] = useState<string | null>(null);
  const [alertToast, setAlertToast] = useState<string | null>(null);

  const handlePayment = useCallback(
    (paidOrderId: string) => {
      const shortId = paidOrderId.slice(0, 8).toUpperCase();
      setPaymentToast(`Order #${shortId} has been paid — start preparing!`);
      dispatch(
        addNotification({
          message: `Order #${shortId} has been paid`,
          severity: "success",
          link: "/vendor/orders",
        }),
      );
    },
    [dispatch],
  );

  const handleNewOrder = useCallback(
    (order: Order) => {
      const shortId = order.id.slice(0, 8).toUpperCase();
      setAlertToast(
        `New order #${shortId} from ${order.guestName || "Guest"}!`,
      );
      playBeep();
      dispatch(
        addNotification({
          message: `New order #${shortId} from ${order.guestName || "Guest"}`,
          severity: "info",
          link: "/vendor/orders",
        }),
      );
    },
    [dispatch],
  );

  useWebSocket(
    { type: "vendor", vendorId },
    undefined,
    handlePayment,
    handleNewOrder,
  );

  // Re-alert every 30 s if there are still pending orders waiting for a decision
  useEffect(() => {
    const interval = setInterval(() => {
      const pendingCount = vendorOrders.filter(
        (o) => o.status === "PENDING",
      ).length;
      if (pendingCount > 0) {
        setAlertToast(
          `${pendingCount} pending order${pendingCount > 1 ? "s" : ""} still waiting!`,
        );
        playBeep();
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [vendorOrders]);

  return (
    <>
      {/* Payment notification — bottom-right */}
      <Snackbar
        open={Boolean(paymentToast)}
        autoHideDuration={6000}
        onClose={() => setPaymentToast(null)}
        message={paymentToast}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      />

      {/* New order / periodic reminder — bottom-right, large + loud */}
      <Snackbar
        open={Boolean(alertToast)}
        autoHideDuration={8000}
        onClose={() => setAlertToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        sx={{ mb: 8 }} // sit above the payment toast
      >
        <Alert
          onClose={() => setAlertToast(null)}
          severity="warning"
          variant="filled"
          icon={<RestaurantIcon fontSize="large" />}
          sx={{
            fontSize: "1.05rem",
            fontWeight: 700,
            py: 2,
            px: 3,
            minWidth: 320,
            boxShadow: 6,
            "& .MuiAlert-icon": { fontSize: 32, alignItems: "center" },
          }}
        >
          {alertToast}
        </Alert>
      </Snackbar>
    </>
  );
}
