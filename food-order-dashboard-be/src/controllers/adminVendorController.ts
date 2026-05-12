import { Request, Response, NextFunction } from 'express';
import { ManagementClient } from 'auth0';
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
    const auth0Response = await mgmt.users.create({
      email,
      password: temporaryPassword,
      connection: 'Username-Password-Authentication',
      name,
    });

    const auth0Sub = auth0Response.data.user_id;

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

    res.json({ resetLink: ticket.data.ticket });
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
