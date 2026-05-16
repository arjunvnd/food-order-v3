import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { ROLES, VALID_ROLE_VALUES } from '../config/roles.config';

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
      create: { auth0Sub, email, name, role: 'ADMIN', status: 'ACTIVE' },
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

/** GET /api/super-admin/roles
 *  Returns the static list of available roles from roles.config.ts.
 *  Frontend fetches this so it never needs hardcoded role lists.
 */
export const listRoles = (_req: Request, res: Response) => {
  res.json(ROLES);
};

/** GET /api/super-admin/users
 *  Returns all platform users with their current role.
 */
export const listUsers = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        auth0Sub: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

/** GET /api/super-admin/access-requests
 *  Returns all users with status PENDING (waiting for approval).
 */
export const listAccessRequests = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const pending = await prisma.user.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        auth0Sub: true,
        email: true,
        name: true,
        role: true,
        requestNote: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(pending);
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/super-admin/access-requests/:userId/approve
 *  Activates the user — they can now log in and use the app.
 */
export const approveAccessRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.params.userId as string;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    // Ensure a Vendor record exists for VENDOR-role users so they can access vendor features
    if (user.role === 'VENDOR') {
      const hasVendor = await prisma.vendor.findUnique({
        where: { userId: userId },
      });
      if (!hasVendor) {
        await prisma.vendor.create({
          data: { userId: userId, restaurantName: user.name ?? user.email },
        });
      }
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
      select: { id: true, email: true, name: true, role: true, status: true },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/super-admin/access-requests/:userId/reject
 *  Keeps the user as PENDING (they can re-submit or be approved later).
 *  Optionally stores a rejection note for the user to see.
 */
export const rejectAccessRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.params.userId as string;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    // Mark rejected by clearing requestNote so they know their last request was reviewed
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { requestNote: null },
      select: { id: true, email: true, name: true, role: true, status: true },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/super-admin/users/:userId/role
 *  Body: { role: string }
 *  Updates a user's role. Validates against the roles config.
 *  A SUPER_ADMIN cannot be downgraded via this endpoint.
 */
export const updateUserRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.params.userId as string;
    const { role } = req.body;

    if (!role || !VALID_ROLE_VALUES.has(role)) {
      res.status(400).json({
        message: `Invalid role. Valid roles are: ${[...VALID_ROLE_VALUES].join(', ')}`,
      });
      return;
    }

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      include: { vendor: { select: { id: true } } },
    });

    if (!existing) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (existing.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
      res
        .status(403)
        .json({ message: 'Cannot downgrade a SUPER_ADMIN via this endpoint.' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      select: { id: true, email: true, name: true, role: true },
    });

    // When promoting to VENDOR ensure a Vendor record exists so they can use vendor features
    if (role === 'VENDOR' && !existing.vendor) {
      await prisma.vendor.create({
        data: {
          userId: existing.id,
          restaurantName: existing.name ?? existing.email,
        },
      });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
};
