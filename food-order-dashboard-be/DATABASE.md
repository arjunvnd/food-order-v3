# Database Schema

PostgreSQL database powering the Mall Food Ordering platform.
Managed with Prisma 7. All IDs are UUIDs.

---

## Entity Relationship Overview

```
Mall ──< Table
Mall ──< Vendor ──< Menu ──< MenuItem
                          ↑
Mall ──< MallAdmin >── User
                       │
Vendor ──< Order >── OrderItem ──> MenuItem
           │
           └─> Table
```

---

## Tables

### `malls`

The top-level tenant. One mall = one physical location (or a standalone restaurant).

| Column    | Type      | Constraints   | Description              |
| --------- | --------- | ------------- | ------------------------ |
| id        | UUID      | PK            | Auto-generated           |
| name      | String    | NOT NULL      | Display name of the mall |
| address   | String    | NOT NULL      | Physical address         |
| logoUrl   | String    | nullable      | URL to logo image        |
| isActive  | Boolean   | default true  | Soft-disable a mall      |
| createdAt | Timestamp | default now() |                          |
| updatedAt | Timestamp | auto-updated  |                          |

---

### `users`

Authenticated users — only Vendors and Admins. Customers are guests (no account).

| Column    | Type      | Constraints      | Description                                |
| --------- | --------- | ---------------- | ------------------------------------------ |
| id        | UUID      | PK               |                                            |
| auth0Sub  | String    | UNIQUE, NOT NULL | Auth0 subject claim (`sub`) from JWT token |
| email     | String    | UNIQUE, NOT NULL |                                            |
| name      | String    | nullable         |                                            |
| role      | Role enum | default VENDOR   | `SUPER_ADMIN`, `ADMIN`, or `VENDOR`        |
| createdAt | Timestamp | default now()    |                                            |
| updatedAt | Timestamp | auto-updated     |                                            |

**Role descriptions:**

- `SUPER_ADMIN` — Platform owner. Can create malls and assign mall admins. Single seeded record.
- `ADMIN` — Mall manager. Can onboard vendors, manage tables within their mall.
- `VENDOR` — Restaurant operator. Manages menus, items, and accepts orders.

---

### `mall_admins`

Join table linking a `ADMIN` user to the mall they manage.

| Column | Type | Constraints             | Description |
| ------ | ---- | ----------------------- | ----------- |
| id     | UUID | PK                      |             |
| userId | UUID | FK → users.id, NOT NULL |             |
| mallId | UUID | FK → malls.id, NOT NULL |             |

**Unique constraint:** `(userId, mallId)` — a user can admin multiple malls, each pair is unique.

---

### `vendors`

A restaurant registered within a mall.

| Column         | Type      | Constraints             | Description                   |
| -------------- | --------- | ----------------------- | ----------------------------- |
| id             | UUID      | PK                      |                               |
| userId         | UUID      | FK → users.id, UNIQUE   | The vendor's login account    |
| mallId         | UUID      | FK → malls.id, NOT NULL |                               |
| restaurantName | String    | NOT NULL                |                               |
| description    | String    | nullable                |                               |
| logoUrl        | String    | nullable                |                               |
| isActive       | Boolean   | default true            | Soft-disable without deleting |
| createdAt      | Timestamp | default now()           |                               |
| updatedAt      | Timestamp | auto-updated            |                               |

---

### `tables`

Physical tables inside a mall. QR codes encode `mallId + tableNumber`.

| Column      | Type      | Constraints             | Description                       |
| ----------- | --------- | ----------------------- | --------------------------------- |
| id          | UUID      | PK                      |                                   |
| tableNumber | String    | NOT NULL                | Human-readable label, e.g. `"A5"` |
| mallId      | UUID      | FK → malls.id, NOT NULL |                                   |
| isActive    | Boolean   | default true            |                                   |
| createdAt   | Timestamp | default now()           |                                   |
| updatedAt   | Timestamp | auto-updated            |                                   |

**Unique constraint:** `(tableNumber, mallId)` — table numbers are unique within a mall.

---

### `menus`

A vendor can have multiple menus (e.g. Breakfast, Dinner, Weekend Special).
Only one menu per vendor can be active at a time.

