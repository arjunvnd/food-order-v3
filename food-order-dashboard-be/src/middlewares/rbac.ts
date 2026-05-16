import { Request, Response, NextFunction } from 'express';
import 'express-oauth2-jwt-bearer'; // ensure req.auth type augmentation is in scope
import { prisma } from '../lib/prisma';
import { Role } from '../generated/prisma/client/enums';

/**
 * Role-based access control middleware.
 * Must be used AFTER requireAuth.
 * Looks up the user in the DB by auth0Sub, attaches them to req.user,
 * and rejects the request if the user's role is not in the allowed list.
 */
export const requireRole = (...roles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth0Sub = req.auth?.payload.sub;
      if (!auth0Sub) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { auth0Sub },
        include: {
          mallAdmins: { select: { mallId: true } },
          vendor: { select: { id: true } },
        },
      });

      if (!user) {
        res
          .status(401)
          .json({ message: 'User not found. Call POST /api/auth/sync first.' });
        return;
      }

      if (user.status === 'PENDING') {
        res
          .status(403)
          .json({ message: 'Account pending approval by a super admin.' });
        return;
      }

      if (!roles.includes(user.role as Role)) {
        res.status(403).json({ message: 'Forbidden: insufficient role' });
        return;
      }

      // For SUPER_ADMIN with no MallAdmin assignment, fall back to the first
      // mall in the system so admin panel endpoints work in single-mall setups.
      let mallId: string | null = user.mallAdmins[0]?.mallId ?? null;
      if (!mallId && user.role === 'SUPER_ADMIN') {
        const firstMall = await prisma.mall.findFirst({ select: { id: true } });
        mallId = firstMall?.id ?? null;
      }

      req.user = {
        id: user.id,
        auth0Sub: user.auth0Sub,
        email: user.email,
        name: user.name,
        role: user.role as Role,
        mallId,
        vendorId: user.vendor?.id ?? null,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};
