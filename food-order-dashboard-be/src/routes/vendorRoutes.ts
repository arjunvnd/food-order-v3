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
import { updateVendorProfile } from '../controllers/vendorProfileController';

const router = Router();

// All vendor routes require a valid JWT and the VENDOR role
router.use(requireAuth, requireRole('VENDOR'));

// Profile
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

export default router;
