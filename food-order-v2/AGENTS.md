# food-order-v2 — Frontend Agent Guide

React 19 + Vite SPA. Runs on port **5173** in dev. Built output at `dist/` is served by the backend in production.

---

## Quick Orientation

```
src/
├── main.tsx              ← entry: <RouterProvider router={router}>
├── App.tsx               ← intentionally empty shell
├── router/
│   └── index.tsx         ← ALL routes defined here
├── pages/
│   ├── admin/            ← ADMIN + SUPER_ADMIN views
│   ├── auth/             ← login, callback, request-access, unauthorized
│   ├── customer/         ← guest-facing ordering flow
│   ├── super-admin/      ← super_admin exclusive views
│   └── vendor/           ← vendor dashboard + management
├── components/
│   ├── common/           ← shared layout, guards, nav
│   └── customer/         ← guest-specific components
├── store/
│   ├── index.ts          ← configureStore — all reducers registered here
│   └── slices/           ← one file per slice
├── services/
│   ├── api.ts            ← Axios instance + interceptors
│   ├── menuService.ts
│   ├── orderService.ts
│   ├── restaurantService.ts
│   ├── superAdminService.ts
│   └── tableService.ts
├── hooks/
│   ├── useAppStore.ts    ← typed useAppDispatch / useAppSelector
│   ├── useRole.ts        ← role helpers
│   └── useWebSocket.ts   ← Socket.IO wrapper
├── types/
│   └── index.ts          ← ALL shared TypeScript types (single file)
└── utils/
    ├── constants.ts      ← WS_EVENTS, ORDER_STATUS_LABELS/COLORS, PAYMENT_CODE
    └── activeOrder.ts    ← localStorage helpers for in-progress guest orders
```

---

## Routing

All routes live in `router/index.tsx`. The router is a `createBrowserRouter` and is mounted directly in `main.tsx`.

### Route Protection

Wrap routes with:

- `<ProtectedRoute>` — redirects to `/login` if not authenticated via Auth0; also redirects PENDING users.
- `<RoleGuard roles={[...]}>` — redirects to `/unauthorized` if role mismatch. Uses Redux `auth.role`.
- `<SuperAdminGuard>` — checks `auth.isSuperAdmin` boolean.

### Layout Variants

`<AppLayout variant="customer|vendor|admin|super_admin">` wraps page content and picks the correct navbar/sidebar.

### Full Route Table

