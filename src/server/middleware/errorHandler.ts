import { Request, Response, NextFunction, RequestHandler } from 'express';
import env from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error('Error:', err);

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(env.nodeEnv === 'development' && { stack: err.stack }),
  });
};

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export const asyncHandler = (fn: AsyncHandler): RequestHandler => {
  return (req, res, next) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
};
