import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Order, OrderStatus } from "../../types";
import { orderService } from "../../services/orderService";

interface OrdersState {
  // Vendor side
  vendorOrders: Order[];
  // Customer tracking
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  vendorOrders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
};

export const fetchOrderById = createAsyncThunk(
  "orders/fetchById",
  async (orderId: string, { rejectWithValue }) => {
    try {
      return await orderService.getOrderById(orderId);
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Failed to load order",
      );
    }
  },
);

export const fetchVendorOrders = createAsyncThunk(
  "orders/fetchVendorOrders",
  async (
    params: { vendorId: string; status?: OrderStatus },
    { rejectWithValue },
  ) => {
    try {
      return await orderService.getVendorOrders(params.vendorId, params.status);
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Failed to load orders",
      );
    }
  },
);

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    // Dispatched by WebSocket handler when an order status changes
    updateOrderStatus(
      state,
      action: PayloadAction<{ orderId: string; status: OrderStatus }>,
    ) {
      const { orderId, status } = action.payload;
      if (state.currentOrder?.id === orderId) {
        state.currentOrder.status = status;
      }
      const vendorOrder = state.vendorOrders.find((o) => o.id === orderId);
      if (vendorOrder) vendorOrder.status = status;
    },

    // Dispatched by WebSocket handler when vendor receives a new order
    addVendorOrder(state, action: PayloadAction<Order>) {
      const exists = state.vendorOrders.find((o) => o.id === action.payload.id);
      if (!exists) state.vendorOrders.unshift(action.payload);
    },

    setCurrentOrder(state, action: PayloadAction<Order | null>) {
      state.currentOrder = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrderById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      })
      .addCase(fetchVendorOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVendorOrders.fulfilled, (state, action) => {
        state.vendorOrders = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchVendorOrders.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });
  },
});

export const { updateOrderStatus, addVendorOrder, setCurrentOrder } =
  ordersSlice.actions;
export default ordersSlice.reducer;