| Path                                                    | Component               | Guard                                             |
| ------------------------------------------------------- | ----------------------- | ------------------------------------------------- |
| `/login`                                                | `LoginPage`             | —                                                 |
| `/auth/callback`                                        | `CallbackPage`          | —                                                 |
| `/unauthorized`                                         | `UnauthorizedPage`      | —                                                 |
| `/request-access`                                       | `RequestAccessPage`     | `ProtectedRoute`                                  |
| `/scan/:qrToken`                                        | `QRScanPage`            | —                                                 |
| `/mall/:mallId/table/:tableId`                          | `TablePage`             | —                                                 |
| `/mall/:mallId/table/:tableId/restaurant/:restaurantId` | `RestaurantMenuPage`    | —                                                 |
| `/restaurant/:vendorId/table/:tableId`                  | `VendorDineInPage`      | —                                                 |
| `/restaurant/:vendorId/takeaway`                        | `VendorTakeawayPage`    | —                                                 |
| `/cart`                                                 | `CartPage`              | —                                                 |
| `/checkout`                                             | `CheckoutPage`          | —                                                 |
| `/orders/:orderId`                                      | `OrderTrackingPage`     | —                                                 |
| `/orders/:orderId/pay`                                  | `PaymentPage`           | —                                                 |
| `/vendor`                                               | `VendorDashboard`       | `ProtectedRoute` + `RoleGuard vendor`             |
| `/vendor/profile`                                       | `VendorProfilePage`     | vendor                                            |
| `/vendor/orders`                                        | `VendorOrdersPage`      | vendor                                            |
| `/vendor/orders/:orderId`                               | `VendorOrderDetailPage` | vendor                                            |
| `/vendor/menus`                                         | `MenusPage`             | vendor                                            |
| `/vendor/menus/new`                                     | `MenuFormPage`          | vendor                                            |
| `/vendor/menus/:menuId/edit`                            | `MenuFormPage`          | vendor                                            |
| `/vendor/menus/:menuId/items`                           | `MenuItemsPage`         | vendor                                            |
| `/vendor/menus/:menuId/items/new`                       | `MenuItemFormPage`      | vendor                                            |
| `/vendor/menus/:menuId/items/:itemId/edit`              | `MenuItemFormPage`      | vendor                                            |
| `/vendor/tables`                                        | `VendorTablesPage`      | vendor                                            |
| `/admin`                                                | `AdminDashboard`        | `ProtectedRoute` + `RoleGuard admin, super_admin` |
| `/admin/vendors`                                        | `VendorsPage`           | admin/super_admin                                 |
| `/admin/vendors/invite`                                 | `InviteVendorPage`      | admin/super_admin                                 |
| `/admin/vendors/:vendorId`                              | `VendorDetailPage`      | admin/super_admin                                 |
| `/admin/tables`                                         | `AdminTablesPage`       | admin/super_admin                                 |
| `/super-admin`                                          | `SuperAdminDashboard`   | `SuperAdminGuard`                                 |
| `/super-admin/users`                                    | `UsersPage`             | super_admin                                       |
| `/super-admin/access-requests`                          | `AccessRequestsPage`    | super_admin                                       |

### Adding a New Route

1. Create the page component under the matching `pages/<role>/` folder.
2. Add the route to `router/index.tsx`, wrapping with the appropriate guard.
3. Add a nav link to `Navbar.tsx` if it should appear in navigation.

---

## Redux Store

Use the typed hooks from `hooks/useAppStore.ts`:

```typescript
const dispatch = useAppDispatch();
const something = useAppSelector((state) => state.sliceName.field);
```

### Slices

#### `authSlice`

```typescript
state: {
  user: object | null,        // Auth0 user profile
  role: UserRole | null,      // "vendor" | "admin" | "super_admin"
  status: UserStatus | null,  // "PENDING" | "ACTIVE"
  isSuperAdmin: boolean,
  vendorId: string | null,
  isProfileComplete: boolean,
  isAuthenticated: boolean,
  isLoading: boolean,
}
```

- Async thunk `setAuthUser(auth0User)` → calls `POST /api/auth/sync`, populates all fields.
- Actions: `setLoading`, `clearAuth`.
- **Do not** hardcode role checks — always use `auth.role` or `useRole()` hook.

#### `cartSlice`

```typescript
state: {
  items: CartItem[],
  vendorId: string | null,
  vendorName: string | null,
  mallId: string | null,
  tableId: string | null,
  orderType: "DINE_IN" | "TAKEAWAY",
}
```

- Persisted to `localStorage` key `"food_order_cart"`.
- `addItem` auto-clears the cart if the item belongs to a different vendor (with a confirm first — handled in component).
- Context setters: `setTableContext`, `setVendorTableContext`, `setTakeawayContext`.
- Actions: `addItem`, `removeItem`, `updateQuantity`, `clearCart`.

#### `ordersSlice`

```typescript
state: {
  vendorOrders: Order[],
  currentOrder: Order | null,
  isLoading: boolean,
  error: string | null,
}
```

- Thunks: `fetchOrderById`, `fetchVendorOrders({ vendorId, status? })`.
- `updateOrderStatus(orderId, newStatus)` handles both `OrderStatus` and `"PAID"` (PaymentStatus).
- `addVendorOrder(order)` deduplicates by `id`.

#### `menusSlice`

```typescript
state: {
  (menus, menuItems, activeMenuId, isLoading, isItemsLoading, error);
}
```

