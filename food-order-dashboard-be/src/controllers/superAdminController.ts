import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/** GET /api/super-admin/malls */
export const listMalls = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const malls = await prisma.mall.findMany();
    res.json(malls);
  } catch (error) {
    next(error);
  }
};

/** POST /api/super-admin/malls */
export const createMall = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, address, logoUrl } = req.body;
    const mall = await prisma.mall.create({ data: { name, address, logoUrl } });
    res.status(201).json(mall);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/super-admin/malls/:mallId/admins
 * Upserts a user with ADMIN role and creates the MallAdmin join record.
 */
export const assignMallAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const mallId = req.params.mallId as string;
    const { auth0Sub, email, name } = req.body;

    const mall = await prisma.mall.findUnique({ where: { id: mallId } });
    if (!mall) {
      res.status(404).json({ message: 'Mall not found' });
      return;
    }

    // Check the current role before upsert so we don't downgrade SUPER_ADMIN to ADMIN
    const existing = await prisma.user.findUnique({
      where: { auth0Sub },
      select: { role: true },
    });
    const targetRole =
      existing?.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';

    const user = await prisma.user.upsert({
      where: { auth0Sub },
      create: { auth0Sub, email, name, role: 'ADMIN' },
      update: { email, name, role: targetRole },
    });

    const mallAdmin = await prisma.mallAdmin.create({
      data: { userId: user.id, mallId: mallId },
    });

    res.status(201).json({ userId: user.id, mallAdminId: mallAdmin.id });
  } catch (error) {
    next(error);
  }
};
