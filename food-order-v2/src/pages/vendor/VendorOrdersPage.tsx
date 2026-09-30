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
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useAppDispatch, useAppSelector } from "../../hooks/useAppStore";
import { fetchVendorOrders } from "../../store/slices/ordersSlice";
import OrderStatusChip from "../../components/common/OrderStatusChip";
import type { OrderStatus, OrderSource } from "../../types";

const TABS: { label: string; value: OrderStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Rejected", value: "REJECTED" },
];

const SOURCE_FILTERS: { label: string; value: OrderSource | "all" }[] = [
  { label: "All", value: "all" },
  { label: "QR", value: "CUSTOMER" },
  { label: "Manual", value: "VENDOR" },
];

export default function VendorOrdersPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const vendorId = useAppSelector((s) => s.auth.vendorId ?? "");
  const { vendorOrders, isLoading, error } = useAppSelector((s) => s.orders);
  const [tab, setTab] = useState<OrderStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<OrderSource | "all">("all");

  useEffect(() => {
    if (vendorId) dispatch(fetchVendorOrders({ vendorId }));
  }, [vendorId, dispatch]);

  const filtered = vendorOrders
    .filter((o) => tab === "all" || o.status === tab)
    .filter((o) => sourceFilter === "all" || o.source === sourceFilter);

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" fontWeight={700}>
          Orders
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/vendor/orders/new")}
        >
          New Order
        </Button>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v: OrderStatus | "all") => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        {TABS.map((t) => (
          <Tab key={t.value} label={t.label} value={t.value} />
        ))}
      </Tabs>

      <ToggleButtonGroup
        value={sourceFilter}
        exclusive
        onChange={(_, v: OrderSource | "all" | null) => v && setSourceFilter(v)}
        size="small"
        sx={{ mb: 3 }}
      >
        {SOURCE_FILTERS.map((f) => (
          <ToggleButton key={f.value} value={f.value}>
            {f.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

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
                <TableCell>Source</TableCell>
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
                  <TableCell>
                    $
                    {typeof order.totalAmount === "string"
                      ? order.totalAmount
                      : order.totalAmount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <OrderStatusChip status={order.status} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.source === "VENDOR" ? "Manual" : "QR"}
                      size="small"
                      color={
                        order.source === "VENDOR" ? "secondary" : "default"
                      }
                      variant={
                        order.source === "VENDOR" ? "filled" : "outlined"
                      }
                    />
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
