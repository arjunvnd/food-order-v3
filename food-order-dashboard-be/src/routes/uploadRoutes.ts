import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { requireRole } from '../middlewares/rbac';
import { upload } from '../middlewares/upload';
import { uploadMenuItemImage } from '../controllers/uploadController';

const router = Router();

// POST /api/uploads/menu-item-image
router.post(
  '/menu-item-image',
  requireAuth,
  requireRole('VENDOR'),
  upload.single('image'),
  uploadMenuItemImage,
);

export default router;
