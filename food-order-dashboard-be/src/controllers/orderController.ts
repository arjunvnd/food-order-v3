import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { emitNewOrder, emitOrderStatus } from '../services/socketService';

interface CartItem {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

/**
 * POST /api/orders
 * Guest checkout — no auth required.
 * Validates that all items belong to the same active vendor from an active menu.
 * Snapshots prices at order time.
 */
export const placeOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      tableId,
      vendorId,
      items,
      guestName,
      guestPhone,
      guestSessionId,
      notes,
    }: {
      tableId: string;
      vendorId: string;
      items: CartItem[];
      guestName?: string;
      guestPhone?: string;
      guestSessionId?: string;
      notes?: string;
    } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ message: 'Order must contain at least one item' });
      return;
    }

    const [table, vendor] = await Promise.all([
      prisma.table.findFirst({ where: { id: tableId, isActive: true } }),
      prisma.vendor.findFirst({ where: { id: vendorId, isActive: true } }),
    ]);

    if (!table) {
      res.status(400).json({ message: 'Invalid or inactive table' });
      return;
    }
    if (!vendor) {
      res.status(400).json({ message: 'Vendor not found or inactive' });
      return;
    }

    // All items must be available and belong to this vendor's active menu
    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        isAvailable: true,
        menu: { vendorId, isActive: true },
      },
    });

    if (menuItems.length !== menuItemIds.length) {
      res.status(400).json({
        message:
          "One or more items are unavailable or do not belong to this vendor's active menu",
      });
      return;
    }

    const priceMap = new Map(menuItems.map((m) => [m.id, m.price]));
    let totalAmount = 0;
    for (const cartItem of items) {
      totalAmount +=
        Number(priceMap.get(cartItem.menuItemId)) * cartItem.quantity;
    }

    const order = await prisma.order.create({
      data: {
        vendorId,
        tableId,
        guestName,
        guestPhone,
        guestSessionId,
        notes,
        totalAmount,
        items: {
          create: items.map((cartItem) => ({
            menuItemId: cartItem.menuItemId,
            quantity: cartItem.quantity,
            unitPrice: priceMap.get(cartItem.menuItemId)!,
            notes: cartItem.notes,
          })),
        },
      },
      include: {
        items: { include: { menuItem: { select: { name: true } } } },
        table: { select: { tableNumber: true } },
        vendor: { select: { restaurantName: true } },
      },
    });

    emitNewOrder(vendorId, order);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/:orderId
 * Public — customers poll this after placing an order.
 */
export const getOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orderId = req.params.orderId as string;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { menuItem: { select: { name: true } } } },
        vendor: { select: { restaurantName: true } },
        table: { select: { tableNumber: true } },
      },
    });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/:orderId/pay
 * Public — customer submits dummy payment code after vendor acceptance.
 * Code "1234" marks the order as paid.
 */
export const payOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const orderId = req.params.orderId as string;
    const { code } = req.body as { code: string };

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    if (order.status !== 'ACCEPTED') {
      res.status(400).json({
        message: 'Order must be accepted by the vendor before payment',
      });
      return;
    }
    if (order.paymentStatus === 'PAID') {
      res.status(400).json({ message: 'Order is already paid' });
      return;
    }
    if (code !== '1234') {
      res.status(400).json({ message: 'Invalid payment code' });
      return;
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'PAID' },
    });

    emitOrderStatus(orderId, 'PAID');
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders?sessionId=xxx
 * Public — returns all orders belonging to this guest session (localStorage UUID).
 * Ordered newest first so the customer sees their latest order at the top.
 */
export const getOrdersBySession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const sessionId = req.query.sessionId as string | undefined;
    if (!sessionId) {
      res.status(400).json({ message: 'sessionId query param is required' });
      return;
    }
    const orders = await prisma.order.findMany({
      where: { guestSessionId: sessionId },
      include: {
        items: { include: { menuItem: { select: { name: true } } } },
        vendor: { select: { restaurantName: true } },
        table: { select: { tableNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};
