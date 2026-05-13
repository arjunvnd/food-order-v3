import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { emitOrderStatus } from '../services/socketService';
import { OrderStatus } from '../generated/prisma/client/enums';

/** GET /api/vendor/orders */
export const getVendorOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const vendorId = req.user!.vendorId!;
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
      const vendorId = req.user!.vendorId!;
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
