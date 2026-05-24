# GitHub Copilot — Workspace Instructions

> For full per-project guidance see `food-order-v2/AGENTS.md` and `food-order-dashboard-be/AGENTS.md`.

---

## Monorepo Overview

```
order-apps/                        ← npm workspace root
├── food-order-dashboard-be/       ← Express 5 + Prisma 7 backend (port 3000)
├── food-order-v2/                 ← React 19 + Vite frontend (port 5173)
└── food-order-landing/            ← Next.js 16 marketing page (port 3001)
```

**Running the stack:**

```bash
npm run dev          # BE + FE concurrently (from root)
npm run dev:landing  # BE + landing page
```

---

## Tech Stack at a Glance

| Layer     | Tech                                                                                      |
| --------- | ----------------------------------------------------------------------------------------- |
| Frontend  | React 19, Vite, React Router 7, Redux Toolkit, MUI v7, Axios, Socket.IO client, Auth0     |
| Backend   | Express 5.2, Prisma 7 + PostgreSQL, Socket.IO, express-oauth2-jwt-bearer, Multer, Winston |
| Landing   | Next.js 16 (non-standard — read `food-order-landing/AGENTS.md` before touching it)        |
| Auth      | Auth0 (JWTs). Roles stored in DB, not Auth0 claims.                                       |
| Real-time | Socket.IO — see event constants in `food-order-v2/src/utils/constants.ts`                 |

---

## How the Projects Connect

- **Backend** is the single API server for both the main app and landing page.
- **Frontend** reads `VITE_API_BASE_URL` and `VITE_WS_URL` to reach the backend.
- **Auth flow**: Frontend gets Auth0 JWT → sends to `POST /api/auth/sync` → backend upserts user, returns `{ role, vendorId, mallId, status }` → stored in Redux `authSlice`.
- **In production**: Express serves the Vite build (`food-order-v2/dist`) as static files with SPA fallback.

---

## Environment Variables

### `food-order-dashboard-be/.env`

```
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://...
AUTH0_DOMAIN=...
AUTH0_AUDIENCE=...
AUTH0_CLIENT_ID=...
AUTH0_MGMT_CLIENT_ID=...
AUTH0_MGMT_CLIENT_SECRET=...
FRONTEND_URL=http://localhost:5173
VENDOR_INVITE_DEV_MODE=true
```

### `food-order-v2/.env`

```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
VITE_AUTH0_DOMAIN=...
VITE_AUTH0_CLIENT_ID=...
VITE_AUTH0_AUDIENCE=...
```

---

## Key Conventions Across the Codebase

- **TypeScript strict mode** everywhere (`noUnusedLocals`, `noUnusedParameters`).
- **Never** trust client-supplied prices — backend always re-fetches from DB.
- **Decimal fields** (`price`, `unitPrice`, `totalAmount`) come from Prisma as strings; the Axios interceptor in `api.ts` coerces them to `number` automatically.
- **Roles**: `SUPER_ADMIN | ADMIN | VENDOR` in the DB/backend. Frontend uses lowercase `super_admin | admin | vendor`.
- **Error responses** always return `{ message: string }` JSON via the global `errorHandler` middleware.
- **Image uploads** go to `food-order-dashboard-be/uploads/` (static served at `/uploads`). Max 5 MB, images only.

---

## Adding a New Feature — Cheat Sheet

1. **New backend endpoint**: add to the relevant route file → new controller function → wire middleware chain (`requireAuth` → `requireRole(...)` → handler).
2. **New frontend page**: add the page component under the correct `pages/` subfolder → register in `router/index.tsx` → wrap with `ProtectedRoute` + `RoleGuard` as needed.
3. **New API service call**: add to the relevant `services/*.ts` file in `food-order-v2/src/services/`.
4. **New Redux state**: create a slice under `store/slices/` → export reducer → register in `store/index.ts`.
5. **New Prisma model/field**: edit the model file in `food-order-dashboard-be/prisma/models/` → run `npx prisma migrate dev --name <name>`.

---

## Security Reminders

- Auth0 JWT verification happens via `requireAuth` middleware — never skip it on protected routes.
- `requireRole(...roles)` must come **after** `requireAuth` in every protected route.
- Payment amounts must always be read from the database in the backend controller — never from the request body.
- Rate limiting is applied globally (200 req/15 min) and extra-tight on order placement (10 req/15 min per IP).
