import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/** GET /api/vendor/menus */
export const getMenus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const vendorId = req.user!.vendorId!;
    const menus = await prisma.menu.findMany({ where: { vendorId } });
    res.json(menus);
  } catch (error) {
    next(error);
  }
};

/** POST /api/vendor/menus */
export const createMenu = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const vendorId = req.user!.vendorId!;
    const { name } = req.body;
    const menu = await prisma.menu.create({ data: { vendorId, name } });
    res.status(201).json(menu);
  } catch (error) {
    next(error);
  }
};

/** PUT /api/vendor/menus/:menuId */
export const updateMenu = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const vendorId = req.user!.vendorId!;
    const menuId = req.params.menuId as string;
    const { name } = req.body;

    const menu = await prisma.menu.findFirst({
      where: { id: menuId, vendorId },
    });
    if (!menu) {
      res.status(404).json({ message: 'Menu not found' });
      return;
    }

    const updated = await prisma.menu.update({
      where: { id: menuId },
      data: { name },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/vendor/menus/:menuId */
export const deleteMenu = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const vendorId = req.user!.vendorId!;
    const menuId = req.params.menuId as string;

    const menu = await prisma.menu.findFirst({
      where: { id: menuId, vendorId },
    });
    if (!menu) {
      res.status(404).json({ message: 'Menu not found' });
      return;
    }

    await prisma.menu.delete({ where: { id: menuId } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/vendor/menus/:menuId/activate
 * Deactivates all other menus for this vendor and activates the selected one.
 * Uses a transaction to ensure atomicity.
 */
export const activateMenu = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const vendorId = req.user!.vendorId!;
    const menuId = req.params.menuId as string;

    const menu = await prisma.menu.findFirst({
      where: { id: menuId, vendorId },
    });
    if (!menu) {
      res.status(404).json({ message: 'Menu not found' });
      return;
    }

    const activated = await prisma.$transaction(async (tx) => {
      await tx.menu.updateMany({
        where: { vendorId, id: { not: menuId } },
        data: { isActive: false },
      });
      return tx.menu.update({
        where: { id: menuId },
        data: { isActive: true },
      });
    });

    res.json(activated);
  } catch (error) {
    next(error);
  }
};
