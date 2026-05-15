import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  Stack,
  Alert,
  Paper,
  CircularProgress,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import { clearCart, selectCartTotal } from "../../store/slices/cartSlice";
import { orderService } from "../../services/orderService";
import { PAYMENT_CODE } from "../../utils/constants";

export default function CheckoutPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, vendorId, vendorName, mallId, tableId, orderType } =
    useAppSelector((s) => s.cart);
  const total = selectCartTotal(items);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [payCode, setPayCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    phone?: string;
    payCode?: string;
  }>({});

  const validate = () => {
    const errs: typeof fieldErrors = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!phone.trim()) errs.phone = "Phone number is required";
    else if (!/^\+?[\d\s\-]{7,15}$/.test(phone.trim()))
      errs.phone = "Enter a valid phone number";
    if (!payCode) errs.payCode = "Payment code is required";
    else if (payCode !== PAYMENT_CODE) errs.payCode = "Invalid payment code";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!vendorId) {
      setError("Session expired. Please scan your QR code again.");
      return;
    }
    if (orderType === "DINE_IN" && !tableId) {
      setError("Session expired. Please scan your table QR again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const order = await orderService.placeOrder({
        guestName: name.trim(),
        guestPhone: phone.trim(),
        vendorId,
        mallId,
        tableId,
        orderType,
        items: orderService.buildOrderItems(items),
      });

      await orderService.payOrder(order.id, payCode);
      dispatch(clearCart());
      navigate(`/orders/${order.id}`, { replace: true });
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <Box textAlign="center" mt={8}>
        <Typography variant="h6" color="text.secondary">
          Your cart is empty.
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box maxWidth={520} mx="auto">
      <Typography variant="h5" fontWeight={700} mb={3}>
        Checkout
      </Typography>

      {/* Order summary */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={1}>
          Order Summary
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={1}>
          From: {vendorName}
        </Typography>
        <Stack spacing={0.5} mb={1}>
          {items.map((ci) => (
            <Box
              key={ci.menuItem.id}
              display="flex"
              justifyContent="space-between"
            >
              <Typography variant="body2">
                {ci.menuItem.name} × {ci.quantity}
              </Typography>
              <Typography variant="body2">
                ${(ci.menuItem.price * ci.quantity).toFixed(2)}
              </Typography>
            </Box>
          ))}
        </Stack>
        <Divider sx={{ my: 1 }} />
        <Box display="flex" justifyContent="space-between">
          <Typography fontWeight={700}>Total</Typography>
          <Typography fontWeight={700}>${total.toFixed(2)}</Typography>
        </Box>
      </Paper>

      {/* Guest info */}
      <Typography variant="subtitle1" fontWeight={600} mb={2}>
        Your Details
      </Typography>
      <Stack spacing={2} mb={3}>
        <TextField
          label="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={Boolean(fieldErrors.name)}
          helperText={fieldErrors.name}
          fullWidth
        />
        <TextField
          label="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={Boolean(fieldErrors.phone)}
          helperText={
            fieldErrors.phone ?? "We'll use this to identify your order"
          }
          fullWidth
        />
      </Stack>

      {/* Payment */}
      <Typography variant="subtitle1" fontWeight={600} mb={2}>
        Payment
      </Typography>
      <TextField
        label="Payment Code"
        value={payCode}
        onChange={(e) => setPayCode(e.target.value)}
        error={Boolean(fieldErrors.payCode)}
        helperText={
          fieldErrors.payCode ?? "Enter the payment code provided at the table"
        }
        fullWidth
        sx={{ mb: 3 }}
        inputProps={{ inputMode: "numeric" }}
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
        onClick={handleSubmit}
        disabled={loading}
        startIcon={
          loading ? <CircularProgress size={18} color="inherit" /> : undefined
        }
      >
        {loading ? "Placing Order…" : "Place Order"}
      </Button>
    </Box>
  );
}