| Column    | Type      | Constraints               | Description                           |
| --------- | --------- | ------------------------- | ------------------------------------- |
| id        | UUID      | PK                        |                                       |
| vendorId  | UUID      | FK → vendors.id, NOT NULL |                                       |
| name      | String    | NOT NULL                  |                                       |
| isActive  | Boolean   | default false             | The active menu is what customers see |
| createdAt | Timestamp | default now()             |                                       |
| updatedAt | Timestamp | auto-updated              |                                       |

---

### `menu_items`

Individual dishes available within a menu.

| Column      | Type          | Constraints             | Description                      |
| ----------- | ------------- | ----------------------- | -------------------------------- |
| id          | UUID          | PK                      |                                  |
| menuId      | UUID          | FK → menus.id, NOT NULL |                                  |
| name        | String        | NOT NULL                |                                  |
| price       | Decimal(10,2) | NOT NULL                | Price in local currency          |
| description | String        | nullable                |                                  |
| imageUrl    | String        | nullable                | Path returned by upload endpoint |
| isAvailable | Boolean       | default true            | Toggle without deleting the item |
| createdAt   | Timestamp     | default now()           |                                  |
| updatedAt   | Timestamp     | auto-updated            |                                  |

---

### `orders`

A guest customer's order at a specific table from a specific vendor.

| Column        | Type             | Constraints               | Description                                        |
| ------------- | ---------------- | ------------------------- | -------------------------------------------------- |
| id            | UUID             | PK                        | Returned to customer as their tracking token       |
| vendorId      | UUID             | FK → vendors.id, NOT NULL |                                                    |
| tableId       | UUID             | FK → tables.id, NOT NULL  |                                                    |
| guestName     | String           | nullable                  | Optional name customer provides                    |
| guestPhone    | String           | nullable                  | Optional contact number                            |
| status        | OrderStatus enum | default PENDING           | See lifecycle below                                |
| paymentStatus | PaymentStatus    | default UNPAID            | Set to PAID when customer submits code `1234`      |
| totalAmount   | Decimal(10,2)    | NOT NULL                  | Calculated at order time from item price snapshots |
| notes         | String           | nullable                  | Special instructions for the whole order           |
| createdAt     | Timestamp        | default now()             |                                                    |
| updatedAt     | Timestamp        | auto-updated              |                                                    |

#### Order Lifecycle

```
PENDING  ──► ACCEPTED ──► COMPLETED
   │              │
   └──► REJECTED  └─► (customer pays "1234" → paymentStatus = PAID)
```

| Status      | Description                             |
| ----------- | --------------------------------------- |
| `PENDING`   | Order placed, waiting for vendor to act |
| `ACCEPTED`  | Vendor accepted — customer can now pay  |
| `REJECTED`  | Vendor declined the order               |
| `COMPLETED` | Food is ready / delivered               |

| PaymentStatus | Description                                           |
| ------------- | ----------------------------------------------------- |
| `UNPAID`      | Default — payment not done yet                        |
| `PAID`        | Customer submitted dummy code `1234` after acceptance |

---

### `order_items`

Line items within an order. Prices are **snapshotted** at order time so menu price changes don't affect historical orders.

| Column     | Type          | Constraints              | Description                       |
| ---------- | ------------- | ------------------------ | --------------------------------- |
| id         | UUID          | PK                       |                                   |
| orderId    | UUID          | FK → orders.id, NOT NULL |                                   |
| menuItemId | UUID          | FK → menu_items.id       |                                   |
| quantity   | Int           | NOT NULL                 |                                   |
| unitPrice  | Decimal(10,2) | NOT NULL                 | Price at time of order (snapshot) |
| notes      | String        | nullable                 | Per-item special instructions     |
| createdAt  | Timestamp     | default now()            |                                   |

---

## Enums

```
Role          → SUPER_ADMIN | ADMIN | VENDOR
OrderStatus   → PENDING | ACCEPTED | REJECTED | COMPLETED
PaymentStatus → UNPAID | PAID
```

---

## Auth0 Integration