- Thunks: `fetchMenusByVendor`, `fetchMenuItems(menuId)`, `fetchActiveMenu(vendorId)`.
- `fetchActiveMenu` is used by the guest ordering flow (no auth required).

#### `restaurantsSlice`

```typescript
state: { vendors: Vendor[], isLoading, error }
```

- Thunk: `fetchVendorsByMall(mallId)` — public, no auth.

#### `notificationsSlice`

```typescript
state: { items: AppNotification[] }  // max 20, newest first
// AppNotification: { id, message, severity, link?, read, createdAt }
```

- `addNotification({ message, severity, link? })` — auto-generates id + timestamp.
- `markAllRead`, `clearAll`.
- Used by `VendorDashboard` to track in-session order alerts.

---

## Services

All services use the Axios instance from `api.ts`.

### `api.ts`

- `baseURL` = `import.meta.env.VITE_API_BASE_URL`
- **Request interceptor:** attaches `Authorization: Bearer <token>` for vendor/admin routes. Call `setTokenGetter(fn)` to wire the Auth0 token function. Guest flows do not need a token.
- **Response interceptor:** coerces `price`, `unitPrice`, `totalAmount` from string → number everywhere.

### Adding a New Service Call

```typescript
// In the relevant service file:
export const doSomething = async (id: string): Promise<MyType> => {
  const response = await api.get<MyType>(`/endpoint/${id}`);
  return response.data;
};
```

### `orderService.ts` Patterns

- `normalizeOrder(raw)` flattens nested Prisma output (vendor.restaurantName → vendorName, etc). Always run raw API responses through this.
- `buildOrderItems(cartItems)` maps cart items to `{ menuItemId, quantity }[]` for the API.

### `menuService.ts` Image Uploads

Menu item create/update sends `multipart/form-data` with a `FormData` object. The Axios instance handles the `Content-Type` automatically — **do not** set it manually.

---

## Auth & Roles

```typescript
import { useRole, useIsRole } from "../hooks/useRole";

const role = useRole(); // "vendor" | "admin" | "super_admin" | null
const isVendor = useIsRole("vendor");
```

Role values on the frontend are **lowercase**: `"vendor"`, `"admin"`, `"super_admin"`.  
Role values in the backend/DB are **uppercase**: `"VENDOR"`, `"ADMIN"`, `"SUPER_ADMIN"`.

Do **not** use `useAuth0().user` for role/profile data — use Redux `authSlice` instead (it has the DB-backed role).

---

## Socket.IO — `useWebSocket` Hook

```typescript
// For a guest tracking their order:
useWebSocket({
  type: "order",
  orderId: "...",
  onStatusUpdate: (status) => {
    /* handle OrderStatus or "PAID" */
  },
});

// For a vendor receiving new orders:
useWebSocket({
  type: "vendor",
  vendorId: "...",
  onNewOrder: (order) => {
    /* Order already normalized */
  },
  onPayment: (orderId) => {
    /* customer paid */
  },
});
```

- Connects to `VITE_WS_URL` (falls back to `window.location.origin`).
- Vendor mode passes `{ auth: { vendorId } }` in the Socket.IO handshake.
- Events: `WS_EVENTS.ORDER_STATUS` (`"order:status"`), `WS_EVENTS.NEW_ORDER` (`"order:new"`), `WS_EVENTS.JOIN_ORDER` (`"join:order"`).

---

## TypeScript Types

All shared types are in `src/types/index.ts` (single file). Key types:

