# Admin Workflow

Mall admins manage vendors and physical tables within their assigned mall. All admin routes require the `ADMIN` or `SUPER_ADMIN` role.

> An admin is scoped to exactly one mall via the `MallAdmin` join table. All queries automatically filter by `req.user.mallId`.
>
> **SUPER_ADMIN** users are also permitted on all admin routes. If a SUPER_ADMIN has no `MallAdmin` row, the backend falls back to the first mall in the database automatically (convenient for single-mall dev setups).

## Vendor Invite Flow

The recommended way to add a vendor. The flow differs depending on the `VENDOR_INVITE_DEV_MODE` feature flag.

### Production mode (`VENDOR_INVITE_DEV_MODE=false`)

```mermaid
flowchart TD
    A([Admin opens Invite Vendor page]) --> B[Fill in form:\nemail, name, restaurant name]

    B --> C["POST /api/admin/vendors/invite"]

    C --> D[Backend generates random temporary password]
    D --> E["mgmt.users.create()\nCreate Auth0 account with random password"]
    E -->|Auth0 error| ERR1[Show error — email may already exist]
    E -->|Success| F[Get auth0Sub from response]

    F --> G["POST /dbconnections/change_password\nAuth0 sends 'Set your password' email to vendor"]
    G --> H[Create User + Vendor records in DB]
    H --> I[201 — vendor created]
    I --> J([Vendor receives email and sets their password])
```

### Dev mode (`VENDOR_INVITE_DEV_MODE=true`)

No email is sent. The admin sets the vendor's password directly on the invite form — useful for testing with fake email addresses without consuming Auth0 email quota.

```mermaid
flowchart TD
    A([Admin opens Invite Vendor page]) --> B[Fill in form:\nemail, name, restaurant name,\ntemporary password + confirm password]

    B --> C["POST /api/admin/vendors/invite"]

    C --> D[Backend uses admin-supplied password directly]
    D --> E["mgmt.users.create()\nCreate Auth0 account with supplied password"]
    E -->|Auth0 error| ERR1[Show error — email may already exist]
    E -->|Success| F[Create User + Vendor records in DB]
    F --> G[201 — vendor created]
    G --> H([Admin shares password with vendor out-of-band])
```

### Feature Flag Configuration

| Environment variable               | File                           | Effect                                                  |
| ---------------------------------- | ------------------------------ | ------------------------------------------------------- |
| `VENDOR_INVITE_DEV_MODE=true`      | `food-order-dashboard-be/.env` | Backend skips change_password email, uses body password |
| `VITE_VENDOR_INVITE_DEV_MODE=true` | `food-order-v2/.env`           | Frontend shows password + confirm fields on invite form |

Both flags must be set consistently. For production, omit them or set to `false`.

### Prerequisites

The following must be configured for either invite flow to work:

- `AUTH0_MGMT_CLIENT_ID` — Client ID of the M2M app
- `AUTH0_MGMT_CLIENT_SECRET` — Client Secret of the M2M app
- The M2M app must have these Management API permissions:
  - `create:users`
  - `delete:users` (for compensating rollback on DB failure)
  - `create:user_tickets` (prod only — for reset-password)

---

## Vendor Onboard (alternative — direct with temp password)

`POST /api/admin/vendors` — an older endpoint that always takes a `temporaryPassword` in the body and creates the account immediately without sending any email. The Invite endpoint is preferred for new integrations.

---

## Password Reset Flow

When a vendor forgets their password or needs to set a new one:

```mermaid
sequenceDiagram
    participant ADM as Admin Dashboard
    participant BE as Backend
    participant A0M as Auth0 Management API
    participant V as Vendor

    ADM->>BE: PATCH /api/admin/vendors/:vendorId/reset-password
    BE->>BE: Look up vendor + user by vendorId
    BE->>A0M: tickets.changePassword({ user_id, result_url })
    A0M-->>BE: One-time reset URL (expires in 5 days by default)
    BE-->>ADM: { resetLink: "https://..." }
    ADM->>V: Share the reset link (email / WhatsApp / etc.)
    V->>A0M: Open reset link → set new password
    A0M->>V: Redirect to /login after success
```

---

## Table Management

```mermaid
flowchart TD
    A([Admin opens Tables page]) --> B[List tables — GET /api/admin/tables]

    B --> C{Action}

    C -->|Create new table| D["POST /api/admin/tables\n{ tableNumber: 'A-12' }\nServer generates unique QR token"]
    D --> E[Download / print QR code\nEncodes: https://app.com/qr/:token]
    E --> B

    C -->|Edit table number| F["PUT /api/admin/tables/:tableId\n{ tableNumber, isActive }"]
    F --> B

    C -->|Deactivate table| G["PUT /api/admin/tables/:tableId\n{ isActive: false }\nScanning deactivated QR returns 404"]
    G --> B

    C -->|Delete table| H["DELETE /api/admin/tables/:tableId\n204 No Content"]
    H --> B

    C -->|Rotate QR token| I["PATCH /api/admin/tables/:tableId/rotate-qr\nInvalidates all existing printed QR codes"]
    I --> J[New QR token generated]
    J --> K[Print and replace physical QR code]
    K --> B
```

### When to Rotate a QR Token

| Situation                                    | Action                              |
| -------------------------------------------- | ----------------------------------- |
| QR sticker is damaged / unreadable           | Rotate + reprint                    |
| QR code was photographed and shared publicly | Rotate immediately to prevent abuse |
| Table layout changed (new table numbers)     | Update `tableNumber` via PUT        |
| Table is temporarily out of service          | Set `isActive: false`               |
| Table is permanently removed                 | DELETE                              |

---

## Vendor Deactivation

Deactivating a vendor hides them from the customer-facing mall page. Their data is preserved — you can reactivate them by setting `isActive = true` directly in the database (there is no reactivation endpoint yet).

```mermaid
flowchart LR
    A["PATCH /api/admin/vendors/:vendorId/deactivate"]
    A --> B["prisma.vendor.update\n{ isActive: false }"]
    B --> C[Vendor hidden from GET /api/public/malls/:mallId/vendors]
    C --> D[Customers can no longer order from this vendor]
```
