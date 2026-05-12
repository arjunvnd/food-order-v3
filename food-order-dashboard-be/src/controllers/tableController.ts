import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';

/** GET /api/admin/tables */
export const getTables = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const mallId = req.user!.mallId!;
    const tables = await prisma.table.findMany({ where: { mallId } });
    res.json(tables);
  } catch (error) {
    next(error);
  }
};

/** POST /api/admin/tables */
export const createTable = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const mallId = req.user!.mallId;
    if (!mallId) {
      res.status(400).json({ message: 'Admin not associated with a mall' });
      return;
    }
    const { tableNumber } = req.body;
    const table = await prisma.table.create({ data: { tableNumber, mallId } });
    res.status(201).json(table);
  } catch (error) {
    next(error);
  }
};

/** PUT /api/admin/tables/:tableId */
export const updateTable = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const mallId = req.user!.mallId!;
    const tableId = req.params.tableId as string;
    const { tableNumber, isActive } = req.body;

    const table = await prisma.table.findFirst({
      where: { id: tableId, mallId },
    });
    if (!table) {
      res.status(404).json({ message: 'Table not found' });
      return;
    }

    const updated = await prisma.table.update({
      where: { id: tableId },
      data: { tableNumber, isActive },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/admin/tables/:tableId */
export const deleteTable = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const mallId = req.user!.mallId!;
    const tableId = req.params.tableId as string;

    const table = await prisma.table.findFirst({
      where: { id: tableId, mallId },
    });
    if (!table) {
      res.status(404).json({ message: 'Table not found' });
      return;
    }

    // Block deletion if any order is still open on this table
    const openOrder = await prisma.order.findFirst({
      where: { tableId, status: { in: ['PENDING', 'ACCEPTED'] } },
    });
    if (openOrder) {
      res.status(409).json({
        message:
          'Cannot delete a table that has pending or accepted orders. Resolve them first.',
      });
      return;
    }

    await prisma.table.delete({ where: { id: tableId } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/tables/:tableId/rotate-qr
 * Generates a fresh qrToken, immediately invalidating any existing printed QR codes.
 * Returns the new token so the admin can generate and print a replacement QR.
 */
export const rotateQrToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const mallId = req.user!.mallId!;
    const tableId = req.params.tableId as string;

    const table = await prisma.table.findFirst({
      where: { id: tableId, mallId },
    });
    if (!table) {
      res.status(404).json({ message: 'Table not found' });
      return;
    }

    const updated = await prisma.table.update({
      where: { id: tableId },
      data: { qrToken: randomUUID() },
      select: { id: true, tableNumber: true, qrToken: true },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};
