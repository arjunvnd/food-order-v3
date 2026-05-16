import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { nanoid } from "@reduxjs/toolkit";

export interface AppNotification {
  id: string;
  message: string;
  severity: "success" | "info" | "warning" | "error";
  link?: string;
  read: boolean;
  createdAt: number;
}

interface NotificationsState {
  items: AppNotification[];
}

const initialState: NotificationsState = { items: [] };

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: {
      reducer(
        state,
        action: PayloadAction<AppNotification>,
      ) {
        // Keep at most 20 notifications
        state.items.unshift(action.payload);
        if (state.items.length > 20) state.items.length = 20;
      },
      prepare(
        notification: Omit<AppNotification, "id" | "read" | "createdAt">,
      ) {
        return {
          payload: {
            ...notification,
            id: nanoid(),
            read: false,
            createdAt: Date.now(),
          },
        };
      },
    },
    markAllRead(state) {
      state.items.forEach((n) => {
        n.read = true;
      });
    },
    clearAll(state) {
      state.items = [];
    },
  },
});

export const { addNotification, markAllRead, clearAll } =
  notificationsSlice.actions;
export default notificationsSlice.reducer;
