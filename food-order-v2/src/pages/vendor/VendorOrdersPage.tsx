import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
  Paper,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import { fetchVendorOrders } from "../../store/slices/ordersSlice";
import OrderStatusChip from "../../components/common/OrderStatusChip";
import type { OrderStatus } from "../../types";

const TABS: { label: string; value: OrderStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Paid", value: "paid" },
  { label: "Accepted", value: "accepted" },
  { label: "Preparing", value: "preparing" },
  { label: "Completed", value: "completed" },
  { label: "Rejected", value: "rejected" },
];

export default function VendorOrdersPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const vendorId = useAppSelector((s) => s.auth.user?.sub ?? "");
  const { vendorOrders, isLoading, error } = useAppSelector((s) => s.orders);
  const [tab, setTab] = useState<OrderStatus | "all">("all");

  useEffect(() => {
    if (vendorId) dispatch(fetchVendorOrders({ vendorId }));
  }, [vendorId, dispatch]);

  const filtered =
    tab === "all" ? vendorOrders : vendorOrders.filter((o) => o.status === tab);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Orders
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v: OrderStatus | "all") => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3 }}
      >
        {TABS.map((t) => (
          <Tab key={t.value} label={t.label} value={t.value} />
        ))}
      </Tabs>

      {isLoading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!isLoading && filtered.length === 0 && (
        <Alert severity="info">No orders in this category.</Alert>
      )}

      {!isLoading && filtered.length > 0 && (
        <Paper variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Guest</TableCell>
                <TableCell>Table</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Time</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>{order.id.slice(0, 8).toUpperCase()}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {order.guestName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {order.guestPhone}
                    </Typography>
                  </TableCell>
                  <TableCell>{order.tableNumber}</TableCell>
                  <TableCell>
                    <Chip
                      label={`${order.items.length} item(s)`}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <OrderStatusChip status={order.status} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(order.createdAt).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => navigate(`/vendor/orders/${order.id}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
