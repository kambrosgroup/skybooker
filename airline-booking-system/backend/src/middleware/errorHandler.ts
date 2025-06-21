import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'joi';
import { MongoError } from 'mongodb';
import mongoose from 'mongoose';
import { logger, logError } from '../utils/logger';
import { config } from '../config/config';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;
  public code?: string;
  public details?: any;

  constructor(message: string, statusCode: number, code?: string, details?: any) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error response interface
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path?: string;
    method?: string;
    stack?: string;
  };
}

// Handle Joi validation errors
const handleJoiError = (error: ValidationError): AppError => {
  const details = error.details.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message,
    value: detail.context?.value
  }));

  return new AppError(
    'Validation failed',
    400,
    'VALIDATION_ERROR',
    details
  );
};

// Handle MongoDB duplicate key errors
const handleDuplicateKeyError = (error: MongoError): AppError => {
  const field = Object.keys((error as any).keyValue)[0];
  const value = (error as any).keyValue[field];
  
  return new AppError(
    `Duplicate value for field: ${field}`,
    409,
    'DUPLICATE_KEY_ERROR',
    { field, value }
  );
};

// Handle MongoDB cast errors
const handleCastError = (error: mongoose.Error.CastError): AppError => {
  return new AppError(
    `Invalid ${error.path}: ${error.value}`,
    400,
    'INVALID_ID',
    { field: error.path, value: error.value }
  );
};

// Handle MongoDB validation errors
const handleValidationError = (error: mongoose.Error.ValidationError): AppError => {
  const errors = Object.values(error.errors).map(err => ({
    field: err.path,
    message: err.message,
    value: (err as any).value
  }));

  return new AppError(
    'Validation failed',
    400,
    'VALIDATION_ERROR',
    errors
  );
};

// Handle JWT errors
const handleJWTError = (): AppError => {
  return new AppError(
    'Invalid token. Please log in again.',
    401,
    'INVALID_TOKEN'
  );
};

// Handle JWT expired errors
const handleJWTExpiredError = (): AppError => {
  return new AppError(
    'Your token has expired. Please log in again.',
    401,
    'TOKEN_EXPIRED'
  );
};

// Send error response in development
const sendErrorDev = (err: AppError, req: Request, res: Response): void => {
  const errorResponse: ErrorResponse = {
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message,
      details: err.details,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      stack: err.stack
    }
  };

  res.status(err.statusCode).json(errorResponse);
};

// Send error response in production
const sendErrorProd = (err: AppError, req: Request, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    const errorResponse: ErrorResponse = {
      error: {
        code: err.code || 'OPERATIONAL_ERROR',
        message: err.message,
        details: err.details,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      }
    };

    res.status(err.statusCode).json(errorResponse);
  } else {
    // Programming or other unknown error: don't leak error details
    logError('Unexpected error occurred', err);

    const errorResponse: ErrorResponse = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong. Please try again later.',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      }
    };

    res.status(500).json(errorResponse);
  }
};

// Main error handling middleware
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logError(`Error occurred: ${error.message}`, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    stack: error.stack
  });

  // Handle specific error types
  if (err.name === 'ValidationError' && err.isJoi) {
    error = handleJoiError(err);
  } else if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  } else if (err.name === 'CastError') {
    error = handleCastError(err);
  } else if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  } else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  } else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  } else if (!err.isOperational) {
    // Convert non-operational errors to operational errors
    error = new AppError(
      config.nodeEnv === 'production' 
        ? 'Something went wrong. Please try again later.'
        : err.message,
      err.statusCode || 500,
      err.code || 'INTERNAL_ERROR'
    );
  }

  // Send error response
  if (config.nodeEnv === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

// Async error wrapper
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

// Create common error instances
export const createError = {
  badRequest: (message: string, code?: string, details?: any) => 
    new AppError(message, 400, code || 'BAD_REQUEST', details),
  
  unauthorized: (message: string = 'Unauthorized access', code?: string) => 
    new AppError(message, 401, code || 'UNAUTHORIZED'),
  
  forbidden: (message: string = 'Access forbidden', code?: string) => 
    new AppError(message, 403, code || 'FORBIDDEN'),
  
  notFound: (message: string = 'Resource not found', code?: string) => 
    new AppError(message, 404, code || 'NOT_FOUND'),
  
  conflict: (message: string, code?: string, details?: any) => 
    new AppError(message, 409, code || 'CONFLICT', details),
  
  unprocessableEntity: (message: string, code?: string, details?: any) => 
    new AppError(message, 422, code || 'UNPROCESSABLE_ENTITY', details),
  
  tooManyRequests: (message: string = 'Too many requests', code?: string) => 
    new AppError(message, 429, code || 'TOO_MANY_REQUESTS'),
  
  internal: (message: string = 'Internal server error', code?: string) => 
    new AppError(message, 500, code || 'INTERNAL_ERROR')
};

export default errorHandler;

