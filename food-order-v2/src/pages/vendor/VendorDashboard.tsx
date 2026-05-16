import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Stack,
  Snackbar,
  Paper,
} from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import RestaurantIcon from "@mui/icons-material/Restaurant";

// Single shared AudioContext — reusing avoids the autoplay policy error.
// Browsers require a user gesture before audio can play; we resume the
// suspended context on the first pointer interaction with the page.
let _audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  try {
    if (!_audioCtx) _audioCtx = new AudioContext();
    return _audioCtx;
  } catch {
    return null;
  }
}
// Warm up: resume the context on first user gesture so it's ready immediately
// when an order arrives (which may happen with no user action on the page).
if (typeof window !== "undefined") {
  const resume = () => {
    getAudioCtx()?.resume();
  };
  window.addEventListener("pointerdown", resume, { once: true });
  window.addEventListener("keydown", resume, { once: true });
}

/** Plays a two-tone ding once the AudioContext is allowed to run. */
function playBeep() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  // Resume in case it was suspended between gestures
  ctx
    .resume()
    .then(() => {
      try {
        const gain = ctx.createGain();
        gain.connect(ctx.destination);

        [
          [880, 0, 0.12],
          [1100, 0.14, 0.13],
        ].forEach(([freq, start, dur]) => {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.value = freq;
          osc.connect(gain);
          gain.gain.setValueAtTime(0.5, ctx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + start + dur,
          );
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + dur + 0.05);
        });
      } catch {
        // ignore
      }
    })
    .catch(() => {});
}
import { useAuth0 } from "@auth0/auth0-react";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import { fetchVendorOrders } from "../../store/slices/ordersSlice";
import { useWebSocket } from "../../hooks/useWebSocket";
import OrderStatusChip from "../../components/common/OrderStatusChip";
import { orderService } from "../../services/orderService";
import { updateOrderStatus } from "../../store/slices/ordersSlice";
import { addNotification } from "../../store/slices/notificationsSlice";
import type { Order } from "../../types";

interface Notification {
  id: string;
  shortId: string;
  guestName: string;
  time: Date;
}

export default function VendorDashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAuth0();
  const { vendorOrders, isLoading, error } = useAppSelector((s) => s.orders);

  const vendorId = useAppSelector((s) => s.auth.vendorId ?? "");

  const [paymentToast, setPaymentToast] = useState<string | null>(null);
  const [alertToast, setAlertToast] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handlePayment = useCallback((paidOrderId: string) => {
    const shortId = paidOrderId.slice(0, 8).toUpperCase();
    setPaymentToast(`Order #${shortId} has been paid — start preparing!`);
  }, []);

  const handleNewOrder = useCallback(
    (order: Order) => {
      const shortId = order.id.slice(0, 8).toUpperCase();
      setNotifications((prev) => [
        {
          id: order.id,
          shortId,
          guestName: order.guestName || "Guest",
          time: new Date(),
        },
        ...prev.slice(0, 9),
      ]);
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

  useEffect(() => {
    if (vendorId) dispatch(fetchVendorOrders({ vendorId, status: "PENDING" }));
  }, [vendorId, dispatch]);

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
    }, 3_000);
    return () => clearInterval(interval);
  }, [vendorOrders]);

  useWebSocket(
    { type: "vendor", vendorId },
    undefined,
    handlePayment,
    handleNewOrder,
  );

  const handleAccept = async (orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, "ACCEPTED");
      dispatch(updateOrderStatus({ orderId, status: "ACCEPTED" }));
    } catch {
      /* show toast in production */
    }
  };

  const handleReject = async (orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, "REJECTED");
      dispatch(updateOrderStatus({ orderId, status: "REJECTED" }));
    } catch {
      /* show toast in production */
    }
  };

  const incomingOrders = vendorOrders.filter((o) => o.status === "PENDING");

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back, {user?.name}
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate("/vendor/orders")}>
          View All Orders
        </Button>
      </Box>

      {/* Notifications panel — shows orders that arrived via WebSocket this session */}
      {notifications.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <NotificationsActiveIcon color="warning" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={700}>
                Recent Notifications
              </Typography>
            </Box>
            <Button size="small" onClick={() => setNotifications([])}>
              Clear
            </Button>
          </Box>
          <Stack spacing={0.5}>
            {notifications.map((n) => (
              <Box
                key={n.id}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="body2">
                  New order <strong>#{n.shortId}</strong> from {n.guestName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {n.time.toLocaleTimeString()}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      <Typography variant="h6" fontWeight={600} mb={2}>
        New Orders{" "}
        {incomingOrders.length > 0 && (
          <Chip label={incomingOrders.length} color="error" size="small" />
        )}
      </Typography>

      {isLoading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!isLoading && incomingOrders.length === 0 && (
        <Alert severity="info">
          No new orders right now. Orders will appear here in real-time.
        </Alert>
      )}

      <Grid container spacing={2}>
        {incomingOrders.map((order) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={order.id}>
            <Card elevation={3}>
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography fontWeight={700}>
                    #{order.id.slice(0, 8).toUpperCase()}
                  </Typography>
                  <OrderStatusChip status={order.status} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Table {order.tableNumber} — {order.guestName}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Stack spacing={0.25} mb={1}>
                  {order.items.map((item, i) => (
                    <Typography key={i} variant="body2">
                      {item.menuItemName} × {item.quantity}
                    </Typography>
                  ))}
                </Stack>
                <Typography fontWeight={700}>
                  Total: ${order.totalAmount.toFixed(2)}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  onClick={() => handleAccept(order.id)}
                >
                  Accept
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={() => handleReject(order.id)}
                >
                  Reject
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

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
    </Box>
  );
}
