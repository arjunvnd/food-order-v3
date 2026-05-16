import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { requireRole } from '../middlewares/rbac';
import {
  listMalls,
  createMall,
  assignMallAdmin,
  listRoles,
  listUsers,
  updateUserRole,
  listAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
} from '../controllers/superAdminController';

const router = Router();

router.use(requireAuth, requireRole('SUPER_ADMIN'));

router.get('/malls', listMalls);
router.post('/malls', createMall);
router.post('/malls/:mallId/admins', assignMallAdmin);

// User management
router.get('/roles', listRoles);
router.get('/users', listUsers);
router.patch('/users/:userId/role', updateUserRole);

// Access request management
router.get('/access-requests', listAccessRequests);
router.patch('/access-requests/:userId/approve', approveAccessRequest);
router.patch('/access-requests/:userId/reject', rejectAccessRequest);

export default router;
