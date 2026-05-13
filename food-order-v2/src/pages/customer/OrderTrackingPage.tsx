import { useEffect } from "react";
import { useParams } from "react-router";
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
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import { fetchOrderById } from "../../store/slices/ordersSlice";
import { useWebSocket } from "../../hooks/useWebSocket";
import OrderStatusChip from "../../components/common/OrderStatusChip";
import type { OrderStatus } from "../../types";

const STATUS_STEPS: OrderStatus[] = ["PENDING", "ACCEPTED", "COMPLETED"];

function getActiveStep(status: OrderStatus): number {
  if (status === "REJECTED") return -1;
  return STATUS_STEPS.indexOf(status);
}

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const dispatch = useAppDispatch();
  const { currentOrder, isLoading, error } = useAppSelector((s) => s.orders);

  useEffect(() => {
    if (orderId) dispatch(fetchOrderById(orderId));
  }, [orderId, dispatch]);

  // Subscribe to live status updates for this order
  useWebSocket({ type: "order", orderId: orderId ?? "" });

  if (isLoading) {
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

  const activeStep = getActiveStep(currentOrder.status);
  const isRejected = currentOrder.status === "REJECTED";

  return (
    <Box maxWidth={560} mx="auto">
      <Typography variant="h5" fontWeight={700} mb={1}>
        Order Tracking
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Order #{currentOrder.id.slice(0, 8).toUpperCase()}
      </Typography>

      {/* Status header */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, textAlign: "center" }}>
        <Typography variant="subtitle2" color="text.secondary" mb={1}>
          Current Status
        </Typography>
        <OrderStatusChip status={currentOrder.status} />
        {isRejected && (
          <Typography variant="body2" color="error" mt={1}>
            Your order was rejected. Please contact the restaurant.
          </Typography>
        )}
        {currentOrder.status === "COMPLETED" && (
          <Typography
            variant="body2"
            color="success.main"
            mt={1}
            fontWeight={600}
          >
            🎉 Your food is ready! Please collect it at the counter.
          </Typography>
        )}
      </Paper>

      {/* Stepper */}
      {!isRejected && (
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
          {STATUS_STEPS.map((s) => (
            <Step key={s}>
              <StepLabel>
                {s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()}
              </StepLabel>
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
        <Typography variant="body2" color="text.secondary" mb={2}>
          Table: {currentOrder.tableNumber}
        </Typography>
        <Stack spacing={0.5} mb={1}>
          {currentOrder.items.map((item, idx) => (
            <Box key={idx} display="flex" justifyContent="space-between">
              <Typography variant="body2">
                {item.menuItemName} × {item.quantity}
              </Typography>
              <Typography variant="body2">
                ${(item.price * item.quantity).toFixed(2)}
              </Typography>
            </Box>
          ))}
        </Stack>
        <Divider sx={{ my: 1 }} />
        <Box display="flex" justifyContent="space-between">
          <Typography fontWeight={700}>Total Paid</Typography>
          <Typography fontWeight={700}>
            ${currentOrder.totalAmount.toFixed(2)}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
