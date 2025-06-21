import winston from 'winston';
import path from 'path';
import { config } from '../config/config';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Add colors to winston
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

// Define log transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

// Add file transports in production
if (config.nodeEnv === 'production') {
  // Ensure logs directory exists
  const logsDir = path.join(__dirname, '../../logs');
  
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: config.logLevel,
  levels,
  format,
  transports,
  exitOnError: false
});

// Create a stream object for Morgan HTTP logging
export const loggerStream = {
  write: (message: string) => {
    logger.http(message.trim());
  }
};

// Helper functions for different log levels
export const logError = (message: string, error?: any) => {
  if (error) {
    logger.error(`${message}: ${error.message}`, { 
      stack: error.stack,
      ...error 
    });
  } else {
    logger.error(message);
  }
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

export const logHttp = (message: string, meta?: any) => {
  logger.http(message, meta);
};

// Request logging helper
export const logRequest = (req: any, res: any, responseTime?: number) => {
  const logData = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    responseTime: responseTime ? `${responseTime}ms` : undefined,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  };

  if (res.statusCode >= 400) {
    logger.error(`HTTP ${req.method} ${req.url} - ${res.statusCode}`, logData);
  } else {
    logger.http(`HTTP ${req.method} ${req.url} - ${res.statusCode}`, logData);
  }
};

// Database operation logging
export const logDatabaseOperation = (operation: string, collection: string, duration?: number, error?: any) => {
  const logData = {
    operation,
    collection,
    duration: duration ? `${duration}ms` : undefined,
    timestamp: new Date().toISOString()
  };

  if (error) {
    logger.error(`Database ${operation} failed on ${collection}`, { ...logData, error: error.message });
  } else {
    logger.debug(`Database ${operation} on ${collection}`, logData);
  }
};

// API integration logging
export const logApiCall = (service: string, endpoint: string, method: string, statusCode?: number, duration?: number, error?: any) => {
  const logData = {
    service,
    endpoint,
    method,
    statusCode,
    duration: duration ? `${duration}ms` : undefined,
    timestamp: new Date().toISOString()
  };

  if (error) {
    logger.error(`API call to ${service} failed`, { ...logData, error: error.message });
  } else if (statusCode && statusCode >= 400) {
    logger.warn(`API call to ${service} returned ${statusCode}`, logData);
  } else {
    logger.info(`API call to ${service} successful`, logData);
  }
};

// Business logic logging
export const logBusinessEvent = (event: string, userId?: string, bookingId?: string, meta?: any) => {
  const logData = {
    event,
    userId,
    bookingId,
    timestamp: new Date().toISOString(),
    ...meta
  };

  logger.info(`Business Event: ${event}`, logData);
};

// Security event logging
export const logSecurityEvent = (event: string, userId?: string, ip?: string, userAgent?: string, meta?: any) => {
  const logData = {
    event,
    userId,
    ip,
    userAgent,
    timestamp: new Date().toISOString(),
    ...meta
  };

  logger.warn(`Security Event: ${event}`, logData);
};

export default logger;

