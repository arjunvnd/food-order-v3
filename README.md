# MallBite — Food Order Platform

A multi-tenant food ordering system for shopping malls. Customers scan a QR code at their table, browse vendor menus, and place orders in real time.

## Architecture

| App         | Path                       | Port | Purpose                       |
| ----------- | -------------------------- | ---- | ----------------------------- |
| Backend API | `food-order-dashboard-be/` | 3000 | Express + Prisma + PostgreSQL |
| Frontend    | `food-order-v2/`           | 5173 | React + Vite + Auth0          |

---

## Prerequisites

Make sure these are installed before starting:

- [Node.js](https://nodejs.org/) v20+
- [PostgreSQL](https://www.postgresql.org/download/) v15+ running locally
- An [Auth0](https://auth0.com) account (free tier is fine)

---

## 1. Auth0 Setup

You need three things configured in your Auth0 tenant before the app will work.

### 1a. Create an API

1. Auth0 Dashboard → **Applications → APIs → Create API**
2. Name: `Food Order API`
3. Identifier (Audience): `https://food-order-app/api`
4. Leave signing algorithm as RS256 → **Create**

### 1b. Create a Single Page Application

1. Auth0 Dashboard → **Applications → Applications → Create Application**
2. Name: `Food Order App`, Type: **Single Page Application** → **Create**
3. Go to **Settings** and fill in:
   - **Allowed Callback URLs:** `http://localhost:5173/auth/callback`
   - **Allowed Logout URLs:** `http://localhost:5173`
   - **Allowed Web Origins:** `http://localhost:5173`
4. Save Changes
5. Note down: **Domain** and **Client ID**

### 1c. Create a Machine-to-Machine Application (for vendor invites)

1. Auth0 Dashboard → **Applications → Applications → Create Application**
2. Name: `Food Order Backend`, Type: **Machine to Machine** → **Create**
3. Authorize it against **Auth0 Management API**
4. Select these scopes: `create:users`, `read:users`, `create:user_tickets` → **Authorize**
5. Go to **Settings** and note down: **Client ID** and **Client Secret**

---

## 2. Backend Setup

### 2a. Install dependencies

```bash
cd food-order-dashboard-be
npm install
```

### 2b. Create the database

Open `psql` (or pgAdmin) and run:

```sql
CREATE DATABASE "food-dashboard";
```

### 2c. Configure environment variables

Create `food-order-dashboard-be/.env`:

```env
PORT=3000
NODE_ENV=development

DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/food-dashboard"

# Auth0 — JWT validation (from your SPA app settings)
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://food-order-app/api

# Auth0 — SPA Client ID (used to trigger password-set emails)
AUTH0_CLIENT_ID=your_spa_client_id

# Auth0 — Management API (from your M2M app settings)
AUTH0_MGMT_CLIENT_ID=your_m2m_client_id
AUTH0_MGMT_CLIENT_SECRET=your_m2m_client_secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### 2d. Run database migrations

```bash
npx prisma migrate deploy
```

### 2e. Generate Prisma client

```bash
npx prisma generate
```

### 2f. Start the backend

```bash
npm run dev
```

The API will be available at `http://localhost:3000`.  
Interactive API docs are at `http://localhost:3000/api/docs`.

---

## 3. Frontend Setup

### 3a. Install dependencies

```bash
cd food-order-v2
npm install
```

### 3b. Configure environment variables

Create `food-order-v2/.env`:

```env
# Auth0 (from your SPA app settings — same values as backend)
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your_spa_client_id
VITE_AUTH0_AUDIENCE=https://food-order-app/api

# Backend
VITE_API_BASE_URL=http://localhost:3000/api

# WebSocket
VITE_WS_URL=ws://localhost:3000
```

### 3c. Start the frontend

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 4. First-Time Bootstrap (Creating the First Super Admin)

This only needs to be done once on a fresh database.

### Step 1 — Log in to the app

With both servers running, open `http://localhost:5173` and log in with your Auth0 account. This creates your user record in the database. You will land on a vendor or unauthorized page — that's expected at this point.

### Step 2 — Run the seed script

Open a new terminal in `food-order-dashboard-be/` and run:

```powershell
# Windows (PowerShell)
$env:SEED_SUPER_ADMIN_EMAIL="you@example.com"
$env:SEED_MALL_NAME="Your Mall Name"
$env:SEED_MALL_ADDRESS="123 Mall Street"
npx prisma db seed
```

```bash
# macOS / Linux
SEED_SUPER_ADMIN_EMAIL="you@example.com" \
SEED_MALL_NAME="Your Mall Name" \
SEED_MALL_ADDRESS="123 Mall Street" \
npx prisma db seed
```

Expected output:

```
✅  Promoted you@example.com to SUPER_ADMIN
✅  Created mall "Your Mall Name" (id: abc-123-...)
```

Note the **mall id** from the output — you'll need it in the next step.

### Step 3 — Log out and log back in

Your role is now `SUPER_ADMIN`. After logging back in you'll be redirected to the admin dashboard.

### Step 4 — Assign a Mall Admin

To assign someone (including yourself) as the admin of a mall, call:

```
POST http://localhost:3000/api/super-admin/malls/:mallId/admins
Authorization: Bearer <your JWT>

{
  "auth0Sub": "auth0|xxxxxxxxxxxxxxxx",
  "email": "admin@example.com",
  "name": "Admin Name"
}
```

You can get your `auth0Sub` from:

- Auth0 Dashboard → **User Management → Users** → click your user → copy **user_id**
- Or open browser DevTools → Network tab → find the `/auth/sync` request → look at the JWT payload (the `sub` field)

You can test this from the API docs at `http://localhost:3000/api/docs`.

### Step 5 — Log out and log back in as Admin

After re-login you'll see the admin dashboard with the Vendors section.

---

## 5. Inviting Vendors

Once you're logged in as an Admin:

1. Navigate to **Vendors → Invite Vendor**
2. Fill in: Vendor's Full Name, Restaurant Name, Email
3. Click **Send Invitation**
4. The vendor receives an Auth0 email with a link to set their password
5. They click the link → set password → log in → land on a **Complete Your Profile** page
6. They fill in their restaurant details → save → redirected to the vendor dashboard

---

## 6. Roles Overview

| Role          | Access                        | How to obtain                      |
| ------------- | ----------------------------- | ---------------------------------- |
| `SUPER_ADMIN` | Create malls, assign admins   | Seed script (one-time setup)       |
| `ADMIN`       | Invite vendors, manage tables | Assigned by SUPER_ADMIN via API    |
| `VENDOR`      | Manage menus, handle orders   | Invited by ADMIN via the dashboard |

---

## 7. Development Commands

### Backend (`food-order-dashboard-be/`)

| Command                                | Description                                   |
| -------------------------------------- | --------------------------------------------- |
| `npm run dev`                          | Start with hot-reload (ts-node + nodemon)     |
| `npm run build`                        | Compile TypeScript to `dist/`                 |
| `npm start`                            | Run compiled build                            |
| `npx prisma migrate dev --name <name>` | Create a new migration                        |
| `npx prisma migrate deploy`            | Apply all pending migrations                  |
| `npx prisma studio`                    | Open Prisma database browser                  |
| `npx prisma generate`                  | Regenerate Prisma client after schema changes |
| `npx prisma db seed`                   | Run the bootstrap seed script                 |

### Frontend (`food-order-v2/`)

| Command         | Description           |
| --------------- | --------------------- |
| `npm run dev`   | Start Vite dev server |
| `npm run build` | Production build      |
| `npm run lint`  | Run ESLint            |

---

## 8. Useful URLs (local development)

| URL                              | Description                             |
| -------------------------------- | --------------------------------------- |
| `http://localhost:5173`          | Frontend app                            |
| `http://localhost:3000/api/docs` | Interactive API docs (Scalar)           |
| `http://localhost:5555`          | Prisma Studio (run `npx prisma studio`) |

---

## 9. Troubleshooting

**"Missing sub claim in token" on login**  
→ Check that `AUTH0_DOMAIN` and `AUTH0_AUDIENCE` in the backend `.env` match exactly what's configured in Auth0. No trailing slashes on the domain.

**Invite vendor fails with 500**  
→ `AUTH0_MGMT_CLIENT_ID` / `AUTH0_MGMT_CLIENT_SECRET` are missing or incorrect. Check your M2M app in Auth0 and verify the scopes include `create:users`.

**Vendor invite email never arrives**  
→ Check Auth0 Dashboard → **Branding → Email Templates → Change Password** is enabled. Also check spam.

**Role not updating after seed / admin assignment**  
→ Log out completely and log back in. The role is read from the database on each login via `/auth/sync`.

**Port 3000 already in use**

```powershell
# Windows
$proc = Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess -First 1
Stop-Process -Id $proc -Force
```

```bash
# macOS / Linux
lsof -ti:3000 | xargs kill -9
```

**Prisma migration drift error**  
→ If you see "drift detected" on a fresh dev setup, run `npx prisma migrate reset --force` to wipe and reapply all migrations cleanly. **This deletes all data** — only use in development.
