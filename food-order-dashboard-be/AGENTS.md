# food-order-dashboard-be — Backend Agent Guide

Express 5.2 + Prisma 7 + PostgreSQL API server. Runs on port **3000**. Also serves the React frontend build in production.

---

## Quick Orientation

```
src/
├── app.ts               ← Express app: middleware, CORS, rate limiting, route mounting
├── server.ts            ← HTTP server start + Socket.IO init
├── config/
│   ├── config.ts        ← All env vars as a typed config object
│   └── roles.config.ts  ← ROLES array (single source of truth for role names)
├── controllers/         ← One file per domain; pure request/response logic
├── middlewares/
│   ├── auth.ts          ← requireAuth (validates Auth0 JWT)
│   ├── rbac.ts          ← requireRole(...roles) (checks DB role)
│   ├── errorHandler.ts  ← Global error handler
│   └── upload.ts        ← Multer config (5 MB, images only)
├── routes/              ← One file per route group; wires middleware + controllers
├── services/
│   └── socketService.ts ← Socket.IO helpers (emit functions)
├── lib/
│   ├── prisma.ts        ← PrismaClient singleton (via @prisma/adapter-pg)
│   └── logger.ts        ← Winston logger
├── generated/prisma/    ← Prisma generated client — DO NOT EDIT
└── types/
    └── express.d.ts     ← req.user type augmentation
```

Prisma model source files live in `prisma/models/*.prisma` (split schema), **not** in `src/`.

---

## Authentication & Authorization

### Middleware Chain

Every protected route must use this order:

```typescript
router.get('/path', requireAuth, requireRole('VENDOR', 'ADMIN'), controller);
```

### `requireAuth` (`middlewares/auth.ts`)

Validates the `Authorization: Bearer <token>` header using `express-oauth2-jwt-bearer`.  
Sets `req.auth` with the decoded JWT payload (including `sub`).  
**Never skip this on non-public routes.**

### `requireRole(...roles)` (`middlewares/rbac.ts`)

- Looks up the user in Postgres by `req.auth.payload.sub`.
- Attaches the full user record to `req.user` (typed at `express.d.ts`).
- Rejects `PENDING` users with `403`.
- Role names are **uppercase**: `"SUPER_ADMIN"`, `"ADMIN"`, `"VENDOR"`.

### `req.user` Type

```typescript
{
  id: string;
  auth0Sub: string;
  email: string;
  name: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'VENDOR';
  mallId: string | null;
  vendorId: string | null;
}
```

### Public Routes

`publicRoutes.ts` and `orderRoutes.ts` do **not** use `requireAuth` — they serve guests.

---

## Route Groups

| Prefix             | File                  | Auth          | Roles                  |
| ------------------ | --------------------- | ------------- | ---------------------- |
| `/api/auth`        | `authRoutes.ts`       | `requireAuth` | any (PENDING allowed)  |
| `/api/public`      | `publicRoutes.ts`     | none          | —                      |
| `/api/orders`      | `orderRoutes.ts`      | none          | —                      |
| `/api/vendor`      | `vendorRoutes.ts`     | `requireAuth` | `VENDOR`               |
| `/api/admin`       | `adminRoutes.ts`      | `requireAuth` | `ADMIN`, `SUPER_ADMIN` |
| `/api/super-admin` | `superAdminRoutes.ts` | `requireAuth` | `SUPER_ADMIN`          |
| `/api/uploads`     | `uploadRoutes.ts`     | `requireAuth` | `VENDOR`               |

### Adding a New Endpoint (pattern)

1. Add the controller function to the relevant controller file.
2. Add the route to the relevant route file with the correct middleware chain.
3. If it's a new domain, create `src/routes/myRoutes.ts` and mount it in `app.ts`.

```typescript
// routes/vendorRoutes.ts
router.get(
  '/my-thing',
  requireAuth,
  requireRole('VENDOR'),
  myController.getMyThing,
);

// app.ts (already mounted)
app.use('/api/vendor', vendorRoutes);
```

---

## Full API Reference

### Auth (`/api/auth`)

| Method | Path              | Description                                                                                        |
| ------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| POST   | `/sync`           | Upsert Auth0 user → returns `{id, email, name, role, status, mallId, vendorId, isProfileComplete}` |
| POST   | `/request-access` | Store `requestNote` for PENDING user                                                               |

### Public (`/api/public`)

