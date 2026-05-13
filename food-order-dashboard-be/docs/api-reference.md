# API Quick Reference

Interactive docs with "Try it" available at **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**.

## Auth

| Method | Path             | Auth       | Description                           |
| ------ | ---------------- | ---------- | ------------------------------------- |
| `POST` | `/api/auth/sync` | Bearer JWT | Upsert user in DB, returns role + IDs |

## Public (no auth)

| Method | Path                                            | Auth | Description                          |
| ------ | ----------------------------------------------- | ---- | ------------------------------------ |
| `GET`  | `/api/public/tables/:qrToken`                   | None | Resolve QR token → table + mall info |
| `GET`  | `/api/public/malls/:mallId/tables/:tableNumber` | None | Look up table by number              |
| `GET`  | `/api/public/malls/:mallId/vendors`             | None | List active vendors in a mall        |
| `GET`  | `/api/public/vendors/:vendorId`                 | None | Get vendor details                   |
| `GET`  | `/api/public/vendors/:vendorId/active-menu`     | None | Get active menu + available items    |

## Orders (no auth)

| Method | Path                       | Auth | Description                                |
| ------ | -------------------------- | ---- | ------------------------------------------ |
| `POST` | `/api/orders`              | None | Place a new order (rate-limited: 10/15min) |
| `GET`  | `/api/orders?sessionId=`   | None | Get all orders for a guest session         |
| `GET`  | `/api/orders/:orderId`     | None | Get order status                           |
| `POST` | `/api/orders/:orderId/pay` | None | Pay for order with dummy code `1234`       |

## Vendor – Menus (VENDOR role)

| Method   | Path                                 | Auth   | Description        |
| -------- | ------------------------------------ | ------ | ------------------ |
| `GET`    | `/api/vendor/menus`                  | VENDOR | List menus         |
| `POST`   | `/api/vendor/menus`                  | VENDOR | Create menu        |
| `PUT`    | `/api/vendor/menus/:menuId`          | VENDOR | Update menu name   |
| `DELETE` | `/api/vendor/menus/:menuId`          | VENDOR | Delete menu        |
| `PATCH`  | `/api/vendor/menus/:menuId/activate` | VENDOR | Set as active menu |

## Vendor – Menu Items (VENDOR role)

| Method   | Path                                          | Auth   | Description         |
| -------- | --------------------------------------------- | ------ | ------------------- |
| `GET`    | `/api/vendor/menus/:menuId/items`             | VENDOR | List menu items     |
| `POST`   | `/api/vendor/menus/:menuId/items`             | VENDOR | Create menu item    |
| `PUT`    | `/api/vendor/menu-items/:itemId`              | VENDOR | Update menu item    |
| `DELETE` | `/api/vendor/menu-items/:itemId`              | VENDOR | Delete menu item    |
| `PATCH`  | `/api/vendor/menu-items/:itemId/availability` | VENDOR | Toggle availability |

## Vendor – Orders (VENDOR role)

| Method  | Path                                   | Auth   | Description                              |
| ------- | -------------------------------------- | ------ | ---------------------------------------- |
| `GET`   | `/api/vendor/orders`                   | VENDOR | List orders (optional `?status=` filter) |
| `PATCH` | `/api/vendor/orders/:orderId/accept`   | VENDOR | Accept order (PENDING → ACCEPTED)        |
| `PATCH` | `/api/vendor/orders/:orderId/reject`   | VENDOR | Reject order (PENDING → REJECTED)        |
| `PATCH` | `/api/vendor/orders/:orderId/complete` | VENDOR | Complete order (ACCEPTED → COMPLETED)    |

## Admin – Vendors (ADMIN or SUPER_ADMIN role)

| Method  | Path                                          | Auth              | Description                                           |
| ------- | --------------------------------------------- | ----------------- | ----------------------------------------------------- |
| `GET`   | `/api/admin/vendors`                          | ADMIN/SUPER_ADMIN | List vendors in admin's mall                          |
| `POST`  | `/api/admin/vendors/invite`                   | ADMIN/SUPER_ADMIN | Invite vendor (prod: email; dev: admin sets password) |
| `POST`  | `/api/admin/vendors`                          | ADMIN/SUPER_ADMIN | Onboard vendor with explicit temp password            |
| `PATCH` | `/api/admin/vendors/:vendorId/reset-password` | ADMIN/SUPER_ADMIN | Generate password reset link                          |
| `PATCH` | `/api/admin/vendors/:vendorId/deactivate`     | ADMIN/SUPER_ADMIN | Deactivate vendor                                     |

> `POST /api/admin/vendors/invite` body:
>
> - **Production:** `{ email, name, restaurantName }` — Auth0 sends a "Set your password" email
> - **Dev mode** (`VENDOR_INVITE_DEV_MODE=true`): `{ email, name, restaurantName, password }` — no email sent

## Admin – Tables (ADMIN or SUPER_ADMIN or SUPER_ADMIN role)

| Method   | Path                                   | Auth              | Description                            |
| -------- | -------------------------------------- | ----------------- | -------------------------------------- |
| `GET`    | `/api/admin/tables`                    | ADMIN/SUPER_ADMIN | List tables in admin's mall            |
| `POST`   | `/api/admin/tables`                    | ADMIN/SUPER_ADMIN | Create table (auto-generates QR token) |
| `PUT`    | `/api/admin/tables/:tableId`           | ADMIN/SUPER_ADMIN | Update table number / isActive         |
| `DELETE` | `/api/admin/tables/:tableId`           | ADMIN/SUPER_ADMIN | Delete table                           |
| `PATCH`  | `/api/admin/tables/:tableId/rotate-qr` | ADMIN/SUPER_ADMIN | Rotate QR token                        |

## Super Admin (SUPER_ADMIN role)

| Method | Path                                    | Auth        | Description          |
| ------ | --------------------------------------- | ----------- | -------------------- |
| `GET`  | `/api/super-admin/malls`                | SUPER_ADMIN | List all malls       |
| `POST` | `/api/super-admin/malls`                | SUPER_ADMIN | Create a mall        |
| `POST` | `/api/super-admin/malls/:mallId/admins` | SUPER_ADMIN | Assign admin to mall |

## Uploads (VENDOR role)

| Method | Path                           | Auth   | Description               |
| ------ | ------------------------------ | ------ | ------------------------- |
| `POST` | `/api/uploads/menu-item-image` | VENDOR | Upload image, returns URL |

---

## HTTP Status Codes Used

| Code  | Meaning                         |
| ----- | ------------------------------- |
| `200` | Success                         |
| `201` | Resource created                |
| `204` | Success, no content (DELETE)    |
| `400` | Bad request — validation error  |
| `401` | Missing or invalid JWT          |
| `403` | Valid JWT but insufficient role |
| `404` | Resource not found              |
| `429` | Rate limit exceeded             |
| `500` | Internal server error           |
