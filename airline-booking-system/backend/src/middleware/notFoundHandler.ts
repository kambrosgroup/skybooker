import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';

/**
 * 404 Not Found handler middleware
 * This middleware is called when no route matches the request
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = createError.notFound(
    `Route ${req.method} ${req.originalUrl} not found`,
    'ROUTE_NOT_FOUND',
    {
      method: req.method,
      path: req.originalUrl,
      availableRoutes: [
        'GET /api',
        'GET /health',
        'POST /api/auth/login',
        'POST /api/auth/register',
        'GET /api/flights/search',
        'POST /api/bookings',
        'GET /api/bookings/:pnr',
        'GET /api/admin/bookings',
        'POST /api/payments/create-intent'
      ]
    }
  );

  next(error);
};

export default notFoundHandler;

