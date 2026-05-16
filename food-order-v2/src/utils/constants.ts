export const ROLES = {
  VENDOR: "vendor",
  ADMIN: "admin",
} as const;

// Auth0 custom claim key where roles are stored
export const AUTH0_ROLES_CLAIM = "https://food-order/roles";

// Dummy payment code
export const PAYMENT_CODE = "1234";

// WebSocket event names — must match the backend socketService emit names
export const WS_EVENTS = {
  // Server -> Client
  ORDER_STATUS: "order:status",
  NEW_ORDER: "order:new",
  // Client -> Server (customer joins an order room after placing)
  JOIN_ORDER: "join:order",
  // Vendor auth is passed via Socket.IO handshake, no join event needed
} as const;

// Order status labels for display
export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
};

// Order status colors for MUI chips
export const ORDER_STATUS_COLORS: Record<
  string,
  "default" | "warning" | "success" | "error" | "info" | "primary"
> = {
  PENDING: "warning",
  ACCEPTED: "primary",
  REJECTED: "error",
  COMPLETED: "success",
};
