import { Router } from 'express';
import {
  getTableByQrToken,
  getTableByNumber,
  listMallVendors,
  getVendorDetail,
  getVendorActiveMenu,
  resolveScanToken,
} from '../controllers/publicController';

const router = Router();

// No authentication required on any of these routes
// Unified scan entry — handles mall tables, standalone tables, and takeaway counters
router.get('/scan/:qrToken', resolveScanToken);
// Legacy: QR code directly encodes the table token (kept for backward-compatibility)
router.get('/tables/:qrToken', getTableByQrToken);
router.get('/malls/:mallId/tables/:tableNumber', getTableByNumber);
router.get('/malls/:mallId/vendors', listMallVendors);
router.get('/vendors/:vendorId', getVendorDetail);
router.get('/vendors/:vendorId/active-menu', getVendorActiveMenu);

export default router;
