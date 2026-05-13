import type { OpenAPIV3 } from 'openapi-types';

export const openapiSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'MallBite API',
    version: '1.0.0',
    description: `
## Overview
MallBite is a food-ordering platform for shopping malls. Customers scan a QR code at their table, browse vendor menus, place orders, and track status in real-time. Vendors manage menus and orders via a dashboard. Mall admins manage vendors and tables. Super admins manage malls and assign admins.

## Authentication
All protected endpoints require a Bearer JWT issued by Auth0. After logging in via Auth0, the frontend calls \`POST /api/auth/sync\` to create/upsert the user record in the database and obtain the role.

Include the token in every protected request:
\`\`\`
Authorization: Bearer <access_token>
\`\`\`

## Roles
| Role | Access |
|---|---|
| \`SUPER_ADMIN\` | Manage malls, assign admins |
| \`ADMIN\` | Manage vendors & tables within their mall |
| \`VENDOR\` | Manage own menus, menu items, and orders |
| *(unauthenticated)* | Public routes + order placement/tracking |
    `.trim(),
    contact: {
      name: 'MallBite',
    },
  },
  servers: [{ url: 'http://localhost:3000', description: 'Local development' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Auth0-issued JWT access token',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Resource not found' },
        },
        required: ['message'],
      },
      Mall: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Westfield Mall' },
          address: { type: 'string', example: '123 Main St' },
          logoUrl: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Table: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          mallId: { type: 'string', format: 'uuid' },
          tableNumber: { type: 'string', example: 'A-12' },
          qrToken: { type: 'string', example: 'abc123xyz' },
          isActive: { type: 'boolean' },
        },
      },
      Vendor: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          mallId: { type: 'string', format: 'uuid' },
          restaurantName: { type: 'string', example: 'Spice Garden' },
          description: { type: 'string', nullable: true },
          logoUrl: { type: 'string', nullable: true },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      VendorWithUser: {
        allOf: [
          { $ref: '#/components/schemas/Vendor' },
          {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  name: { type: 'string', nullable: true },
                },
              },
            },
          },
        ],
      },
      Menu: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          vendorId: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Lunch Menu' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      MenuItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          menuId: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Butter Chicken' },
          description: { type: 'string', nullable: true },
          price: { type: 'number', format: 'decimal', example: 12.99 },
          imageUrl: { type: 'string', nullable: true },
          isAvailable: { type: 'boolean' },
        },
      },
      OrderItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          menuItemId: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer', minimum: 1 },
          unitPrice: { type: 'number', format: 'decimal' },
          notes: { type: 'string', nullable: true },
          menuItem: {
            type: 'object',
            properties: { name: { type: 'string' } },
          },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          vendorId: { type: 'string', format: 'uuid' },
          tableId: { type: 'string', format: 'uuid' },
          guestName: { type: 'string', nullable: true },
          guestPhone: { type: 'string', nullable: true },
          guestSessionId: { type: 'string', nullable: true },
          notes: { type: 'string', nullable: true },
          totalAmount: { type: 'number', format: 'decimal' },
          status: {
            type: 'string',
            enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'],
          },
          paymentStatus: {
            type: 'string',
            enum: ['UNPAID', 'PAID'],
          },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/OrderItem' },
          },
          vendor: {
            type: 'object',
            properties: { restaurantName: { type: 'string' } },
          },
          table: {
            type: 'object',
            properties: { tableNumber: { type: 'string' } },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          auth0Sub: { type: 'string', example: 'auth0|abc123' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string', nullable: true },
          role: {
            type: 'string',
            enum: ['SUPER_ADMIN', 'ADMIN', 'VENDOR'],
          },
          mallId: { type: 'string', format: 'uuid', nullable: true },
          vendorId: { type: 'string', format: 'uuid', nullable: true },
        },
      },
    },
  },
  paths: {
    // ─── Auth ────────────────────────────────────────────────────────────────
    '/api/auth/sync': {
      post: {
        tags: ['Auth'],
        summary: 'Sync authenticated user to database',
        description:
          "Called by the frontend once after a successful Auth0 login. Upserts the user record using the `sub` claim from the JWT. Returns the user's role and associated IDs (mallId / vendorId) which the frontend uses for routing.",
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User synced successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
                example: {
                  id: 'b3e1c2d4-...',
                  email: 'vendor@example.com',
                  name: 'John Smith',
                  role: 'VENDOR',
                  mallId: null,
                  vendorId: 'a1b2c3d4-...',
                },
              },
            },
          },
          '400': {
            description: 'Missing sub claim in token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          '401': { description: 'Missing or invalid JWT' },
        },
      },
    },

    // ─── Public ──────────────────────────────────────────────────────────────
    '/api/public/tables/{qrToken}': {
      get: {
        tags: ['Public'],
        summary: 'Resolve QR code token to table info',
        description:
          'Primary QR scan entry point. The QR code printed on each physical table encodes only the `qrToken`. This endpoint translates it to the table ID, number, and mall ID needed to start the customer journey.',
        parameters: [
          {
            name: 'qrToken',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: 'tok_abc123',
          },
        ],
        responses: {
          '200': {
            description: 'Table resolved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    tableNumber: { type: 'string' },
                    mallId: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
          '404': { description: 'Invalid or inactive QR code' },
        },
      },
    },
    '/api/public/malls/{mallId}/tables/{tableNumber}': {
      get: {
        tags: ['Public'],
        summary: 'Look up a table by number within a mall',
        parameters: [
          {
            name: 'mallId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'tableNumber',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            example: 'A-12',
          },
        ],
        responses: {
          '200': {
            description: 'Table found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Table' },
              },
            },
          },
          '404': { description: 'Table not found' },
        },
      },
    },
    '/api/public/malls/{mallId}/vendors': {
      get: {
        tags: ['Public'],
        summary: 'List all active vendors in a mall',
        description:
          'Returns active vendors for the table page restaurant list. No authentication required.',
        parameters: [
          {
            name: 'mallId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'List of active vendors',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Vendor' },
                },
              },
            },
          },
        },
      },
    },
    '/api/public/vendors/{vendorId}': {
      get: {
        tags: ['Public'],
        summary: 'Get vendor details',
        parameters: [
          {
            name: 'vendorId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Vendor details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Vendor' },
              },
            },
          },
          '404': { description: 'Vendor not found' },
        },
      },
    },
    '/api/public/vendors/{vendorId}/active-menu': {
      get: {
        tags: ['Public'],
        summary: "Get vendor's active menu with all available items",
        description:
          "Returns the vendor's currently active menu along with all available menu items. Used by the customer restaurant menu page.",
        parameters: [
          {
            name: 'vendorId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Active menu with items',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Menu' },
                    {
                      type: 'object',
                      properties: {
                        items: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/MenuItem' },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '404': { description: 'No active menu found for this vendor' },
        },
      },
    },

    // ─── Orders ──────────────────────────────────────────────────────────────
    '/api/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Place a new order',
        description:
          "Guest checkout — no authentication required. Validates all items belong to the same vendor's active menu and snapshots prices at order time. Rate-limited to 10 requests per 15 minutes per IP.",
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['tableId', 'vendorId', 'items'],
                properties: {
                  tableId: { type: 'string', format: 'uuid' },
                  vendorId: { type: 'string', format: 'uuid' },
                  items: {
                    type: 'array',
                    minItems: 1,
                    items: {
                      type: 'object',
                      required: ['menuItemId', 'quantity'],
                      properties: {
                        menuItemId: { type: 'string', format: 'uuid' },
                        quantity: { type: 'integer', minimum: 1 },
                        notes: { type: 'string' },
                      },
                    },
                  },
                  guestName: { type: 'string' },
                  guestPhone: { type: 'string' },
                  guestSessionId: {
                    type: 'string',
                    description: 'LocalStorage UUID used to group guest orders',
                  },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Order placed successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Order' },
              },
            },
          },
          '400': {
            description: 'Invalid table, inactive vendor, or unavailable items',
          },
          '429': { description: 'Rate limit exceeded' },
        },
      },
      get: {
        tags: ['Orders'],
        summary: 'Get all orders for a guest session',
        description:
          'Returns all orders placed in the current guest browser session. Used to show order history to the customer.',
        parameters: [
          {
            name: 'sessionId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: 'The guest session UUID stored in localStorage',
          },
        ],
        responses: {
          '200': {
            description: 'List of orders',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Order' },
                },
              },
            },
          },
          '400': { description: 'sessionId query param is required' },
        },
      },
    },
    '/api/orders/{orderId}': {
      get: {
        tags: ['Orders'],
        summary: 'Get order status',
        description:
          'Public endpoint polled by the customer order-tracking page. Returns full order details including current status.',
        parameters: [
          {
            name: 'orderId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Order details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Order' },
              },
            },
          },
          '404': { description: 'Order not found' },
        },
      },
    },
    '/api/orders/{orderId}/pay': {
      post: {
        tags: ['Orders'],
        summary: 'Pay for an order (dummy payment)',
        description:
          'Customer submits payment code `1234` after the vendor accepts the order. Marks `paymentStatus` as `PAID` and emits a real-time Socket.io event to update all listeners.',
        parameters: [
          {
            name: 'orderId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['code'],
                properties: {
                  code: {
                    type: 'string',
                    example: '1234',
                    description: 'Dummy payment code — always "1234"',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Payment accepted, order marked as PAID',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Order' },
              },
            },
          },
          '400': {
            description:
              'Order not in ACCEPTED state, already paid, or wrong code',
          },
          '404': { description: 'Order not found' },
        },
      },
    },

    // ─── Vendor – Menus ──────────────────────────────────────────────────────
    '/api/vendor/menus': {
      get: {
        tags: ['Vendor – Menus'],
        summary: "List the vendor's menus",
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Array of menus',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Menu' },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden — VENDOR role required' },
        },
      },
      post: {
        tags: ['Vendor – Menus'],
        summary: 'Create a new menu',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: { name: { type: 'string', example: 'Lunch Menu' } },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Menu created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Menu' },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/vendor/menus/{menuId}': {
      put: {
        tags: ['Vendor – Menus'],
        summary: 'Update menu name',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'menuId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: { name: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Menu updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Menu' },
              },
            },
          },
          '404': { description: 'Menu not found' },
        },
      },
      delete: {
        tags: ['Vendor – Menus'],
        summary: 'Delete a menu',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'menuId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '204': { description: 'Menu deleted' },
          '404': { description: 'Menu not found' },
        },
      },
    },
    '/api/vendor/menus/{menuId}/activate': {
      patch: {
        tags: ['Vendor – Menus'],
        summary: 'Set a menu as the active menu',
        description:
          'Atomically deactivates all other menus for this vendor and activates the target menu. Only one menu can be active at a time — the active menu is served to customers.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'menuId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Menu activated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Menu' },
              },
            },
          },
          '404': { description: 'Menu not found' },
        },
      },
    },

    // ─── Vendor – Menu Items ─────────────────────────────────────────────────
    '/api/vendor/menus/{menuId}/items': {
      get: {
        tags: ['Vendor – Menu Items'],
        summary: 'List all items in a menu',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'menuId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Array of menu items',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/MenuItem' },
                },
              },
            },
          },
          '404': { description: 'Menu not found' },
        },
      },
      post: {
        tags: ['Vendor – Menu Items'],
        summary: 'Add an item to a menu',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'menuId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'price'],
                properties: {
                  name: { type: 'string', example: 'Butter Chicken' },
                  price: { type: 'number', example: 12.99 },
                  description: { type: 'string' },
                  imageUrl: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Item created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MenuItem' },
              },
            },
          },
          '404': { description: 'Menu not found' },
        },
      },
    },
    '/api/vendor/menu-items/{itemId}': {
      put: {
        tags: ['Vendor – Menu Items'],
        summary: 'Update a menu item',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'itemId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  price: { type: 'number' },
                  description: { type: 'string' },
                  imageUrl: { type: 'string', nullable: true },
                  isAvailable: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Item updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MenuItem' },
              },
            },
          },
          '404': { description: 'Menu item not found' },
        },
      },
      delete: {
        tags: ['Vendor – Menu Items'],
        summary: 'Delete a menu item',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'itemId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '204': { description: 'Item deleted' },
          '404': { description: 'Menu item not found' },
        },
      },
    },
    '/api/vendor/menu-items/{itemId}/availability': {
      patch: {
        tags: ['Vendor – Menu Items'],
        summary: 'Toggle item availability',
        description:
          'Flips the `isAvailable` flag. Unavailable items are hidden from the customer menu view.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'itemId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Availability toggled',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MenuItem' },
              },
            },
          },
          '404': { description: 'Menu item not found' },
        },
      },
    },

    // ─── Vendor – Orders ─────────────────────────────────────────────────────
    '/api/vendor/orders': {
      get: {
        tags: ['Vendor – Orders'],
        summary: "List the vendor's orders",
        description:
          'Returns orders for the authenticated vendor, newest first. Optionally filter by status.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'Array of orders',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Order' },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/vendor/orders/{orderId}/accept': {
      patch: {
        tags: ['Vendor – Orders'],
        summary: 'Accept an order',
        description:
          'Transitions order status from `PENDING` to `ACCEPTED`. Emits a Socket.io event to the customer.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'orderId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Order accepted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Order' },
              },
            },
          },
          '400': { description: 'Order is not in PENDING state' },
          '404': { description: 'Order not found' },
        },
      },
    },
    '/api/vendor/orders/{orderId}/reject': {
      patch: {
        tags: ['Vendor – Orders'],
        summary: 'Reject an order',
        description:
          'Transitions order status from `PENDING` to `REJECTED`. Emits a Socket.io event to the customer.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'orderId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Order rejected',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Order' },
              },
            },
          },
          '400': { description: 'Order is not in PENDING state' },
          '404': { description: 'Order not found' },
        },
      },
    },
    '/api/vendor/orders/{orderId}/complete': {
      patch: {
        tags: ['Vendor – Orders'],
        summary: 'Mark an order as complete',
        description:
          'Transitions order status to `COMPLETED`. Should only be called after payment is confirmed. Emits a Socket.io event.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'orderId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Order completed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Order' },
              },
            },
          },
          '400': { description: 'Order is not in ACCEPTED state' },
          '404': { description: 'Order not found' },
        },
      },
    },

    // ─── Admin – Vendors ─────────────────────────────────────────────────────
    '/api/admin/vendors': {
      get: {
        tags: ['Admin – Vendors'],
        summary: "List all vendors in the admin's mall",
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Array of vendors with user email/name',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/VendorWithUser' },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden — ADMIN role required' },
        },
      },
      post: {
        tags: ['Admin – Vendors'],
        summary: 'Onboard a new vendor',
        description:
          'Creates an Auth0 user account for the vendor via the Management API, then creates the corresponding User and Vendor records in the database. Requires `AUTH0_MGMT_CLIENT_ID` and `AUTH0_MGMT_CLIENT_SECRET` to be configured.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'email',
                  'name',
                  'restaurantName',
                  'temporaryPassword',
                ],
                properties: {
                  email: { type: 'string', format: 'email' },
                  name: { type: 'string', example: 'Jane Doe' },
                  restaurantName: {
                    type: 'string',
                    example: 'Spice Garden',
                  },
                  description: { type: 'string' },
                  temporaryPassword: {
                    type: 'string',
                    example: 'TempPass123!',
                    description:
                      'Vendor must change this on first login via the password reset flow',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Vendor created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    userId: { type: 'string', format: 'uuid' },
                    vendorId: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
          '400': { description: 'Admin not associated with a mall' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/admin/vendors/{vendorId}/reset-password': {
      patch: {
        tags: ['Admin – Vendors'],
        summary: 'Generate password reset link for a vendor',
        description:
          'Calls Auth0 Management API to generate a one-time password-change ticket URL. The admin shares this URL with the vendor to let them set a new password.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'vendorId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Reset link generated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    resetLink: {
                      type: 'string',
                      example: 'https://your-tenant.auth0.com/lo/reset?...',
                    },
                  },
                },
              },
            },
          },
          '404': { description: 'Vendor not found' },
        },
      },
    },
    '/api/admin/vendors/{vendorId}/deactivate': {
      patch: {
        tags: ['Admin – Vendors'],
        summary: 'Deactivate a vendor',
        description:
          'Sets `isActive = false` on the vendor. Deactivated vendors are hidden from the customer mall page.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'vendorId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Vendor deactivated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Vendor' },
              },
            },
          },
          '404': { description: 'Vendor not found' },
        },
      },
    },

    // ─── Admin – Tables ──────────────────────────────────────────────────────
    '/api/admin/tables': {
      get: {
        tags: ['Admin – Tables'],
        summary: "List all tables in the admin's mall",
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Array of tables',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Table' },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden — ADMIN role required' },
        },
      },
      post: {
        tags: ['Admin – Tables'],
        summary: 'Create a new table',
        description:
          'Creates a table with a unique QR token. The QR token is embedded in a QR code printed and placed on the physical table.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['tableNumber'],
                properties: {
                  tableNumber: { type: 'string', example: 'A-12' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Table created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Table' },
              },
            },
          },
        },
      },
    },
    '/api/admin/tables/{tableId}': {
      put: {
        tags: ['Admin – Tables'],
        summary: 'Update table details',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'tableId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  tableNumber: { type: 'string' },
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Table updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Table' },
              },
            },
          },
          '404': { description: 'Table not found' },
        },
      },
      delete: {
        tags: ['Admin – Tables'],
        summary: 'Delete a table',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'tableId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '204': { description: 'Table deleted' },
          '404': { description: 'Table not found' },
        },
      },
    },
    '/api/admin/tables/{tableId}/rotate-qr': {
      patch: {
        tags: ['Admin – Tables'],
        summary: 'Rotate QR token',
        description:
          'Generates a new QR token for the table, invalidating any printed QR codes. Use this if a QR code is lost, damaged, or compromised.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'tableId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'New QR token generated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Table' },
              },
            },
          },
          '404': { description: 'Table not found' },
        },
      },
    },

    // ─── Super Admin ─────────────────────────────────────────────────────────
    '/api/super-admin/malls': {
      get: {
        tags: ['Super Admin'],
        summary: 'List all malls',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Array of malls',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Mall' },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden — SUPER_ADMIN role required' },
        },
      },
      post: {
        tags: ['Super Admin'],
        summary: 'Create a new mall',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'address'],
                properties: {
                  name: { type: 'string', example: 'Westfield Mall' },
                  address: { type: 'string', example: '123 Main Street' },
                  logoUrl: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Mall created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Mall' },
              },
            },
          },
        },
      },
    },
    '/api/super-admin/malls/{mallId}/admins': {
      post: {
        tags: ['Super Admin'],
        summary: 'Assign an admin to a mall',
        description:
          'Upserts a user with ADMIN role and creates the MallAdmin join record. The user must already have an Auth0 account.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'mallId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['auth0Sub', 'email'],
                properties: {
                  auth0Sub: {
                    type: 'string',
                    example: 'auth0|abc123',
                  },
                  email: { type: 'string', format: 'email' },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Admin assigned',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    userId: { type: 'string', format: 'uuid' },
                    mallAdminId: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
          '404': { description: 'Mall not found' },
        },
      },
    },

    // ─── Uploads ─────────────────────────────────────────────────────────────
    '/api/uploads/menu-item-image': {
      post: {
        tags: ['Uploads'],
        summary: 'Upload a menu item image',
        description:
          'Accepts a `multipart/form-data` request with an `image` field. Stores the file on disk under `/uploads/` and returns the public URL. Max file size and allowed types are enforced by the `multer` middleware.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['image'],
                properties: {
                  image: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image file (JPEG, PNG, WebP)',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Image uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    url: {
                      type: 'string',
                      example: 'http://localhost:3000/uploads/item-abc123.jpg',
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'No file provided or invalid file type' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden — VENDOR role required' },
        },
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'Authentication and user sync' },
    {
      name: 'Public',
      description: 'Unauthenticated customer-facing endpoints',
    },
    { name: 'Orders', description: 'Guest order placement and tracking' },
    {
      name: 'Vendor – Menus',
      description: 'Vendor menu management (VENDOR role)',
    },
    {
      name: 'Vendor – Menu Items',
      description: 'Vendor menu item management (VENDOR role)',
    },
    {
      name: 'Vendor – Orders',
      description: 'Vendor order management and status updates (VENDOR role)',
    },
    {
      name: 'Admin – Vendors',
      description: 'Mall admin vendor onboarding and management (ADMIN role)',
    },
    {
      name: 'Admin – Tables',
      description: 'Mall admin table and QR code management (ADMIN role)',
    },
    {
      name: 'Super Admin',
      description: 'Mall creation and admin assignment (SUPER_ADMIN role)',
    },
    { name: 'Uploads', description: 'File upload endpoints' },
  ],
};
