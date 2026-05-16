import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { syncUser, requestAccess } from '../controllers/authController';

const router = Router();

// POST /api/auth/sync — called once by frontend after Auth0 login
router.post('/sync', requireAuth, syncUser);

// POST /api/auth/request-access — PENDING users submit their access reason
// Uses requireAuth only (no role check) so PENDING users can call it
router.post('/request-access', requireAuth, requestAccess);

export default router;
