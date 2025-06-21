import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/User';
import { JWTUtils, TokenBlacklist } from '../utils/jwt';
import { createError } from './errorHandler';
import { logSecurityEvent } from '../utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      token?: string;
    }
  }
}

/**
 * Authentication middleware to verify JWT tokens
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract token from Authorization header
    const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      logSecurityEvent('Missing authentication token', undefined, req.ip, req.get('User-Agent'));
      throw createError.unauthorized('Access token is required', 'MISSING_TOKEN');
    }

    // Check if token is blacklisted
    if (TokenBlacklist.isBlacklisted(token)) {
      logSecurityEvent('Blacklisted token used', undefined, req.ip, req.get('User-Agent'));
      throw createError.unauthorized('Token has been revoked', 'TOKEN_REVOKED');
    }

    // Verify token
    const payload = JWTUtils.verifyAccessToken(token);
    
    // Find user by ID
    const user = await User.findById(payload.userId).select('+password');
    
    if (!user) {
      logSecurityEvent('Token user not found', payload.userId, req.ip, req.get('User-Agent'));
      throw createError.unauthorized('User not found', 'USER_NOT_FOUND');
    }

    // Check if user is active
    if (!user.isActive) {
      logSecurityEvent('Inactive user attempted access', user._id.toString(), req.ip, req.get('User-Agent'));
      throw createError.unauthorized('Account is deactivated', 'ACCOUNT_DEACTIVATED');
    }

    // Check if account is locked
    if (user.isLocked()) {
      logSecurityEvent('Locked account attempted access', user._id.toString(), req.ip, req.get('User-Agent'));
      throw createError.unauthorized('Account is temporarily locked', 'ACCOUNT_LOCKED');
    }

    // Attach user and token to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware (doesn't throw error if no token)
 */
export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (token && !TokenBlacklist.isBlacklisted(token)) {
      const payload = JWTUtils.verifyAccessToken(token);
      const user = await User.findById(payload.userId);
      
      if (user && user.isActive && !user.isLocked()) {
        req.user = user;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // Ignore authentication errors in optional middleware
    next();
  }
};

/**
 * Authorization middleware to check user roles
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw createError.unauthorized('Authentication required', 'AUTHENTICATION_REQUIRED');
    }

    if (!roles.includes(req.user.role)) {
      logSecurityEvent('Unauthorized role access attempt', req.user._id.toString(), req.ip, req.get('User-Agent'), {
        requiredRoles: roles,
        userRole: req.user.role,
        path: req.path
      });
      throw createError.forbidden('Insufficient permissions', 'INSUFFICIENT_PERMISSIONS');
    }

    next();
  };
};

/**
 * Admin-only authorization middleware
 */
export const requireAdmin = authorize('admin');

/**
 * Agent or Admin authorization middleware
 */
export const requireAgentOrAdmin = authorize('agent', 'admin');

/**
 * User ownership verification middleware
 */
export const requireOwnership = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw createError.unauthorized('Authentication required', 'AUTHENTICATION_REQUIRED');
    }

    const resourceUserId = req.params[userIdParam];
    const currentUserId = req.user._id.toString();

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // User can only access their own resources
    if (resourceUserId !== currentUserId) {
      logSecurityEvent('Unauthorized resource access attempt', currentUserId, req.ip, req.get('User-Agent'), {
        requestedUserId: resourceUserId,
        path: req.path
      });
      throw createError.forbidden('Access denied to this resource', 'RESOURCE_ACCESS_DENIED');
    }

    next();
  };
};

/**
 * Rate limiting middleware for authentication endpoints
 */
export const authRateLimit = (maxAttempts: number = 5, windowMinutes: number = 15) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;

    const userAttempts = attempts.get(key);

    if (!userAttempts || now > userAttempts.resetTime) {
      // Reset or initialize attempts
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userAttempts.count >= maxAttempts) {
      logSecurityEvent('Rate limit exceeded for authentication', undefined, req.ip, req.get('User-Agent'));
      throw createError.tooManyRequests(
        `Too many authentication attempts. Try again in ${Math.ceil((userAttempts.resetTime - now) / 60000)} minutes.`,
        'AUTH_RATE_LIMIT_EXCEEDED'
      );
    }

    userAttempts.count++;
    next();
  };
};

/**
 * Email verification requirement middleware
 */
export const requireEmailVerification = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw createError.unauthorized('Authentication required', 'AUTHENTICATION_REQUIRED');
  }

  if (!req.user.isEmailVerified) {
    throw createError.forbidden('Email verification required', 'EMAIL_VERIFICATION_REQUIRED');
  }

  next();
};

/**
 * API key authentication middleware (for external integrations)
 */
export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw createError.unauthorized('API key is required', 'MISSING_API_KEY');
    }

    // In a real implementation, you would validate the API key against a database
    // For now, we'll use a simple validation
    if (!apiKey.startsWith('ak_') || apiKey.length !== 51) {
      logSecurityEvent('Invalid API key format', undefined, req.ip, req.get('User-Agent'));
      throw createError.unauthorized('Invalid API key format', 'INVALID_API_KEY');
    }

    // TODO: Implement proper API key validation against database
    // const apiKeyRecord = await ApiKey.findOne({ key: apiKey, isActive: true });
    // if (!apiKeyRecord) {
    //   throw createError.unauthorized('Invalid API key', 'INVALID_API_KEY');
    // }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user can perform action on booking
 */
export const canAccessBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw createError.unauthorized('Authentication required', 'AUTHENTICATION_REQUIRED');
    }

    const { pnr } = req.params;
    
    // Import Booking model here to avoid circular dependency
    const { Booking } = await import('../models/Booking');
    const booking = await Booking.findOne({ pnr: pnr.toUpperCase() });

    if (!booking) {
      throw createError.notFound('Booking not found', 'BOOKING_NOT_FOUND');
    }

    // Admin can access any booking
    if (req.user.role === 'admin') {
      return next();
    }

    // User can only access their own bookings
    if (booking.userId.toString() !== req.user._id.toString()) {
      logSecurityEvent('Unauthorized booking access attempt', req.user._id.toString(), req.ip, req.get('User-Agent'), {
        pnr,
        bookingUserId: booking.userId.toString()
      });
      throw createError.forbidden('Access denied to this booking', 'BOOKING_ACCESS_DENIED');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to log successful authentication
 */
export const logAuthentication = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user) {
    // Update last login time
    req.user.lastLogin = new Date();
    req.user.save().catch(err => console.error('Failed to update last login:', err));

    // Reset login attempts on successful authentication
    if (req.user.loginAttempts > 0) {
      req.user.resetLoginAttempts().catch(err => console.error('Failed to reset login attempts:', err));
    }
  }

  next();
};

export default {
  authenticate,
  optionalAuthenticate,
  authorize,
  requireAdmin,
  requireAgentOrAdmin,
  requireOwnership,
  authRateLimit,
  requireEmailVerification,
  authenticateApiKey,
  canAccessBooking,
  logAuthentication
};