```typescript
type UserRole = "vendor" | "admin" | "super_admin";
type OrderStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED";
type PaymentStatus = "UNPAID" | "PAID";
type OrderType = "DINE_IN" | "TAKEAWAY";
type VendorType = "MALL_VENDOR" | "STANDALONE" | "TAKEAWAY";
type UserStatus = "PENDING" | "ACTIVE";

// QR scan result — discriminated union on `type`
type ScanResult =
  | { type: "MALL_TABLE"; tableId; tableNumber; mallId }
  | { type: "VENDOR_TABLE"; tableId; tableNumber; vendorId }
  | { type: "VENDOR_COUNTER"; vendorId; restaurantName };

interface Order {
  id;
  vendorId;
  vendorName;
  mallId;
  tableId;
  tableNumber;
  orderType;
  items: OrderItem[];
  totalAmount;
  status;
  paymentStatus;
  guestName;
  guestPhone;
  createdAt;
  updatedAt;
}
interface OrderItem {
  menuItemId;
  menuItemName;
  price;
  quantity;
}
interface CartItem {
  menuItemId;
  menuItemName;
  price;
  quantity;
  vendorId;
}
```

Add new shared types to `src/types/index.ts` — **do not** define types inline in component files.

---

## UI — MUI v7

- All UI is built with MUI v7 (`@mui/material`).
- Icons from `@mui/icons-material`.
- **No custom CSS** — use MUI `sx` prop or `styled()`.
- `OrderStatusChip` in `components/common/` renders a colored `Chip` for any `OrderStatus`. Reuse it instead of writing custom status display logic.
- `ConfirmDialog` in `components/common/` is a reusable confirmation modal.

---

## Common Patterns

### Vendor Page Template

```typescript
// 1. Get auth context
const { vendorId } = useAppSelector((state) => state.auth);

// 2. Load data
const dispatch = useAppDispatch();
useEffect(() => {
  dispatch(fetchVendorOrders({ vendorId: vendorId! }));
}, [vendorId]);

// 3. Read from store
const { vendorOrders, isLoading } = useAppSelector((state) => state.orders);

// 4. Actions call service + dispatch update
const handleAccept = async (orderId: string) => {
  await orderService.updateOrderStatus(orderId, "accept");
  dispatch(updateOrderStatus({ orderId, status: "ACCEPTED" }));
};
```

### Guest (No Auth) Page Template

```typescript
// Guest pages use URL params, no Redux auth
const { vendorId, tableId } = useParams();
const dispatch = useAppDispatch();

// Fetch public data
useEffect(() => {
  dispatch(fetchActiveMenu(vendorId!));
}, [vendorId]);
const { menuItems } = useAppSelector((state) => state.menus);
```

### Form Validation

No form library in use — forms use local `useState` and validate in the submit handler. Return early with a user-facing error message in a MUI `Alert`.

### Error Display

```tsx
{
  error && <Alert severity="error">{error}</Alert>;
}
```

---

## Constants Reference (`utils/constants.ts`)

```typescript
AUTH0_ROLES_CLAIM = "https://food-order/roles";
PAYMENT_CODE = "1234"; // dummy payment, to be replaced with Razorpay

WS_EVENTS = {
  ORDER_STATUS: "order:status",
  NEW_ORDER: "order:new",
  JOIN_ORDER: "join:order",
};

ORDER_STATUS_LABELS = { PENDING, ACCEPTED, REJECTED, COMPLETED };
ORDER_STATUS_COLORS; // maps status → MUI Chip color
```

---

## Active Order (Guest Persistence)

`utils/activeOrder.ts` exposes `saveActiveOrder`, `getActiveOrder`, `clearActiveOrder`.  
Saves `{ orderId, savedAt }` to `localStorage` key `"food_order_active"`.  
`ActiveOrderBanner` component reads this and shows a sticky "resume order" bar.

---

## Environment Variables

| Variable               | Usage                                               |
| ---------------------- | --------------------------------------------------- |
| `VITE_API_BASE_URL`    | Axios baseURL (e.g. `http://localhost:3000/api`)    |
| `VITE_WS_URL`          | Socket.IO server URL (e.g. `http://localhost:3000`) |
| `VITE_AUTH0_DOMAIN`    | Auth0 domain                                        |
| `VITE_AUTH0_CLIENT_ID` | Auth0 client ID                                     |
| `VITE_AUTH0_AUDIENCE`  | Auth0 API audience                                  |
