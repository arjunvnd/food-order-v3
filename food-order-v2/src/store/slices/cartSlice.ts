import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { CartItem, CartState, MenuItem } from "../../types";

const CART_STORAGE_KEY = "food_order_cart";

function loadFromStorage(): CartState {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CartState;
  } catch {
    // ignore
  }
  return {
    items: [],
    vendorId: null,
    vendorName: null,
    mallId: null,
    tableId: null,
    orderType: "DINE_IN",
  };
}

function saveToStorage(state: CartState) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

const initialState: CartState = loadFromStorage();

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setTableContext(
      state,
      action: PayloadAction<{ mallId: string; tableId: string }>,
    ) {
      state.mallId = action.payload.mallId;
      state.tableId = action.payload.tableId;
      state.orderType = "DINE_IN";
      saveToStorage(state);
    },

    // For standalone restaurant dine-in (table belongs to a vendor, not a mall)
    setVendorTableContext(
      state,
      action: PayloadAction<{ vendorId: string; tableId: string }>,
    ) {
      state.mallId = null;
      state.vendorId = action.payload.vendorId;
      state.tableId = action.payload.tableId;
      state.orderType = "DINE_IN";
      saveToStorage(state);
    },

    // For takeaway counter scan (no table)
    setTakeawayContext(
      state,
      action: PayloadAction<{ vendorId: string; vendorName: string }>,
    ) {
      state.mallId = null;
      state.tableId = null;
      state.vendorId = action.payload.vendorId;
      state.vendorName = action.payload.vendorName;
      state.orderType = "TAKEAWAY";
      saveToStorage(state);
    },

    addItem(
      state,
      action: PayloadAction<{
        menuItem: MenuItem;
        vendorId: string;
        vendorName: string;
      }>,
    ) {
      const { menuItem, vendorId, vendorName } = action.payload;

      // If adding from a new vendor, clear the cart first
      if (state.vendorId && state.vendorId !== vendorId) {
        state.items = [];
      }

      state.vendorId = vendorId;
      state.vendorName = vendorName;

      const existing = state.items.find((i) => i.menuItem.id === menuItem.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ menuItem, quantity: 1 });
      }
      saveToStorage(state);
    },

    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.menuItem.id !== action.payload);
      if (state.items.length === 0) {
        state.vendorId = null;
        state.vendorName = null;
      }
      saveToStorage(state);
    },

    updateQuantity(
      state,
      action: PayloadAction<{ menuItemId: string; quantity: number }>,
    ) {
      const { menuItemId, quantity } = action.payload;
      if (quantity <= 0) {
        state.items = state.items.filter((i) => i.menuItem.id !== menuItemId);
        if (state.items.length === 0) {
          state.vendorId = null;
          state.vendorName = null;
        }
      } else {
        const item = state.items.find((i) => i.menuItem.id === menuItemId);
        if (item) item.quantity = quantity;
      }
      saveToStorage(state);
    },

    clearCart(state) {
      state.items = [];
      state.vendorId = null;
      state.vendorName = null;
      saveToStorage(state);
    },
  },
});

export const {
  setTableContext,
  setVendorTableContext,
  setTakeawayContext,
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
} = cartSlice.actions;

export const selectCartTotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);

export const selectCartItemCount = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.quantity, 0);

export default cartSlice.reducer;
