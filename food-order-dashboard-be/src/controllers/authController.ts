import { Request, Response, NextFunction } from 'express';
import 'express-oauth2-jwt-bearer';
import { prisma } from '../lib/prisma';

/**
 * POST /api/auth/sync
 * Called by the frontend once after Auth0 login.
 * Upserts the user record using the token's sub claim.
 */
export const syncUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const auth0Sub = req.auth?.payload.sub as string;
    const email = req.auth?.payload['email'] as string | undefined;
    const name = req.auth?.payload['name'] as string | undefined;

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
      },
      update: {
        ...(email ? { email } : {}),
        ...(name ? { name } : {}),
      },
      include: {
        mallAdmins: { select: { mallId: true } },
        vendor: { select: { id: true, mallId: true, restaurantName: true } },
      },
    });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mallId: user.mallAdmins[0]?.mallId ?? null,
      vendorId: user.vendor?.id ?? null,
    });
  } catch (error) {
    next(error);
  }
};
