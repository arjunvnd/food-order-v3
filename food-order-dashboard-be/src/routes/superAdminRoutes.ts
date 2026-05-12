import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { requireRole } from '../middlewares/rbac';
import {
  listMalls,
  createMall,
  assignMallAdmin,
} from '../controllers/superAdminController';

const router = Router();

router.use(requireAuth, requireRole('SUPER_ADMIN'));

router.get('/malls', listMalls);
router.post('/malls', createMall);
router.post('/malls/:mallId/admins', assignMallAdmin);

export default router;
