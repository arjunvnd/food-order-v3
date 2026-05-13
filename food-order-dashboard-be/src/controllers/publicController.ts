import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/**
 * GET /api/public/tables/:qrToken
 * Called immediately after the customer scans the QR code.
 * Returns tableId, tableNumber, and mallId so the frontend knows which mall to load.
 */
export const getTableByQrToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const qrToken = req.params.qrToken as string;
    const table = await prisma.table.findFirst({
      where: { qrToken, isActive: true },
      select: { id: true, tableNumber: true, mallId: true },
    });
    if (!table) {
      res.status(404).json({ message: 'Invalid or inactive QR code' });
      return;
    }
    res.json(table);
  } catch (error) {
    next(error);
  }
};

/** GET /api/public/malls/:mallId/tables/:tableNumber */
export const getTableByNumber = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const mallId = req.params.mallId as string;
    const tableNumber = req.params.tableNumber as string;
    const table = await prisma.table.findFirst({
      where: { mallId, tableNumber, isActive: true },
    });
    if (!table) {
      res.status(404).json({ message: 'Table not found or inactive' });
      return;
    }
    res.json(table);
  } catch (error) {
    next(error);
  }
};

/** GET /api/public/malls/:mallId/vendors */
export const listMallVendors = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const mallId = req.params.mallId as string;
    const vendors = await prisma.vendor.findMany({
      where: { mallId, isActive: true },
      select: {
        id: true,
        restaurantName: true,
        description: true,
        logoUrl: true,
      },
    });
    res.json(vendors);
  } catch (error) {
    next(error);
  }
};

/** GET /api/public/vendors/:vendorId */
export const getVendorDetail = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const vendorId = req.params.vendorId as string;
    console.log('vendorId', vendorId);
    const vendor = await prisma.vendor.findFirst({
      where: { id: vendorId, isActive: true },
      select: {
        id: true,
        restaurantName: true,
        description: true,
        logoUrl: true,
        mallId: true,
      },
    });
    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }
    res.json(vendor);
  } catch (error) {
    next(error);
  }
};

/** GET /api/public/vendors/:vendorId/active-menu */
export const getVendorActiveMenu = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const vendorId = req.params.vendorId as string;
    const menu = await prisma.menu.findFirst({
      where: { vendorId, isActive: true },
      include: {
        items: {
          where: { isAvailable: true },
          select: {
            id: true,
            name: true,
            price: true,
            description: true,
            imageUrl: true,
          },
        },
      },
    });
    if (!menu) {
      res.status(404).json({ message: 'No active menu found for this vendor' });
      return;
    }
    res.json(menu);
  } catch (error) {
    next(error);
  }
};
