import { Router } from 'express';
import {
  getTableByQrToken,
  getTableByNumber,
  listMallVendors,
  getVendorDetail,
  getVendorActiveMenu,
} from '../controllers/publicController';

const router = Router();

// No authentication required on any of these routes
// Primary QR scan entry point — QR code encodes only the token
router.get('/tables/:qrToken', getTableByQrToken);
router.get('/malls/:mallId/tables/:tableNumber', getTableByNumber);
router.get('/malls/:mallId/vendors', listMallVendors);
router.get('/vendors/:vendorId', getVendorDetail);
router.get('/vendors/:vendorId/active-menu', getVendorActiveMenu);

export default router;