| Method | Path                                 | Description                                            |
| ------ | ------------------------------------ | ------------------------------------------------------ |
| GET    | `/scan/:qrToken`                     | Unified QR resolver → `ScanResult` discriminated union |
| GET    | `/tables/:qrToken`                   | Legacy table by QR token                               |
| GET    | `/malls/:mallId/tables/:tableNumber` | Table by number in a mall                              |
| GET    | `/malls/:mallId/vendors`             | All active vendors in a mall                           |
| GET    | `/vendors/:vendorId`                 | Vendor profile (public)                                |
| GET    | `/vendors/:vendorId/active-menu`     | Active menu with items                                 |

### Orders (`/api/orders`) — no auth

| Method | Path            | Description                                  |
| ------ | --------------- | -------------------------------------------- |
| POST   | `/`             | Place order (rate-limited: 10/15 min per IP) |
| GET    | `/`             | Orders by `?sessionId=`                      |
| GET    | `/:orderId`     | Single order status                          |
| POST   | `/:orderId/pay` | Dummy payment `{ code: "1234" }`             |

### Vendor (`/api/vendor`) — VENDOR role

| Method     | Path                               | Description                            |
| ---------- | ---------------------------------- | -------------------------------------- |
| GET/PUT    | `/profile`                         | Vendor profile                         |
| GET/POST   | `/menus`                           | List / create menus                    |
| PUT/DELETE | `/menus/:menuId`                   | Update / delete menu                   |
| PATCH      | `/menus/:menuId/activate`          | Set as active menu                     |
| GET/POST   | `/menus/:menuId/items`             | List / create menu items               |
| PUT/DELETE | `/menu-items/:itemId`              | Update / delete item                   |
| PATCH      | `/menu-items/:itemId/availability` | Toggle item availability               |
| GET        | `/orders`                          | Vendor's orders (filter by `?status=`) |
| PATCH      | `/orders/:id/accept`               | Accept order                           |
| PATCH      | `/orders/:id/reject`               | Reject order                           |
| PATCH      | `/orders/:id/complete`             | Mark order complete                    |
| GET/POST   | `/tables`                          | List / create vendor tables            |
| PUT/DELETE | `/tables/:id`                      | Update / delete table                  |
| PATCH      | `/tables/:id/rotate-qr`            | Regenerate QR token                    |
| PATCH      | `/qr-token`                        | Rotate takeaway counter QR             |

### Admin (`/api/admin`) — ADMIN or SUPER_ADMIN

| Method     | Path                          | Description                     |
| ---------- | ----------------------------- | ------------------------------- |
| GET/POST   | `/tables`                     | Mall tables management          |
| PUT/DELETE | `/tables/:id`                 | Update / delete table           |
| PATCH      | `/tables/:id/rotate-qr`       | Regenerate QR                   |
| GET        | `/vendors`                    | All vendors in admin's mall     |
| GET        | `/vendors/:id`                | Vendor detail                   |
| POST       | `/vendors/invite`             | Invite new vendor (sends email) |
| POST       | `/vendors`                    | Create vendor directly          |
| PATCH      | `/vendors/:id`                | Update vendor                   |
| PATCH      | `/vendors/:id/reset-password` | Trigger password reset          |
| PATCH      | `/vendors/:id/deactivate`     | Deactivate vendor               |

### Super Admin (`/api/super-admin`) — SUPER_ADMIN only

| Method   | Path                           | Description             |
| -------- | ------------------------------ | ----------------------- |
| GET/POST | `/malls`                       | List / create malls     |
| POST     | `/malls/:mallId/admins`        | Assign admin to mall    |
| GET      | `/roles`                       | All available roles     |
| GET      | `/users`                       | All users               |
| PATCH    | `/users/:id/role`              | Change user's role      |
| GET      | `/access-requests`             | Pending access requests |
| PATCH    | `/access-requests/:id/approve` | Approve PENDING user    |
| PATCH    | `/access-requests/:id/reject`  | Reject PENDING user     |

### Uploads (`/api/uploads`) — VENDOR

| Method | Path               | Description                      |
| ------ | ------------------ | -------------------------------- |
| POST   | `/menu-item-image` | Upload image → returns `{ url }` |

---

## Prisma Usage

### Setup

```typescript
// lib/prisma.ts — use this singleton everywhere
import prisma from '../lib/prisma';
```

Client is created via `@prisma/adapter-pg` (PostgreSQL driver adapter), not the default connector.

### Schema Files

Models are defined in **split files** under `prisma/models/`:

```
prisma/models/
├── enums.prisma       ← Role, UserStatus, OrderStatus, PaymentStatus, VendorType, OrderType
├── users.prisma
├── vendor.prisma
├── mallAdmin.prisma
├── menu.prisma
├── menuItem.prisma
├── order.prisma
├── orderItem.prisma
├── table.prisma
└── posts.prisma
```

