# MallBite Backend — Documentation

MallBite is a food-ordering platform for shopping malls. Customers scan a QR code at their table, browse vendor menus, place orders, and track status in real-time without creating an account.

## Interactive API Reference

Start the server and open **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)** to explore and test all endpoints with the Scalar UI.

## Tech Stack

| Layer          | Technology                |
| -------------- | ------------------------- |
| Runtime        | Node.js + TypeScript      |
| Framework      | Express 5                 |
| Database       | PostgreSQL via Prisma ORM |
| Authentication | Auth0 (JWT RS256)         |
| Real-time      | Socket.io                 |
| File uploads   | Multer                    |
| Rate limiting  | express-rate-limit        |
| API docs       | Scalar + OpenAPI 3.0      |

## Documentation Index

| Document                                             | Description                               |
| ---------------------------------------------------- | ----------------------------------------- |
| [architecture.md](./architecture.md)                 | System architecture diagram               |
| [auth-flow.md](./auth-flow.md)                       | Auth0 login → sync → role routing flow    |
| [customer-ordering.md](./customer-ordering.md)       | End-to-end customer ordering journey      |
| [vendor-workflow.md](./vendor-workflow.md)           | Vendor menu management + order lifecycle  |
| [admin-workflow.md](./admin-workflow.md)             | Admin vendor onboarding, tables, QR codes |
| [super-admin-workflow.md](./super-admin-workflow.md) | Mall setup and admin assignment           |
| [api-reference.md](./api-reference.md)               | Quick-reference table of all 35 endpoints |

## Project Structure

```
food-order-dashboard-be/
├── src/
│   ├── app.ts                 # Express app setup, middleware, routes
│   ├── server.ts              # HTTP server + Socket.io bootstrap
│   ├── config/config.ts       # Environment variable config
│   ├── controllers/           # Request handlers (one file per feature)
│   ├── middlewares/
│   │   ├── auth.ts            # requireAuth — JWT validation via Auth0
│   │   ├── rbac.ts            # requireRole — DB role check + req.user
│   │   ├── upload.ts          # Multer file upload config
│   │   └── errorHandler.ts    # Global error handler
│   ├── routes/                # Express routers (one file per feature)
│   ├── services/
│   │   └── socketService.ts   # Socket.io event emitters
│   ├── docs/
│   │   └── openapi.ts         # Full OpenAPI 3.0 spec
│   └── lib/
│       └── prisma.ts          # Prisma client singleton
├── prisma/
│   ├── schema.prisma          # Composed from models/
│   └── models/                # Split Prisma model files
└── docs/                      # This documentation folder
```

## Environment Variables

| Variable                   | Required           | Description                                |
| -------------------------- | ------------------ | ------------------------------------------ |
| `PORT`                     | No                 | Server port (default: 3000)                |
| `NODE_ENV`                 | No                 | `development` or `production`              |
| `DATABASE_URL`             | **Yes**            | PostgreSQL connection string               |
| `AUTH0_DOMAIN`             | **Yes**            | Auth0 tenant domain                        |
| `AUTH0_AUDIENCE`           | **Yes**            | Auth0 API identifier (must match frontend) |
| `AUTH0_MGMT_CLIENT_ID`     | For vendor invites | M2M app Client ID                          |
| `AUTH0_MGMT_CLIENT_SECRET` | For vendor invites | M2M app Client Secret                      |
| `FRONTEND_URL`             | **Yes**            | Frontend origin for CORS                   |

## Running Locally

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Start development server (with hot reload)
npm run dev

# Build for production
npm run build
npm start
```
