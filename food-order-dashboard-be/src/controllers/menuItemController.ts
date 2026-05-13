import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/** Verify a menu belongs to the requesting vendor */
const assertMenuOwnership = async (menuId: string, vendorId: string) =>
  prisma.menu.findFirst({ where: { id: menuId, vendorId } });

/** GET /api/vendor/menus/:menuId/items */
export const getMenuItems = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const vendorId = req.user!.vendorId!;
    const menuId = req.params.menuId as string;

    const menu = await assertMenuOwnership(menuId, vendorId);
    if (!menu) {
      res.status(404).json({ message: 'Menu not found' });
      return;
    }

    const items = await prisma.menuItem.findMany({ where: { menuId } });
    res.json(items);
  } catch (error) {
    next(error);
  }
};

/** POST /api/vendor/menus/:menuId/items */
export const createMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const vendorId = req.user!.vendorId!;
    const menuId = req.params.menuId as string;
    const { name, price, description } = req.body;
    const imageFile = req.file;

    const menu = await assertMenuOwnership(menuId, vendorId);
    if (!menu) {
      res.status(404).json({ message: 'Menu not found' });
      return;
    }

    const item = await prisma.menuItem.create({
      data: {
        menuId,
        name,
        price: parseFloat(price),
        description,
        ...(imageFile ? { imageUrl: `/uploads/${imageFile.filename}` } : {}),
      },
    });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

/** PUT /api/vendor/menu-items/:itemId */
export const updateMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const vendorId = req.user!.vendorId!;
    const itemId = req.params.itemId as string;
    const { name, price, description, isAvailable } = req.body;
    const imageFile = req.file;

    const item = await prisma.menuItem.findFirst({
      where: { id: itemId, menu: { vendorId } },
    });
    if (!item) {
      res.status(404).json({ message: 'Menu item not found' });
      return;
    }

    const updated = await prisma.menuItem.update({
      where: { id: itemId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(price !== undefined ? { price: parseFloat(price) } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(isAvailable !== undefined
          ? { isAvailable: isAvailable === 'true' || isAvailable === true }
          : {}),
        ...(imageFile ? { imageUrl: `/uploads/${imageFile.filename}` } : {}),
      },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/vendor/menu-items/:itemId */
export const deleteMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const vendorId = req.user!.vendorId!;
    const itemId = req.params.itemId as string;

    const item = await prisma.menuItem.findFirst({
      where: { id: itemId, menu: { vendorId } },
    });
    if (!item) {
      res.status(404).json({ message: 'Menu item not found' });
      return;
    }

    await prisma.menuItem.delete({ where: { id: itemId } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/vendor/menu-items/:itemId/availability */
export const toggleAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const vendorId = req.user!.vendorId!;
    const itemId = req.params.itemId as string;

    const item = await prisma.menuItem.findFirst({
      where: { id: itemId, menu: { vendorId } },
    });
    if (!item) {
      res.status(404).json({ message: 'Menu item not found' });
      return;
    }

    const updated = await prisma.menuItem.update({
      where: { id: itemId },
      data: { isAvailable: !item.isAvailable },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};
