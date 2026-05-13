import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { UserRole } from "../../types";
import api from "../../services/api";

interface AuthUser {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

interface AuthState {
  user: AuthUser | null;
  role: UserRole | null;
  vendorId: string | null;
  isProfileComplete: boolean | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  role: null,
  vendorId: null,
  isProfileComplete: null,
  isAuthenticated: false,
  isLoading: true,
};

interface SyncResponse {
  id: string;
  email: string;
  name: string | null;
  role: "VENDOR" | "ADMIN" | "SUPER_ADMIN";
  mallId: string | null;
  vendorId: string | null;
  isProfileComplete: boolean | null;
}

// Thunk: called after Auth0 login. Syncs the user to the DB and returns their role.
export const setAuthUser = createAsyncThunk(
  "auth/setAuthUser",
  async (auth0User: Record<string, unknown>, { rejectWithValue }) => {
    try {
      const { data } = await api.post<SyncResponse>("/auth/sync", {
        email: auth0User.email,
        name: auth0User.name,
      });

      const role: UserRole | null =
        data.role === "ADMIN" || data.role === "SUPER_ADMIN"
          ? "admin"
          : "vendor";

      return {
        user: {
          sub: auth0User.sub as string,
          email: auth0User.email as string,
          name: auth0User.name as string,
          picture: auth0User.picture as string,
        },
        role,
        vendorId: data.vendorId,
        isProfileComplete: data.isProfileComplete ?? null,
      };
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Failed to sync user",
      );
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    clearAuth(state) {
      state.user = null;
      state.role = null;
      state.vendorId = null;
      state.isProfileComplete = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(setAuthUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(setAuthUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.role = action.payload.role;
        state.vendorId = action.payload.vendorId;
        state.isProfileComplete = action.payload.isProfileComplete;
        state.isAuthenticated = true;
        state.isLoading = false;
      })
      .addCase(setAuthUser.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { setLoading, clearAuth } = authSlice.actions;
export default authSlice.reducer;
