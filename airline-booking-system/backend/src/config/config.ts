import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

interface Config {
  // Server configuration
  port: number;
  host: string;
  nodeEnv: string;
  
  // Database configuration
  mongodbUri: string;
  mongodbTestUri: string;
  
  // JWT configuration
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpire: string;
  jwtRefreshExpire: string;
  
  // Amadeus API configuration
  amadeusApiKey: string;
  amadeusApiSecret: string;
  amadeusEnvironment: 'test' | 'production';
  
  // Stripe configuration
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  stripePublishableKey: string;
  
  // Email configuration
  sendgridApiKey: string;
  fromEmail: string;
  fromName: string;
  
  // Redis configuration
  redisUrl: string;
  redisPassword?: string;
  
  // File upload configuration
  maxFileSize: number;
  uploadPath: string;
  
  // Rate limiting configuration
  rateLimitWindow: number;
  rateLimitMaxRequests: number;
  
  // CORS configuration
  corsOrigin: string | string[];
  
  // Logging configuration
  logLevel: string;
  
  // Security configuration
  bcryptRounds: number;
  sessionSecret: string;
  
  // External service URLs
  frontendUrl: string;
  backendUrl: string;
  
  // Webhook configuration
  webhookSecret: string;
  
  // Admin configuration
  adminEmail: string;
  adminPassword: string;
  
  // Monitoring configuration
  sentryDsn?: string;
  googleAnalyticsId?: string;
  
  // Development configuration
  debug: boolean;
  enableSwagger: boolean;
}

const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'MONGODB_URI'
];

// Validate required environment variables
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Parse CORS origins
const parseCorsOrigin = (origin: string): string | string[] => {
  if (origin.includes(',')) {
    return origin.split(',').map(o => o.trim());
  }
  return origin;
};

export const config: Config = {
  // Server configuration
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  mongodbUri: process.env.MONGODB_URI!,
  mongodbTestUri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/airline-booking-test',
  
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  jwtExpire: process.env.JWT_EXPIRE || '15m',
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  
  // Amadeus API configuration
  amadeusApiKey: process.env.AMADEUS_API_KEY || '',
  amadeusApiSecret: process.env.AMADEUS_API_SECRET || '',
  amadeusEnvironment: (process.env.AMADEUS_ENVIRONMENT as 'test' | 'production') || 'test',
  
  // Stripe configuration
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  
  // Email configuration
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  fromEmail: process.env.FROM_EMAIL || 'noreply@airline.com',
  fromName: process.env.FROM_NAME || 'Airline Booking System',
  
  // Redis configuration
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisPassword: process.env.REDIS_PASSWORD,
  
  // File upload configuration
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  uploadPath: process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads'),
  
  // Rate limiting configuration
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  
  // CORS configuration
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN || 'http://localhost:3000'),
  
  // Logging configuration
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Security configuration
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  sessionSecret: process.env.SESSION_SECRET || 'default-session-secret',
  
  // External service URLs
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
  
  // Webhook configuration
  webhookSecret: process.env.WEBHOOK_SECRET || 'default-webhook-secret',
  
  // Admin configuration
  adminEmail: process.env.ADMIN_EMAIL || 'admin@airline.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  
  // Monitoring configuration
  sentryDsn: process.env.SENTRY_DSN,
  googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID,
  
  // Development configuration
  debug: process.env.DEBUG === 'true',
  enableSwagger: process.env.ENABLE_SWAGGER !== 'false'
};

// Validate Amadeus configuration in production
if (config.nodeEnv === 'production' && (!config.amadeusApiKey || !config.amadeusApiSecret)) {
  console.warn('Warning: Amadeus API credentials not configured. Flight search will not work.');
}

// Validate Stripe configuration for payment processing
if (config.nodeEnv === 'production' && !config.stripeSecretKey) {
  console.warn('Warning: Stripe configuration not found. Payment processing will not work.');
}

export default config;

