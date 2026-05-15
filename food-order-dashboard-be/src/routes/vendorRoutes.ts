import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { requireRole } from '../middlewares/rbac';
import { upload } from '../middlewares/upload';
import {
  getMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  activateMenu,
} from '../controllers/menuController';
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
} from '../controllers/menuItemController';
import {
  getVendorOrders,
  acceptOrder,
  rejectOrder,
  completeOrder,
} from '../controllers/vendorOrderController';
import {
  updateVendorProfile,
  getVendorProfile,
} from '../controllers/vendorProfileController';
import {
  vendorGetTables,
  vendorCreateTable,
  vendorUpdateTable,
  vendorDeleteTable,
  vendorRotateQrToken,
  vendorRotateCounterQr,
} from '../controllers/tableController';

const router = Router();

// All vendor routes require a valid JWT and the VENDOR role
router.use(requireAuth, requireRole('VENDOR'));

// Profile
router.get('/profile', getVendorProfile);
router.put('/profile', upload.single('logo'), updateVendorProfile);

// Menus
router.get('/menus', getMenus);
router.post('/menus', createMenu);
router.put('/menus/:menuId', updateMenu);
router.delete('/menus/:menuId', deleteMenu);
router.patch('/menus/:menuId/activate', activateMenu);

// Menu items
router.get('/menus/:menuId/items', getMenuItems);
router.post('/menus/:menuId/items', upload.single('image'), createMenuItem);
router.put('/menu-items/:itemId', upload.single('image'), updateMenuItem);
router.delete('/menu-items/:itemId', deleteMenuItem);
router.patch('/menu-items/:itemId/availability', toggleAvailability);

// Orders
router.get('/orders', getVendorOrders);
router.patch('/orders/:orderId/accept', acceptOrder);
router.patch('/orders/:orderId/reject', rejectOrder);
router.patch('/orders/:orderId/complete', completeOrder);

// Tables (standalone & takeaway vendors manage their own tables)
router.get('/tables', vendorGetTables);
router.post('/tables', vendorCreateTable);
router.put('/tables/:tableId', vendorUpdateTable);
router.delete('/tables/:tableId', vendorDeleteTable);
router.patch('/tables/:tableId/rotate-qr', vendorRotateQrToken);

// Counter QR (takeaway vendors — vendor-level QR for the counter)
router.patch('/qr-token', vendorRotateCounterQr);

export default router;
