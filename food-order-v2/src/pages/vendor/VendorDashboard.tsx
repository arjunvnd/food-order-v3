import { useEffect } from "react";
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
} from "@mui/material";
import { useAuth0 } from "@auth0/auth0-react";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import { fetchVendorOrders } from "../../store/slices/ordersSlice";
import { useWebSocket } from "../../hooks/useWebSocket";
import OrderStatusChip from "../../components/common/OrderStatusChip";
import { orderService } from "../../services/orderService";
import { updateOrderStatus } from "../../store/slices/ordersSlice";

export default function VendorDashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAuth0();
  const { vendorOrders, isLoading, error } = useAppSelector((s) => s.orders);

  // We use the vendor's auth0 sub as vendorId here; backend maps sub → vendor
  const vendorId = useAppSelector((s) => s.auth.user?.sub ?? "");

  useEffect(() => {
    if (vendorId) dispatch(fetchVendorOrders({ vendorId, status: "paid" }));
  }, [vendorId, dispatch]);

  useWebSocket(
    { type: "vendor", vendorId },
    // pass token lazily — hook calls getAccessTokenSilently internally via useAuthToken
    undefined,
  );

  const handleAccept = async (orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, "accepted");
      dispatch(updateOrderStatus({ orderId, status: "accepted" }));
    } catch {
      /* show toast in production */
    }
  };

  const handleReject = async (orderId: string) => {
    try {
      await orderService.updateOrderStatus(orderId, "rejected");
      dispatch(updateOrderStatus({ orderId, status: "rejected" }));
    } catch {
      /* show toast in production */
    }
  };

  const incomingOrders = vendorOrders.filter((o) => o.status === "paid");

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
    </Box>
  );
}
