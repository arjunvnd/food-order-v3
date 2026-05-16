import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Button,
  Snackbar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CelebrationIcon from "@mui/icons-material/Celebration";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import { fetchOrderById } from "../../store/slices/ordersSlice";
import { useWebSocket } from "../../hooks/useWebSocket";
import OrderStatusChip from "../../components/common/OrderStatusChip";
import { clearActiveOrder } from "../../utils/activeOrder";
import { addNotification } from "../../store/slices/notificationsSlice";
import type { Order } from "../../types";

// 4-step flow: the stepper shows cumulative progress including payment
const STEPS = ["Pending", "Accepted", "Paid", "Ready"];

function getActiveStep(status: string, paymentStatus: string): number {
  if (status === "PENDING") return 0;
  if (status === "ACCEPTED" && paymentStatus !== "PAID") return 1;
  if (status === "ACCEPTED" && paymentStatus === "PAID") return 2;
  if (status === "COMPLETED") return 3;
  return 0;
}

function getMenuUrl(order: Order): string | null {
  const { vendorId, mallId, tableId, orderType } = order;
  if (orderType === "TAKEAWAY") return `/restaurant/${vendorId}/takeaway`;
  if (mallId && tableId) return `/mall/${mallId}/table/${tableId}/restaurant/${vendorId}`;
  if (tableId) return `/restaurant/${vendorId}/table/${tableId}`;
  return null;
}

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentOrder, isLoading, error } = useAppSelector((s) => s.orders);

  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: "success" | "info" | "warning" | "error" }>({
    open: false,
    message: "",
    severity: "info",
  });
  const prevStatusRef = useRef<string | null>(null);
  const prevPaymentRef = useRef<string | null>(null);

  useEffect(() => {
    if (orderId) dispatch(fetchOrderById(orderId));
  }, [orderId, dispatch]);

  // Show snackbar + global notification when order status changes via WebSocket
  useEffect(() => {
    if (!currentOrder) return;
    const prevStatus = prevStatusRef.current;
    const prevPayment = prevPaymentRef.current;
    const { status, paymentStatus } = currentOrder;

    if (prevStatus !== null && (prevStatus !== status || prevPayment !== paymentStatus)) {
      let message = "";
      let severity: "success" | "error" = "success";

      if (status === "ACCEPTED" && paymentStatus !== "PAID") {
        message = "Your order has been accepted! Please proceed to payment.";
      } else if (status === "ACCEPTED" && paymentStatus === "PAID") {
        message = "Payment confirmed! Your order is being prepared.";
      } else if (status === "COMPLETED") {
        message = "Your order is ready for pickup!";
      } else if (status === "REJECTED") {
        message = "Your order was rejected. Please contact the restaurant.";
        severity = "error";
      }

      if (message) {
        setSnack({ open: true, message, severity });
        dispatch(
          addNotification({
            message,
            severity,
            link: `/orders/${currentOrder.id}`,
          }),
        );
      }
    }

    prevStatusRef.current = status;
    prevPaymentRef.current = paymentStatus;
  }, [currentOrder?.status, currentOrder?.paymentStatus]);

  // Clear localStorage when order reaches a terminal state
  useEffect(() => {
    if (
      currentOrder?.status === "COMPLETED" ||
      currentOrder?.status === "REJECTED"
    ) {
      clearActiveOrder();
    }
  }, [currentOrder]);

  // Subscribe to live status/payment updates for this order
  useWebSocket({ type: "order", orderId: orderId ?? "" });

  if (isLoading && !currentOrder) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !currentOrder) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error ?? "Order not found."}
      </Alert>
    );
  }

  const { status, paymentStatus } = currentOrder;
  const isRejected = status === "REJECTED";
  const activeStep = getActiveStep(status, paymentStatus);
  const menuUrl = getMenuUrl(currentOrder);

  return (
    <Box maxWidth={560} mx="auto">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h5" fontWeight={700}>
          Order Tracking
        </Typography>
        {menuUrl && (
          <Button
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            size="small"
            onClick={() => navigate(menuUrl)}
          >
            Back to Menu
          </Button>
        )}
      </Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Order #{currentOrder.id.slice(0, 8).toUpperCase()}
      </Typography>

      {/* Phase-based status panel */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3, textAlign: "center" }}>
        {status === "PENDING" && (
          <>
            <CircularProgress size={36} sx={{ mb: 1.5 }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Waiting for the restaurantâ€¦
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Your order has been placed. The restaurant will accept it shortly.
            </Typography>
          </>
        )}

        {status === "ACCEPTED" && paymentStatus !== "PAID" && (
          <>
            <CheckCircleOutlineIcon
              color="success"
              sx={{ fontSize: 40, mb: 1 }}
            />
            <Typography variant="subtitle1" fontWeight={600} color="success.main">
              Order accepted!
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5} mb={2}>
              The restaurant has accepted your order. Please proceed to payment.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate(`/orders/${currentOrder.id}/pay`)}
            >
              Pay Now â†’
            </Button>
          </>
        )}

        {status === "ACCEPTED" && paymentStatus === "PAID" && (
          <>
            <CircularProgress size={36} color="success" sx={{ mb: 1.5 }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Payment confirmed!
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Your order is being prepared. We'll let you know when it's ready.
            </Typography>
          </>
        )}

        {status === "COMPLETED" && (
          <>
            <CelebrationIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography
              variant="subtitle1"
              fontWeight={700}
              color="success.main"
            >
              Your order is ready!
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Please collect your order at the counter.
            </Typography>
          </>
        )}

        {isRejected && (
          <>
            <OrderStatusChip status="REJECTED" />
            <Typography variant="body2" color="error" mt={1.5}>
              Your order was rejected. Please contact the restaurant for
              assistance.
            </Typography>
          </>
        )}
      </Paper>

      {/* Progress stepper */}
      {!isRejected && (
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}

      {/* Order details */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={1}>
          Order Details
        </Typography>
        <Typography variant="body2" color="text.secondary">
          From: {currentOrder.vendorName}
        </Typography>
        {currentOrder.tableNumber && (
          <Typography variant="body2" color="text.secondary" mb={2}>
            Table: {currentOrder.tableNumber}
          </Typography>
        )}
        <Stack spacing={0.5} mb={1} mt={1}>
          {currentOrder.items.map((item, idx) => (
            <Box key={idx} display="flex" justifyContent="space-between">
              <Typography variant="body2">
                {item.menuItemName} Ã— {item.quantity}
              </Typography>
              <Typography variant="body2">
                ${(item.price * item.quantity).toFixed(2)}
              </Typography>
            </Box>
          ))}
        </Stack>
        <Divider sx={{ my: 1 }} />
        <Box display="flex" justifyContent="space-between">
          <Typography fontWeight={700}>
            {paymentStatus === "PAID" ? "Total Paid" : "Total"}
          </Typography>
          <Typography fontWeight={700}>
            ${currentOrder.totalAmount.toFixed(2)}
          </Typography>
        </Box>
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={6000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

