import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Paper,
  Stack,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  MenuItem as SelectMenuItem,
  IconButton,
  Divider,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useAppDispatch } from "../../hooks/useAppStore";
import { createVendorOrder } from "../../store/slices/ordersSlice";
import { orderService } from "../../services/orderService";
import type { ActiveMenuItemOption } from "../../services/orderService";
import { tableService } from "../../services/tableService";
import type { OrderType, PaymentStatus, Table } from "../../types";

export default function NewOrderPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState<OrderType>("TAKEAWAY");
  const [tableId, setTableId] = useState("");
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<ActiveMenuItemOption[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("UNPAID");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      orderService.getActiveMenuItemsForOrder(),
      tableService.getVendorTables(),
    ])
      .then(([items, vendorTables]) => {
        setMenuItems(items);
        setTables(vendorTables.filter((t) => t.isActive));
      })
      .catch(() => setError("Could not load menu items or tables."))
      .finally(() => setLoading(false));
  }, []);

  const setQuantity = (menuItemId: string, quantity: number) => {
    setQuantities((prev) => {
      if (quantity <= 0) {
        const next = { ...prev };
        delete next[menuItemId];
        return next;
      }
      return { ...prev, [menuItemId]: quantity };
    });
  };

  const selectedItems = Object.entries(quantities);
  const total = selectedItems.reduce((sum, [menuItemId, qty]) => {
    const item = menuItems.find((m) => m.id === menuItemId);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      setError("Add at least one item to the order.");
      return;
    }
    if (orderType === "DINE_IN" && !tableId) {
      setError("Select a table for a dine-in order.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await dispatch(
        createVendorOrder({
          orderType,
          tableId: orderType === "DINE_IN" ? tableId : undefined,
          guestName: guestName.trim() || undefined,
          guestPhone: guestPhone.trim() || undefined,
          notes: notes.trim() || undefined,
          paymentStatus,
          items: selectedItems.map(([menuItemId, quantity]) => ({
            menuItemId,
            quantity,
          })),
        }),
      ).unwrap();
      navigate(`/vendor/orders/${result.id}`, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box maxWidth={640} mx="auto">
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      <Typography variant="h5" fontWeight={700} mb={3}>
        New Order
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
          Order Type
        </Typography>
        <ToggleButtonGroup
          value={orderType}
          exclusive
          onChange={(_, v: OrderType | null) => v && setOrderType(v)}
          size="small"
          sx={{ mb: 2 }}
        >
          <ToggleButton value="TAKEAWAY">Takeaway / Parcel</ToggleButton>
          <ToggleButton value="DINE_IN">Dine-in</ToggleButton>
        </ToggleButtonGroup>

        {orderType === "DINE_IN" && (
          <TextField
            select
            label="Table"
            value={tableId}
            onChange={(e) => setTableId(e.target.value)}
            fullWidth
            size="small"
          >
            {tables.length === 0 && (
              <SelectMenuItem value="" disabled>
                No tables available
              </SelectMenuItem>
            )}
            {tables.map((t) => (
              <SelectMenuItem key={t.id} value={t.id}>
                {t.tableNumber}
              </SelectMenuItem>
            ))}
          </TextField>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
          Guest Details (optional)
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="Phone"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            size="small"
            fullWidth
          />
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
          Items
        </Typography>
        {menuItems.length === 0 && (
          <Alert severity="info">
            No active menu items found. Activate a menu first.
          </Alert>
        )}
        <Stack spacing={1.5}>
          {menuItems.map((item) => {
            const qty = quantities[item.id] ?? 0;
            return (
              <Box
                key={item.id}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {item.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ${item.price.toFixed(2)}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <IconButton
                    size="small"
                    onClick={() => setQuantity(item.id, qty - 1)}
                    disabled={qty === 0}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography width={24} textAlign="center">
                    {qty}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setQuantity(item.id, qty + 1)}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            );
          })}
        </Stack>

        <Divider sx={{ my: 2 }} />

        <TextField
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          size="small"
          fullWidth
          multiline
          minRows={2}
        />
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
          Payment
        </Typography>
        <ToggleButtonGroup
          value={paymentStatus}
          exclusive
          onChange={(_, v: PaymentStatus | null) => v && setPaymentStatus(v)}
          size="small"
        >
          <ToggleButton value="UNPAID">Unpaid</ToggleButton>
          <ToggleButton value="PAID">Paid now</ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" fontWeight={700}>
          Total: ${total.toFixed(2)}
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Creating..." : "Create Order"}
        </Button>
      </Box>
    </Box>
  );
}
