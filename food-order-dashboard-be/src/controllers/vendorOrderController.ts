import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { emitOrderStatus, emitNewOrder } from '../services/socketService';
import { OrderStatus } from '../generated/prisma/client/enums';

interface ManualOrderItem {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

/** GET /api/vendor/orders */
export const getVendorOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const vendorId = req.user!.vendorId;
    if (!vendorId) {
      res.status(400).json({ message: 'Vendor profile not set up yet.' });
      return;
    }
    const { status, from, to } = req.query;

    const validStatuses: OrderStatus[] = [
      'PENDING',
      'ACCEPTED',
      'REJECTED',
      'COMPLETED',
    ];
    const statusFilter =
      status && validStatuses.includes(status as OrderStatus)
        ? (status as OrderStatus)
        : undefined;

    const orders = await prisma.order.findMany({
      where: {
        vendorId,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: new Date(from as string) } : {}),
                ...(to ? { lte: new Date(to as string) } : {}),
              },
            }
          : {}),
      },
      include: {
        items: {
          include: { menuItem: { select: { name: true, price: true } } },
        },
        table: { select: { tableNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

/** Shared handler for accept / reject / complete transitions */
const transitionOrderStatus =
  (newStatus: OrderStatus) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) {
        res.status(400).json({ message: 'Vendor profile not set up yet.' });
        return;
      }
      const orderId = req.params.orderId as string;

      const order = await prisma.order.findFirst({
        where: { id: orderId, vendorId },
      });
      if (!order) {
        res.status(404).json({ message: 'Order not found' });
        return;
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });

      emitOrderStatus(orderId, newStatus);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  };

/** PATCH /api/vendor/orders/:orderId/accept */
export const acceptOrder = transitionOrderStatus('ACCEPTED');

/** PATCH /api/vendor/orders/:orderId/reject */
export const rejectOrder = transitionOrderStatus('REJECTED');

/** PATCH /api/vendor/orders/:orderId/complete */
export const completeOrder = transitionOrderStatus('COMPLETED');

/**
 * GET /api/vendor/orders/menu-items
 * Returns the available items of this vendor's currently active menu,
 * used to populate the manual/parcel order item picker.
 */
export const getVendorActiveMenuItems = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const vendorId = req.user!.vendorId!;

    const activeMenu = await prisma.menu.findFirst({
      where: { vendorId, isActive: true },
    });
    if (!activeMenu) {
      res.json([]);
      return;
    }

    const items = await prisma.menuItem.findMany({
      where: { menuId: activeMenu.id, isAvailable: true },
      select: { id: true, name: true, price: true },
    });
    res.json(items);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/vendor/orders
 * Vendor-authenticated order creation for phone-in/parcel/walk-in orders.
 * Mirrors the guest `placeOrder` validation, but vendorId comes from the JWT
 * (never the request body) and the order is created already ACCEPTED since
 * the vendor is entering it themselves.
 */
export const createVendorOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const vendorId = req.user!.vendorId;
    if (!vendorId) {
      res.status(400).json({ message: 'Vendor profile not set up yet.' });
      return;
    }

    const {
      orderType = 'TAKEAWAY',
      tableId,
      guestName,
      guestPhone,
      notes,
      items,
      paymentStatus = 'UNPAID',
    }: {
      orderType?: 'DINE_IN' | 'TAKEAWAY';
      tableId?: string;
      guestName?: string;
      guestPhone?: string;
      notes?: string;
      items: ManualOrderItem[];
      paymentStatus?: 'PAID' | 'UNPAID';
    } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ message: 'Order must contain at least one item' });
      return;
    }

    if (orderType === 'DINE_IN' && !tableId) {
      res
        .status(400)
        .json({ message: 'tableId is required for dine-in orders' });
      return;
    }

    const vendor = await prisma.vendor.findFirst({
      where: { id: vendorId, isActive: true },
    });
    if (!vendor) {
      res.status(400).json({ message: 'Vendor not found or inactive' });
      return;
    }

    if (orderType === 'DINE_IN') {
      const table = await prisma.table.findFirst({
        where: {
          id: tableId,
          isActive: true,
          OR: [
            { vendorId },
            ...(vendor.mallId ? [{ mallId: vendor.mallId }] : []),
          ],
        },
      });
      if (!table) {
        res.status(400).json({ message: 'Invalid or inactive table' });
        return;
      }
    }

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
    for (const item of items) {
      totalAmount += Number(priceMap.get(item.menuItemId)) * item.quantity;
    }

    const order = await prisma.order.create({
      data: {
        vendorId,
        tableId: orderType === 'DINE_IN' ? (tableId ?? null) : null,
        orderType,
        source: 'VENDOR',
        status: 'ACCEPTED',
        paymentStatus: paymentStatus === 'PAID' ? 'PAID' : 'UNPAID',
        guestName,
        guestPhone,
        notes,
        totalAmount,
        items: {
          create: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: priceMap.get(item.menuItemId)!,
            notes: item.notes,
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
