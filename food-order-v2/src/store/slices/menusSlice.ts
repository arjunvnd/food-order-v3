import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Menu, MenuItem } from "../../types";
import { menuService } from "../../services/menuService";

interface MenusState {
  menus: Menu[];
  menuItems: MenuItem[];
  activeMenuId: string | null;
  isLoading: boolean;
  isItemsLoading: boolean;
  error: string | null;
}

const initialState: MenusState = {
  menus: [],
  menuItems: [],
  activeMenuId: null,
  isLoading: false,
  isItemsLoading: false,
  error: null,
};

export const fetchMenusByVendor = createAsyncThunk(
  "menus/fetchByVendor",
  async (vendorId: string, { rejectWithValue }) => {
    try {
      return await menuService.getMenusByVendor(vendorId);
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Failed to load menus",
      );
    }
  },
);

export const fetchMenuItems = createAsyncThunk(
  "menus/fetchItems",
  async (menuId: string, { rejectWithValue }) => {
    try {
      return await menuService.getMenuItems(menuId);
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Failed to load menu items",
      );
    }
  },
);

export const fetchActiveMenu = createAsyncThunk(
  "menus/fetchActive",
  async (vendorId: string, { rejectWithValue }) => {
    try {
      return await menuService.getActiveMenu(vendorId);
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Failed to load active menu",
      );
    }
  },
);

const menusSlice = createSlice({
  name: "menus",
  initialState,
  reducers: {
    setActiveMenuId(state, action: PayloadAction<string | null>) {
      state.activeMenuId = action.payload;
    },
    updateMenuInList(state, action: PayloadAction<Menu>) {
      const index = state.menus.findIndex((m) => m.id === action.payload.id);
      if (index !== -1) state.menus[index] = action.payload;
    },
    removeMenu(state, action: PayloadAction<string>) {
      state.menus = state.menus.filter((m) => m.id !== action.payload);
    },
    updateMenuItemInList(state, action: PayloadAction<MenuItem>) {
      const index = state.menuItems.findIndex(
        (i) => i.id === action.payload.id,
      );
      if (index !== -1) state.menuItems[index] = action.payload;
    },
    removeMenuItem(state, action: PayloadAction<string>) {
      state.menuItems = state.menuItems.filter((i) => i.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenusByVendor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMenusByVendor.fulfilled, (state, action) => {
        state.menus = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchMenusByVendor.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      })
      .addCase(fetchMenuItems.pending, (state) => {
        state.isItemsLoading = true;
      })
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.menuItems = action.payload;
        state.isItemsLoading = false;
      })
      .addCase(fetchMenuItems.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isItemsLoading = false;
      })
      .addCase(fetchActiveMenu.fulfilled, (state, action) => {
        if (action.payload) {
          state.activeMenuId = action.payload.id;
          const exists = state.menus.find((m) => m.id === action.payload!.id);
          if (!exists) state.menus.push(action.payload);
          // Items are embedded by the public endpoint — use them directly
          // so customer pages never need to call the vendor-auth items endpoint.
          if (action.payload.items) {
            state.menuItems = action.payload.items;
          }
        } else {
          state.menuItems = [];
        }
      });
  },
});

export const {
  setActiveMenuId,
  updateMenuInList,
  removeMenu,
  updateMenuItemInList,
  removeMenuItem,
} = menusSlice.actions;

export default menusSlice.reducer;
