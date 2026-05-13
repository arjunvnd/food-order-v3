import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';

export interface AppError extends Error {
  status?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const status = err.status || 500;
  if (status >= 500) {
    logger.error(`${req.method} ${req.path} → ${status} ${err.message}`, err);
  } else {
    logger.warn(`${req.method} ${req.path} → ${status} ${err.message}`);
  }
  res.status(status).json({
    message: err.message || 'Internal Server Error',
  });
};
