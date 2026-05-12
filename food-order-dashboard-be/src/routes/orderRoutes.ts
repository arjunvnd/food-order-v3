import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  placeOrder,
  getOrderStatus,
  getOrdersBySession,
  payOrder,
} from '../controllers/orderController';

const router = Router();

// Strict rate limit on order placement to prevent abuse from a single IP
const orderRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many orders submitted, please try again later.' },
});

router.post('/', orderRateLimiter, placeOrder);
// GET /api/orders?sessionId=xxx — fetch all orders for this guest session
router.get('/', getOrdersBySession);
router.get('/:orderId', getOrderStatus);
router.post('/:orderId/pay', payOrder);

export default router;
