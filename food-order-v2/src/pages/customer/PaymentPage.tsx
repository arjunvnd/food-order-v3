import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  Paper,
  CircularProgress,
  Stack,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import { fetchOrderById } from "../../store/slices/ordersSlice";
import { orderService } from "../../services/orderService";

export default function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentOrder, isLoading } = useAppSelector((s) => s.orders);

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) dispatch(fetchOrderById(orderId));
  }, [orderId, dispatch]);

  // Guard: redirect away if order is not in a payable state
  useEffect(() => {
    if (!currentOrder) return;
    if (
      currentOrder.status !== "ACCEPTED" ||
      currentOrder.paymentStatus === "PAID"
    ) {
      navigate(`/orders/${currentOrder.id}`, { replace: true });
    }
  }, [currentOrder, navigate]);

  const handlePay = async () => {
    if (!code.trim()) {
      setError("Please enter a payment code.");
      return;
    }
    if (!orderId) return;

    setSubmitting(true);
    setError(null);

    try {
      await orderService.payOrder(orderId, code.trim());
      navigate(`/orders/${orderId}`, { replace: true });
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Payment failed. Please check your code and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading && !currentOrder) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentOrder) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        Order not found.
      </Alert>
    );
  }

  return (
    <Box maxWidth={480} mx="auto">
      <Typography variant="h5" fontWeight={700} mb={1}>
        Payment
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Order #{currentOrder.id.slice(0, 8).toUpperCase()}
      </Typography>

      {/* Order summary */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" mb={1}>
          From: {currentOrder.vendorName}
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
          <Typography fontWeight={700}>Total</Typography>
          <Typography fontWeight={700}>
            ${currentOrder.totalAmount.toFixed(2)}
          </Typography>
        </Box>
      </Paper>

      {/* Payment code input */}
      <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
        Enter Payment Code
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Enter the payment code to confirm your payment.
      </Typography>
      <TextField
        label="Payment Code"
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
          setError(null);
        }}
        fullWidth
        inputProps={{ inputMode: "numeric" }}
        sx={{ mb: 2 }}
        onKeyDown={(e) => e.key === "Enter" && handlePay()}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={handlePay}
        disabled={submitting}
        startIcon={
          submitting ? <CircularProgress size={18} color="inherit" /> : undefined
        }
      >
        {submitting ? "Processing…" : "Confirm Payment"}
      </Button>

      <Button
        fullWidth
        sx={{ mt: 1 }}
        onClick={() => navigate(`/orders/${orderId}`)}
        disabled={submitting}
      >
        Back to Order
      </Button>
    </Box>
  );
}
