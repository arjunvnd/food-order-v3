import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { requireRole } from '../middlewares/rbac';
import {
  getTables,
  createTable,
  updateTable,
  deleteTable,
  rotateQrToken,
} from '../controllers/tableController';
import {
  listVendors,
  inviteVendor,
  onboardVendor,
  resetVendorPassword,
  deactivateVendor,
} from '../controllers/adminVendorController';

const router = Router();

// All admin routes require a valid JWT and at least the ADMIN role
// SUPER_ADMIN is also permitted (they are a superset of ADMIN)
router.use(requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'));

// Tables
router.get('/tables', getTables);
router.post('/tables', createTable);
router.put('/tables/:tableId', updateTable);
router.delete('/tables/:tableId', deleteTable);
router.patch('/tables/:tableId/rotate-qr', rotateQrToken);

// Vendors
router.get('/vendors', listVendors);
router.post('/vendors/invite', inviteVendor);
router.post('/vendors', onboardVendor);
router.patch('/vendors/:vendorId/reset-password', resetVendorPassword);
router.patch('/vendors/:vendorId/deactivate', deactivateVendor);

export default router;