- All JWT tokens are issued by Auth0 and validated on the backend using `express-oauth2-jwt-bearer`.
- The `sub` claim in the JWT (`auth0Sub` in the `users` table) is the stable identifier linking Auth0 accounts to DB records.
- After first login, the frontend calls `POST /api/auth/sync` which upserts the user in the DB.
- Vendor accounts are created by mall admins via the backend, which calls the Auth0 Management API — vendors never self-register.
- Password resets for vendors are initiated by admins via `PATCH /api/admin/vendors/:id/reset-password`, which calls Auth0's password-change ticket API and returns a one-time reset URL.

---

## API Surface Summary

### Public (no auth)

| Method | Route                                         | Description                      |
| ------ | --------------------------------------------- | -------------------------------- |
| GET    | /api/public/malls/:mallId/tables/:tableNumber | Verify table is valid            |
| GET    | /api/public/malls/:mallId/vendors             | List active vendors in a mall    |
| GET    | /api/public/vendors/:vendorId                 | Vendor detail                    |
| GET    | /api/public/vendors/:vendorId/active-menu     | Active menu with available items |
| POST   | /api/orders                                   | Place a guest order              |
| GET    | /api/orders/:orderId                          | Poll order status                |
| POST   | /api/orders/:orderId/pay                      | Submit dummy payment code        |

### Auth (any logged-in user)

| Method | Route          | Description                          |
| ------ | -------------- | ------------------------------------ |
| POST   | /api/auth/sync | Upsert user record after Auth0 login |

### Vendor (role: VENDOR)

| Method | Route                                       | Description              |
| ------ | ------------------------------------------- | ------------------------ |
| GET    | /api/vendor/menus                           | List own menus           |
| POST   | /api/vendor/menus                           | Create menu              |
| PUT    | /api/vendor/menus/:menuId                   | Update menu name         |
| DELETE | /api/vendor/menus/:menuId                   | Delete menu              |
| PATCH  | /api/vendor/menus/:menuId/activate          | Set as active menu       |
| GET    | /api/vendor/menus/:menuId/items             | List items in a menu     |
| POST   | /api/vendor/menus/:menuId/items             | Add menu item            |
| PUT    | /api/vendor/menu-items/:itemId              | Update menu item         |
| DELETE | /api/vendor/menu-items/:itemId              | Delete menu item         |
| PATCH  | /api/vendor/menu-items/:itemId/availability | Toggle availability      |
| GET    | /api/vendor/orders                          | List orders (filterable) |
| PATCH  | /api/vendor/orders/:orderId/accept          | Accept order             |
| PATCH  | /api/vendor/orders/:orderId/reject          | Reject order             |
| PATCH  | /api/vendor/orders/:orderId/complete        | Mark order complete      |
| POST   | /api/uploads/menu-item-image                | Upload menu item image   |

### Admin (role: ADMIN)

| Method | Route                                       | Description                     |
| ------ | ------------------------------------------- | ------------------------------- |
| GET    | /api/admin/tables                           | List tables in admin's mall     |
| POST   | /api/admin/tables                           | Create table                    |
| PUT    | /api/admin/tables/:tableId                  | Update table                    |
| DELETE | /api/admin/tables/:tableId                  | Delete table                    |
| GET    | /api/admin/vendors                          | List vendors in admin's mall    |
| POST   | /api/admin/vendors                          | Onboard new vendor (Auth0 + DB) |
| PATCH  | /api/admin/vendors/:vendorId/reset-password | Trigger password reset          |
| PATCH  | /api/admin/vendors/:vendorId/deactivate     | Deactivate vendor               |

### Super Admin (role: SUPER_ADMIN)

| Method | Route                                 | Description                 |
| ------ | ------------------------------------- | --------------------------- |
| GET    | /api/super-admin/malls                | List all malls              |
| POST   | /api/super-admin/malls                | Create a new mall           |
| POST   | /api/super-admin/malls/:mallId/admins | Assign a user as mall admin |

---

## Real-time Events (Socket.io)

### Vendor client

- Connect with `{ auth: { vendorId: "..." } }` in handshake to auto-join `vendor:{vendorId}` room.
- **Receives:** `order:new` — payload is the full order object.

### Customer client

- Connect anonymously (no auth).
- Emit `join:order` with `orderId` string to subscribe to order updates.
- **Receives:** `order:status` — payload `{ orderId, status }` where status is `ACCEPTED`, `REJECTED`, `COMPLETED`, or `PAID`.
