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

      if (!roles.includes(user.role as Role)) {
        res.status(403).json({ message: 'Forbidden: insufficient role' });
        return;
      }

      req.user = {
        id: user.id,
        auth0Sub: user.auth0Sub,
        email: user.email,
        name: user.name,
        role: user.role as Role,
        mallId: user.mallAdmins[0]?.mallId ?? null,
        vendorId: user.vendor?.id ?? null,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};
