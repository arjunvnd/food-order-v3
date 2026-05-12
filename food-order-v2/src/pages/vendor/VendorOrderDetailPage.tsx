import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import {
  fetchOrderById,
  updateOrderStatus,
} from "../../store/slices/ordersSlice";
import OrderStatusChip from "../../components/common/OrderStatusChip";
import { orderService } from "../../services/orderService";
import type { OrderStatus } from "../../types";

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  accepted: "preparing",
  preparing: "completed",
};

export default function VendorOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentOrder, isLoading, error } = useAppSelector((s) => s.orders);

  useEffect(() => {
    if (orderId) dispatch(fetchOrderById(orderId));
  }, [orderId, dispatch]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!orderId) return;
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      dispatch(updateOrderStatus({ orderId, status: newStatus }));
    } catch {
      /* show toast in production */
    }
  };

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

  const nextStatus = NEXT_STATUS[currentOrder.status];

  return (
    <Box maxWidth={600} mx="auto">
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/vendor/orders")}
        sx={{ mb: 2 }}
      >
        Back to Orders
      </Button>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" fontWeight={700}>
          Order #{currentOrder.id.slice(0, 8).toUpperCase()}
        </Typography>
        <OrderStatusChip status={currentOrder.status} />
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Guest
        </Typography>
        <Typography fontWeight={600}>{currentOrder.guestName}</Typography>
        <Typography variant="body2" color="text.secondary">
          {currentOrder.guestPhone}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Table {currentOrder.tableNumber}
        </Typography>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Items
        </Typography>
        <Stack spacing={0.5}>
          {currentOrder.items.map((item, i) => (
            <Box key={i} display="flex" justifyContent="space-between">
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

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="caption" color="text.secondary">
          Placed: {new Date(currentOrder.createdAt).toLocaleString()}
        </Typography>
      </Paper>

      {/* Status actions */}
      {currentOrder.status === "paid" && (
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="success"
            fullWidth
            onClick={() => handleStatusChange("accepted")}
          >
            Accept Order
          </Button>
          <Button
            variant="outlined"
            color="error"
            fullWidth
            onClick={() => handleStatusChange("rejected")}
          >
            Reject Order
          </Button>
        </Stack>
      )}

      {nextStatus && (
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={() => handleStatusChange(nextStatus)}
        >
          Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
        </Button>
      )}
    </Box>
  );
}
