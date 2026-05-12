import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Vendor } from "../../types";
import { restaurantService } from "../../services/restaurantService";

interface RestaurantsState {
  vendors: Vendor[];
  isLoading: boolean;
  error: string | null;
}

const initialState: RestaurantsState = {
  vendors: [],
  isLoading: false,
  error: null,
};

export const fetchVendorsByMall = createAsyncThunk(
  "restaurants/fetchByMall",
  async (mallId: string, { rejectWithValue }) => {
    try {
      return await restaurantService.getVendorsByMall(mallId);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load restaurants";
      return rejectWithValue(message);
    }
  },
);

const restaurantsSlice = createSlice({
  name: "restaurants",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendorsByMall.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVendorsByMall.fulfilled, (state, action) => {
        state.vendors = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchVendorsByMall.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });
  },
});

export default restaurantsSlice.reducer;
