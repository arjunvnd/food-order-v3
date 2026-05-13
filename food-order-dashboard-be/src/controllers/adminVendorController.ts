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
    const mallId = req.user!.mallId!;
    const vendors = await prisma.vendor.findMany({
      where: { mallId },
      include: { user: { select: { email: true, name: true } } },
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
 * Generates an Auth0 password-change ticket and returns the one-time reset URL.
 */
export const resetVendorPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const mallId = req.user!.mallId!;
    const vendorId = req.params.vendorId as string;

    const vendor = await prisma.vendor.findFirst({
      where: { id: vendorId, mallId },
    });
    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: vendor.userId } });
    if (!user) {
      res.status(404).json({ message: 'Vendor user account not found' });
      return;
    }

    const mgmt = getManagementClient();
    const ticket = await mgmt.tickets.changePassword({
      user_id: user.auth0Sub,
      result_url: `${config.frontendUrl}/login`,
      mark_email_as_verified: true,
    });

    res.json({ resetLink: ticket.ticket });
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
    const mallId = req.user!.mallId!;
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
