import { useEffect, useState } from "react";
import { useNavigate, useMatch } from "react-router";
import { Alert, Button, Typography } from "@mui/material";
import { getActiveOrder, clearActiveOrder } from "../../utils/activeOrder";
import { orderService } from "../../services/orderService";

/**
 * Shows a persistent banner on all customer pages when the user has an active order.
 * Fetches the current order status on mount to confirm it's still in-progress.
 * Auto-clears localStorage when the order reaches a terminal state.
 * Hidden on the tracking/payment pages — those already display full order status.
 */
export default function ActiveOrderBanner() {
  const navigate = useNavigate();
  const stored = getActiveOrder();

  // orderId from localStorage; isActive confirmed by an API check
  const [orderId, setOrderId] = useState<string | null>(stored?.orderId ?? null);
  const [isActive, setIsActive] = useState(false);

  // All useMatch calls must be unconditional (rules of hooks)
  const onTrackingPage = useMatch("/orders/:orderId");
  const onPaymentPage = useMatch("/orders/:orderId/pay");
  const onCartPage = useMatch("/cart");
  const onCheckoutPage = useMatch("/checkout");
  const onCartOrCheckout = onCartPage ?? onCheckoutPage;

  useEffect(() => {
    if (!orderId) return;

    orderService
      .getOrderById(orderId)
      .then((order) => {
        if (order.status === "COMPLETED" || order.status === "REJECTED") {
          clearActiveOrder();
          setOrderId(null);
          setIsActive(false);
        } else {
          setIsActive(true);
        }
      })
      .catch(() => {
        // Can't validate — don't show stale banner
        setIsActive(false);
      });
  }, [orderId]);

  // Derive visibility: only show if confirmed active and not already on order pages
  const show = isActive && Boolean(orderId) && !onTrackingPage && !onPaymentPage;

  if (!show || !orderId) return null;

  return (
    <Alert
      severity="warning"
      sx={{ borderRadius: 0, "& .MuiAlert-message": { flex: 1 } }}
      action={
        <Button
          color="inherit"
          size="small"
          variant="outlined"
          onClick={() => navigate(`/orders/${orderId}`)}
          sx={{ whiteSpace: "nowrap" }}
        >
          Track Order
        </Button>
      }
    >
      <Typography variant="body2" component="span">
        {onCartOrCheckout
          ? "You have an active order. Placing a new order will not cancel it."
          : "You have an active order."}
      </Typography>
    </Alert>
  );
}
