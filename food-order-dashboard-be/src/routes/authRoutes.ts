import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { syncUser } from '../controllers/authController';

const router = Router();

// POST /api/auth/sync — called once by frontend after Auth0 login
router.post('/sync', requireAuth, syncUser);

export default router;