**Always edit the model file in `prisma/models/`, never edit `prisma/schema.prisma` directly.**

### Migrations

```bash
cd food-order-dashboard-be
npx prisma migrate dev --name describe_the_change
```

### Key Model Notes

- `price`, `unitPrice`, `totalAmount` are `Decimal(10,2)` — returned as strings in JS. Cast with `Number()` or `parseFloat()` when doing math.
- `Order.guestSessionId` links guest orders for tracking without auth.
- `Vendor.qrToken` is the takeaway counter QR — rotate with `PATCH /api/vendor/qr-token`.
- `Table.qrToken` is per-table — rotate with `PATCH /api/vendor/tables/:id/rotate-qr`.
- `Menu.isActive` — only one active menu per vendor at a time (enforced in controller).

### Typical Controller Pattern

```typescript
export const getMyResource = async (req: Request, res: Response) => {
  const { vendorId } = req.user!; // set by requireRole middleware
  const items = await prisma.menuItem.findMany({
    where: { menu: { vendorId: vendorId! } },
  });
  res.json(items);
};
```

Do not catch errors in controllers — let them propagate to the global `errorHandler` middleware (which logs and returns `{ message }`).

---

## Socket.IO (`services/socketService.ts`)

```typescript
import {
  emitNewOrder,
  emitOrderStatus,
  emitVendorOrderEvent,
} from '../services/socketService';

// Notify vendor's dashboard of a new incoming order:
emitNewOrder(vendorId, orderObject);

// Notify customer tracking page of status change:
emitOrderStatus(orderId, 'ACCEPTED');

// Notify vendor that an order status changed:
emitVendorOrderEvent(vendorId, orderId, 'ACCEPTED');
```

**Rooms:**

- `vendor:{vendorId}` — vendor joins via Socket.IO handshake auth
- `order:{orderId}` — customer joins by emitting `join:order`

**Events emitted to clients:**

- `order:new` → vendor room
- `order:status` → order room and vendor room

---

## Error Handling

All controller errors propagate to `middlewares/errorHandler.ts`:

```typescript
// In controllers, just throw or call next(err):
next(new Error('Something went wrong')); // → 500, { message: "Something went wrong" }

// For client errors, throw with status:
const err: any = new Error('Not found');
err.status = 404;
throw err;
```

The handler returns `{ message: string }` and logs ≥500 as `error`, <400 as `warn`.

---

## Logging

```typescript
import logger from '../lib/logger';

logger.info('Order placed', { orderId, vendorId });
logger.warn('Invalid attempt', { ip: req.ip });
logger.error('Unexpected error', { error: err.message });
```

Use structured logging (pass a metadata object as the second argument).

---

## File Uploads

```typescript
// In route definition:
import { upload } from '../middlewares/upload';
router.post(
  '/some-image',
  requireAuth,
  upload.single('image'),
  controller.handleUpload,
);

// In controller:
// req.file.filename → e.g. "1716000000000-logo.jpg"
const imageUrl = `/uploads/${req.file.filename}`;
```

Files are stored in `<cwd>/uploads/`. Served statically at `/uploads/<filename>`.  
Max size: **5 MB**. Allowed MIME types: `image/*`.

---

## Config (`config/config.ts`)

All environment variables are accessed through:

```typescript
import { config } from '../config/config';

config.port;
config.auth0Domain;
config.auth0Audience;
config.frontendUrl;
config.vendorInviteDevMode; // boolean — skips actual email in dev
```

**Never** `process.env.X` directly in controllers — always use `config`.

---

## Rate Limiting

- **Global:** 200 requests / 15 min per IP (applied in `app.ts`, excludes `/api/docs`)
- **Order placement:** 10 requests / 15 min per IP (applied directly on `POST /api/orders`)

---

## Security Checklist for New Endpoints

- [ ] Non-public route? → add `requireAuth`
- [ ] Role-restricted? → add `requireRole("VENDOR" | "ADMIN" | "SUPER_ADMIN")`
- [ ] Handles money/prices? → read amounts from DB, ignore `req.body` amounts
- [ ] File upload? → use Multer middleware (`upload.single("image")`)
- [ ] Sensitive action? → consider adding targeted rate limiting

---

## Planned: Razorpay Payment Integration

Current payment is a dummy (`POST /api/orders/:orderId/pay` with `{ code: "1234" }`).  
The upgrade plan is documented in the root `AGENTS.md` repo memory (payment-gateway-plan).  
Key files to change: `orderController.ts`, `orderRoutes.ts`, `prisma/models/order.prisma`.
