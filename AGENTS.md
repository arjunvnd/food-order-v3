# Order-Apps — Monorepo Agent Guide

This is a food-ordering SaaS platform for malls and standalone restaurants. Guests scan QR codes to browse menus and place orders; vendors manage their menu and incoming orders through a dashboard; admins manage vendors and tables.

> **Deep-dive guides:** `food-order-v2/AGENTS.md` (frontend) and `food-order-dashboard-be/AGENTS.md` (backend).

---

## Project Map

```
order-apps/                         ← npm workspaces root
├── package.json                    ← workspaces: [be, v2, landing]; concurrently scripts
├── food-order-dashboard-be/        ← Express 5 + Prisma 7 backend          :3000
├── food-order-v2/                  ← React 19 + Vite SPA (main app)        :5173
└── food-order-landing/             ← Next.js 16 marketing site             :3001
```

**Dev commands (from root):**

```bash
npm run dev           # backend + frontend (food-order-v2)
npm run dev:landing   # backend + landing page
```

---

## Tech Stack

| Project                   | Key Tech                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| `food-order-v2`           | React 19, Vite, React Router 7, Redux Toolkit, MUI v7, Axios, Socket.IO client, Auth0         |
| `food-order-dashboard-be` | Express 5.2, Prisma 7 (PostgreSQL), Socket.IO, Auth0 JWT, Multer, Winston, express-rate-limit |
| `food-order-landing`      | Next.js 16 (non-standard build), Tailwind CSS v4, Resend (email)                              |

---

## How the Three Projects Interact

```
Browser (food-order-v2 :5173)
       │  HTTP (Axios, VITE_API_BASE_URL)
       │  WebSocket (socket.io-client, VITE_WS_URL)
       ▼
Backend (food-order-dashboard-be :3000)
       │  Prisma 7
       ▼
PostgreSQL

Landing page (food-order-landing :3001)
       │  HTTP → Backend for contact form & data
       ▼
Backend (food-order-dashboard-be :3000)
```

**In production:** Express on port 3000 serves both the API **and** the React `dist/` as static files with SPA fallback. No separate frontend server.

---

## Auth Architecture

1. Frontend authenticates via Auth0 (`@auth0/auth0-react`).
2. `POST /api/auth/sync` with the Auth0 JWT → backend upserts the user in Postgres and returns `{ role, vendorId, mallId, status }`.
3. Role and profile data is stored in **Redux `authSlice`**, not in Auth0 claims.
4. All protected backend routes require the `Authorization: Bearer <token>` header.
5. **Roles (DB/backend):** `SUPER_ADMIN | ADMIN | VENDOR`. **Roles (frontend Redux):** lowercase `super_admin | admin | vendor`.
6. New self-registrations get `status: PENDING` and must be approved by a super admin.

---

## Domain Model (high level)

```
Mall ──< Table
 │
 └──< Vendor ──< Menu ──< MenuItem
                  │
                  └──< Order ──< OrderItem
```

- A **vendor** can be `MALL_VENDOR` (belongs to a mall), `STANDALONE`, or `TAKEAWAY`.
- An **order** has `status: PENDING → ACCEPTED → COMPLETED | REJECTED` and `paymentStatus: UNPAID → PAID`.
- **DINE_IN** orders require a `tableId`; **TAKEAWAY** does not.
- Payment is currently a dummy placeholder (code `"1234"`). See `food-order-dashboard-be/AGENTS.md` for the Razorpay upgrade plan.

---

## Order Flow (end-to-end)

```
QR scan → TablePage → RestaurantMenuPage → CartPage → CheckoutPage
       → POST /api/orders → OrderTrackingPage (WebSocket)
       → Vendor sees "order:new" → Accept/Reject
       → PaymentPage → POST /api/orders/:id/pay
       → Vendor marks COMPLETED
```

---

## Key Conventions

| Rule                    | Detail                                                                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **TypeScript strict**   | `noUnusedLocals`, `noUnusedParameters` enabled everywhere                                                                               |
| **Prices from DB only** | Backend always re-fetches prices; never trust request body amounts                                                                      |
| **Decimal coercion**    | Prisma returns `Decimal` fields as strings; Axios interceptor in `api.ts` auto-converts `price`, `unitPrice`, `totalAmount` to `number` |
| **Error shape**         | All API errors return `{ message: string }`                                                                                             |
| **Image uploads**       | Stored in `food-order-dashboard-be/uploads/`; max 5 MB, images only                                                                     |
| **Prisma models**       | Defined in `food-order-dashboard-be/prisma/models/*.prisma` (split files), not a single schema                                          |
| **Socket events**       | Constants live in `food-order-v2/src/utils/constants.ts` (`WS_EVENTS`)                                                                  |

---

## Security Rules (never break these)

- `requireAuth` must guard **every** non-public backend route.
- `requireRole(...)` must come **after** `requireAuth` in the middleware chain.
- Payment amounts must be read from the DB server-side — never from `req.body`.
- Rate limiting: 200 req/15 min globally; 10 req/15 min on `POST /api/orders`.
