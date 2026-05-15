import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/**
 * GET /api/vendor/profile
 * Returns the authenticated vendor's full profile.
 */
export const getVendorProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const vendorId = req.user!.vendorId!;
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { user: { select: { email: true, name: true } } },
    });
    if (!vendor) {
      res.status(404).json({ message: 'Vendor profile not found' });
      return;
    }
    res.json(vendor);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/vendor/profile
 * Allows the authenticated vendor to update their restaurant profile.
 * Optionally accepts a logo file upload (handled by Multer middleware before this).
 */
export const updateVendorProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const vendorId = req.user!.vendorId!;

    const { name, description, cuisineType, isActive } = req.body;
    const logoFile = req.file;

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        ...(name !== undefined ? { restaurantName: name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(cuisineType !== undefined ? { cuisineType } : {}),
        ...(isActive !== undefined
          ? { isActive: isActive === 'true' || isActive === true }
          : {}),
        ...(logoFile ? { logoUrl: `/uploads/${logoFile.filename}` } : {}),
        isProfileComplete: true,
      },
      include: { user: { select: { email: true, name: true } } },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};
