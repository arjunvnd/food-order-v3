import { Request, Response, NextFunction } from 'express';
import { ManagementClient } from 'auth0';
import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import config from '../config/config';

const getManagementClient = () =>
  new ManagementClient({
    domain: config.auth0Domain,
    clientId: config.auth0MgmtClientId,
    clientSecret: config.auth0MgmtClientSecret,
  });

/** GET /api/admin/vendors */
export const listVendors = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { mallId, role } = req.user!;

    // Super admins see all vendors across all malls; regular admins only see their mall's vendors
    if (role !== 'SUPER_ADMIN' && !mallId) {
      res.status(400).json({ message: 'Mall not assigned to this admin.' });
      return;
    }

    const vendors = await prisma.vendor.findMany({
      where: role === 'SUPER_ADMIN' ? {} : { mallId: mallId! },
      include: {
        user: { select: { email: true, name: true } },
        mall: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(vendors);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/vendors/invite
 * Creates an Auth0 account for the vendor, sends Auth0 "Set your password" email,
 * then stores User + Vendor in DB.
 */
export const inviteVendor = async (
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

    const { email, name, restaurantName, password } = req.body;
    if (!email || !name || !restaurantName) {
      res
        .status(400)
        .json({ message: 'email, name and restaurantName are required' });
      return;
    }

    if (config.vendorInviteDevMode) {
      // Dev mode: admin provides the password directly; no email is sent
      if (!password || typeof password !== 'string' || password.length < 8) {
        res.status(400).json({
          message:
            'password is required and must be at least 8 characters (dev mode)',
        });
        return;
      }
    }

    // Dev mode: use admin-supplied password. Prod: generate random one so vendor must use the reset email.
    const temporaryPassword = config.vendorInviteDevMode
      ? (password as string)
      : crypto.randomBytes(16).toString('hex') + 'A1!';

    const mgmt = getManagementClient();
    let auth0Sub: string;

    try {
      const auth0User = await mgmt.users.create({
        email,
        password: temporaryPassword,
        connection: 'Username-Password-Authentication',
        name,
      });
      auth0Sub = auth0User.user_id!;
    } catch (auth0Err: unknown) {
      const msg =
        auth0Err instanceof Error
          ? auth0Err.message
          : 'Auth0 user creation failed';
      res.status(409).json({ message: msg });
      return;
    }

    // In prod: trigger Auth0's "Change Password" email so the vendor sets their own password.
    // In dev mode: skip entirely — admin shares the password manually.
    if (!config.vendorInviteDevMode) {
      try {
        await axios.post(
          `https://${config.auth0Domain}/dbconnections/change_password`,
          {
            client_id: config.auth0ClientId,
            email,
            connection: 'Username-Password-Authentication',
          },
        );
      } catch {
        // Non-fatal — user is created; admin can use reset-password as fallback
      }
    }

    // Create DB records — roll back Auth0 user if this fails
    try {
      const user = await prisma.user.create({
        data: {
          auth0Sub,
          email,
          name,
          role: 'VENDOR',
          status: 'ACTIVE', // admin-invited users are pre-approved
          vendor: {
            create: { mallId, restaurantName, isProfileComplete: false },
          },
        },
        include: { vendor: true },
      });
      res.status(201).json({ userId: user.id, vendorId: user.vendor?.id });
    } catch (dbErr) {
      // Compensating rollback
      await mgmt.users.delete(auth0Sub).catch(() => undefined);
      throw dbErr;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/vendors
 * Creates an Auth0 account for the vendor, then stores User + Vendor in DB.
 */
export const onboardVendor = async (
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

    const { email, name, restaurantName, description, temporaryPassword } =
      req.body;

    const mgmt = getManagementClient();
    const auth0User = await mgmt.users.create({
      email,
      password: temporaryPassword,
      connection: 'Username-Password-Authentication',
      name,
    });

    const auth0Sub = auth0User.user_id!;

    const user = await prisma.user.create({
      data: {
        auth0Sub,
        email,
        name,
        role: 'VENDOR',
        status: 'ACTIVE', // admin-invited users are pre-approved
        vendor: {
          create: { mallId, restaurantName, description },
        },
      },
      include: { vendor: true },
    });

    res.status(201).json({ userId: user.id, vendorId: user.vendor?.id });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/vendors/:vendorId/reset-password
 * Admin sets a new password for the vendor directly via the Auth0 Management API.
 * Body: { password: string }
 */
export const resetVendorPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { mallId, role } = req.user!;
    const vendorId = req.params.vendorId as string;
    const { password } = req.body;

    if (!password || typeof password !== 'string' || password.length < 8) {
      res
        .status(400)
        .json({ message: 'password must be at least 8 characters' });
      return;
    }

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }

    if (role !== 'SUPER_ADMIN' && vendor.mallId !== mallId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: vendor.userId } });
    if (!user) {
      res.status(404).json({ message: 'Vendor user account not found' });
      return;
    }

    const mgmt = getManagementClient();
    await mgmt.users.update(user.auth0Sub, {
      password,
      connection: 'Username-Password-Authentication',
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

/** GET /api/admin/vendors/:vendorId */
export const getVendor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { mallId, role } = req.user!;
    const vendorId = req.params.vendorId as string;

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        user: { select: { email: true, name: true } },
        mall: { select: { id: true, name: true } },
      },
    });

    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }

    if (role !== 'SUPER_ADMIN' && vendor.mallId !== mallId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    res.json(vendor);
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/admin/vendors/:vendorId
 * Updates editable vendor fields: restaurantName, description, cuisineType, vendorType, isActive.
 */
export const updateVendor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { mallId, role } = req.user!;
    const vendorId = req.params.vendorId as string;

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }

    // Non-super-admins can only edit vendors in their own mall
    if (role !== 'SUPER_ADMIN' && vendor.mallId !== mallId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const { restaurantName, description, cuisineType, vendorType, isActive } =
      req.body;

    const VALID_VENDOR_TYPES = new Set([
      'MALL_VENDOR',
      'STANDALONE',
      'TAKEAWAY',
    ]);
    if (vendorType !== undefined && !VALID_VENDOR_TYPES.has(vendorType)) {
      res.status(400).json({ message: 'Invalid vendorType' });
      return;
    }

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        ...(restaurantName !== undefined && { restaurantName }),
        ...(description !== undefined && { description }),
        ...(cuisineType !== undefined && { cuisineType }),
        ...(vendorType !== undefined && { vendorType }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        user: { select: { email: true, name: true } },
        mall: { select: { id: true, name: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/admin/vendors/:vendorId/deactivate */
export const deactivateVendor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const mallId = req.user!.mallId;
    if (!mallId) {
      res.status(400).json({ message: 'Mall not assigned to this admin.' });
      return;
    }
    const vendorId = req.params.vendorId as string;

    const vendor = await prisma.vendor.findFirst({
      where: { id: vendorId, mallId },
    });
    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: { isActive: false },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};
