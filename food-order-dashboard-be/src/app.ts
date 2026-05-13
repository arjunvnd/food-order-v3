import express from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { apiReference } from '@scalar/express-api-reference';
import { errorHandler } from './middlewares/errorHandler';
import logger from './lib/logger';
import authRoutes from './routes/authRoutes';
import publicRoutes from './routes/publicRoutes';
import adminRoutes from './routes/adminRoutes';
import vendorRoutes from './routes/vendorRoutes';
import orderRoutes from './routes/orderRoutes';
import uploadRoutes from './routes/uploadRoutes';
import superAdminRoutes from './routes/superAdminRoutes';
import { openapiSpec } from './docs/openapi';
import config from './config/config';

const app = express();

// CORS — allow requests from the React frontend
app.use(cors({ origin: config.frontendUrl, credentials: true }));

// HTTP request logging
app.use(
  morgan(':method :url :status :res[content-length]b - :response-time ms', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }),
);

// Body parsing
app.use(express.json());

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API docs — served before the rate limiter so it is never throttled
app.use(
  '/api/docs',
  apiReference({
    spec: { content: openapiSpec },
    pageTitle: 'MallBite API Docs',
  }),
);

// Global rate limiter — applied to all API routes (excludes /api/docs above)
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
app.use(globalRateLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/super-admin', superAdminRoutes);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
