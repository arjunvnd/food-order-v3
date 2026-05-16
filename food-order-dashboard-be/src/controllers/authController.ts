import { Request, Response, NextFunction } from 'express';
import 'express-oauth2-jwt-bearer';
import { prisma } from '../lib/prisma';

/**
 * POST /api/auth/sync
 * Called by the frontend once after Auth0 login.
 * Upserts the user record using the token's sub claim.
 * New self-signup users are created with status PENDING until a super admin approves them.
 */
export const syncUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const auth0Sub = req.auth?.payload.sub as string;
    const email =
      (req.body?.email as string | undefined) ||
      (req.auth?.payload['email'] as string | undefined);
    const name =
      (req.body?.name as string | undefined) ||
      (req.auth?.payload['name'] as string | undefined);

    if (!auth0Sub) {
      res.status(400).json({ message: 'Missing sub claim in token' });
      return;
    }

    const user = await prisma.user.upsert({
      where: { auth0Sub },
      create: {
        auth0Sub,
        email: email ?? auth0Sub,
        name: name ?? null,
        // New self-signups start PENDING — admin-invited users are created with ACTIVE
        status: 'PENDING',
      },
      update: {
        ...(email ? { email } : {}),
        ...(name ? { name } : {}),
        // Never downgrade status on re-sync
      },
      include: {
        mallAdmins: { select: { mallId: true } },
        vendor: {
          select: {
            id: true,
            mallId: true,
            restaurantName: true,
            isProfileComplete: true,
          },
        },
      },
    });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      mallId: user.mallAdmins[0]?.mallId ?? null,
      vendorId: user.vendor?.id ?? null,
      isProfileComplete: user.vendor?.isProfileComplete ?? null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/request-access
 * Authenticated (any role, including PENDING users).
 * Stores an optional note explaining why the user wants access.
 * Super admins review these via GET /api/super-admin/access-requests.
 */
export const requestAccess = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const auth0Sub = req.auth?.payload.sub as string;
    if (!auth0Sub) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const note =
      (req.body?.note as string | undefined)?.trim().slice(0, 500) ?? '';

    await prisma.user.update({
      where: { auth0Sub },
      data: { requestNote: note || null },
    });

    res.json({ message: 'Access request recorded.' });
  } catch (error) {
    next(error);
  }
};
