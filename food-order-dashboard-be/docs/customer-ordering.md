# Customer Ordering Flow

Customers are **unauthenticated** throughout the entire ordering journey. No login, no account creation required.

## End-to-End Journey

```mermaid
flowchart TD
    A([Customer scans QR code on table]) --> B

    B["GET /api/public/tables/:qrToken\nResolve token → tableId + mallId"]
    B -->|Invalid / inactive QR| ERR1[Show error page]
    B -->|Valid| C

    C["GET /api/public/malls/:mallId/vendors\nLoad restaurant list for the mall"]
    C --> D[TablePage — browse restaurants]
    D --> E[Customer selects a restaurant]

    E --> F["GET /api/public/vendors/:vendorId/active-menu\nLoad active menu + available items"]
    F -->|No active menu| ERR2[Show 'no menu available']
    F -->|Has menu| G[RestaurantMenuPage — browse items]

    G --> H[Customer adds items to cart\nRedux cartSlice — persisted in localStorage]
    H --> I{Continue browsing\nor checkout?}
    I -->|More items| G
    I -->|Checkout| J[CartPage — review cart]

    J --> K[CheckoutPage — enter name & phone optional]
    K --> L["POST /api/orders\nPlace order — prices snapshotted at server side"]
    L -->|Error| ERR3[Show error message]
    L -->|201 Created| M[OrderTrackingPage]

    M --> N{Real-time update\nvia Socket.io}
    N -->|order:status_updated| M

    M --> O{Order status?}
    O -->|PENDING| P[Waiting for vendor to accept]
    O -->|ACCEPTED| Q[Payment step — enter code 1234]
    O -->|REJECTED| R[Show rejection message]
    O -->|PAID| S[Preparing your food...]
    O -->|COMPLETED| T([Order complete!])

    Q --> U["POST /api/orders/:orderId/pay\n{ code: '1234' }"]
    U -->|Invalid code| ERR4[Show error]
    U -->|200 OK| S
```

## QR Code System

Each physical table has a unique QR code. The code encodes only a short random token (not the table ID directly), which provides two benefits:

1. **Security** — table IDs are not guessable or enumerable from the QR code
2. **Rotation** — if a code is lost or damaged, the admin can rotate the token (`PATCH /api/admin/tables/:tableId/rotate-qr`) and print a new QR code, immediately invalidating the old one

```mermaid
sequenceDiagram
    participant C as Customer Phone
    participant FE as Frontend
    participant BE as Backend

    C->>C: Camera app scans QR code
    C->>FE: Open https://app.com/qr/:token
    FE->>BE: GET /api/public/tables/:token
    BE-->>FE: { id: tableId, tableNumber: "A-12", mallId }
    FE->>FE: Store mallId + tableId in Redux cartSlice
    FE->>C: Redirect to /mall/:mallId/table/:tableId
```

## Cart Behaviour

- Cart state lives in **Redux** (`cartSlice`) and is **persisted to localStorage**
- When a customer adds an item from a **different vendor**, the cart is automatically cleared (can't mix vendors in one order)
- Cart persists across page refreshes — the customer can close the browser and return to find their cart intact
- Cart is cleared after a successful order is placed

## Order Placement Validation (Backend)

The backend validates every order strictly to prevent abuse:

```mermaid
flowchart LR
    A[POST /api/orders] --> B{Table exists\n& isActive?}
    B -->|No| F1[400 Invalid table]
    B -->|Yes| C{Vendor exists\n& isActive?}
    C -->|No| F2[400 Vendor not found]
    C -->|Yes| D{All items available\nin vendor's active menu?}
    D -->|No| F3[400 Items unavailable]
    D -->|Yes| E[Snapshot prices from DB\nCalculate total\nCreate Order + OrderItems]
    E --> G[Emit vendor:new_order via Socket.io]
    G --> H[201 Order created]
```

> **Price snapshotting:** Prices are read from the database at order creation time, not from the client payload. A customer cannot manipulate item prices by modifying the request body.

## Payment (Dummy)

The current payment implementation is a placeholder:

- The vendor accepts the order → status becomes `ACCEPTED`
- Customer is shown a code entry field on the tracking page
- Customer enters `1234` → status becomes `PAID`
- Vendor marks order `COMPLETED` → status becomes `COMPLETED`

This is designed to be replaced with a real payment gateway (e.g. Stripe) in the future.
