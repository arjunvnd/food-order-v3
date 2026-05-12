import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { UserRole } from "../../types";
import { AUTH0_ROLES_CLAIM } from "../../utils/constants";

interface AuthUser {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

interface AuthState {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
};

// Thunk to extract role from Auth0 user object (called after Auth0 loads)
export const setAuthUser = createAsyncThunk(
  "auth/setAuthUser",
  async (auth0User: Record<string, unknown>) => {
    const roles = (auth0User[AUTH0_ROLES_CLAIM] as UserRole[]) ?? [];
    const role: UserRole | null = roles.includes("admin")
      ? "admin"
      : roles.includes("vendor")
        ? "vendor"
        : null;

    return {
      user: {
        sub: auth0User.sub as string,
        email: auth0User.email as string,
        name: auth0User.name as string,
        picture: auth0User.picture as string,
      },
      role,
    };
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
