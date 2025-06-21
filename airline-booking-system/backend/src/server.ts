import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import 'express-async-errors';

import { config } from './config/config';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import flightRoutes from './routes/flights';
import bookingRoutes from './routes/bookings';
import adminRoutes from './routes/admin';
import paymentRoutes from './routes/payments';

class Server {
  public app: Application;
  public httpServer: any;
  public io: SocketIOServer;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeErrorHandling();
    this.initializeSocketIO();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Compression middleware
    this.app.use(compression());

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    if (config.nodeEnv !== 'test') {
      this.app.use(morgan('combined', {
        stream: {
          write: (message: string) => logger.info(message.trim())
        }
      }));
    }

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimitWindow * 60 * 1000, // Convert minutes to milliseconds
      max: config.rateLimitMaxRequests,
      message: {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP, please try again later.',
          retryAfter: config.rateLimitWindow * 60
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use('/api/', limiter);

    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv,
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // API info endpoint
    this.app.get('/api', (req: Request, res: Response) => {
      res.status(200).json({
        message: 'Airline Booking System API',
        version: '1.0.0',
        documentation: '/api/docs',
        endpoints: {
          auth: '/api/auth',
          users: '/api/users',
          flights: '/api/flights',
          bookings: '/api/bookings',
          admin: '/api/admin',
          payments: '/api/payments'
        }
      });
    });
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/flights', flightRoutes);
    this.app.use('/api/bookings', bookingRoutes);
    this.app.use('/api/admin', adminRoutes);
    this.app.use('/api/payments', paymentRoutes);
  }

  private initializeSwagger(): void {
    if (config.enableSwagger) {
      const options = {
        definition: {
          openapi: '3.0.0',
          info: {
            title: 'Airline Booking System API',
            version: '1.0.0',
            description: 'Enterprise airline booking system with Amadeus integration',
            contact: {
              name: 'API Support',
              email: 'support@airline.com'
            }
          },
          servers: [
            {
              url: `http://localhost:${config.port}`,
              description: 'Development server'
            }
          ],
          components: {
            securitySchemes: {
              bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
              }
            }
          }
        },
        apis: ['./src/routes/*.ts', './src/controllers/*.ts']
      };

      const specs = swaggerJsdoc(options);
      this.app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Airline Booking API Documentation'
      }));
    }
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  private initializeSocketIO(): void {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Join user-specific room for notifications
      socket.on('join-user-room', (userId: string) => {
        socket.join(`user-${userId}`);
        logger.info(`User ${userId} joined their notification room`);
      });

      // Handle flight search updates
      socket.on('subscribe-flight-updates', (searchId: string) => {
        socket.join(`flight-search-${searchId}`);
        logger.info(`Client subscribed to flight updates for search: ${searchId}`);
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await connectDatabase();
      
      // Start server
      this.httpServer.listen(config.port, config.host, () => {
        logger.info(`🚀 Server running on ${config.host}:${config.port}`);
        logger.info(`📚 API Documentation available at http://${config.host}:${config.port}/api/docs`);
        logger.info(`🌍 Environment: ${config.nodeEnv}`);
        logger.info(`🔗 CORS enabled for: ${config.corsOrigin}`);
      });

      // Graceful shutdown
      process.on('SIGTERM', this.gracefulShutdown.bind(this));
      process.on('SIGINT', this.gracefulShutdown.bind(this));

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private gracefulShutdown(): void {
    logger.info('Received shutdown signal, closing server gracefully...');
    
    this.httpServer.close((err: any) => {
      if (err) {
        logger.error('Error during server shutdown:', err);
        process.exit(1);
      }
      
      logger.info('Server closed successfully');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  }
}

// Create and start server
const server = new Server();

if (require.main === module) {
  server.start().catch((error) => {
    logger.error('Failed to start application:', error);
    process.exit(1);
  });
}

export default server;
export { Server };

