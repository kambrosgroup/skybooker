import mongoose from 'mongoose';
import { config } from './config';
import { logger } from '../utils/logger';

interface ConnectionOptions {
  maxPoolSize?: number;
  serverSelectionTimeoutMS?: number;
  socketTimeoutMS?: number;
  family?: number;
  bufferCommands?: boolean;
  bufferMaxEntries?: number;
}

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Database already connected');
      return;
    }

    try {
      const mongoUri = config.nodeEnv === 'test' ? config.mongodbTestUri : config.mongodbUri;
      
      const options: ConnectionOptions = {
        maxPoolSize: 10, // Maximum number of connections in the connection pool
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4, // Use IPv4, skip trying IPv6
        bufferCommands: false, // Disable mongoose buffering
        bufferMaxEntries: 0 // Disable mongoose buffering
      };

      await mongoose.connect(mongoUri, options);
      
      this.isConnected = true;
      logger.info(`✅ Database connected successfully to ${config.nodeEnv} environment`);
      
      // Set up connection event listeners
      this.setupEventListeners();
      
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('✅ Database disconnected successfully');
    } catch (error) {
      logger.error('❌ Database disconnection failed:', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public async dropDatabase(): Promise<void> {
    if (config.nodeEnv !== 'test') {
      throw new Error('Database can only be dropped in test environment');
    }

    try {
      await mongoose.connection.dropDatabase();
      logger.info('✅ Test database dropped successfully');
    } catch (error) {
      logger.error('❌ Failed to drop test database:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    // Connection successful
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });

    // Connection error
    mongoose.connection.on('error', (error) => {
      logger.error('Mongoose connection error:', error);
      this.isConnected = false;
    });

    // Connection disconnected
    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    // Connection reconnected
    mongoose.connection.on('reconnected', () => {
      logger.info('Mongoose reconnected to MongoDB');
      this.isConnected = true;
    });

    // If the Node process ends, close the Mongoose connection
    process.on('SIGINT', async () => {
      try {
        await this.disconnect();
        logger.info('Mongoose connection closed through app termination');
        process.exit(0);
      } catch (error) {
        logger.error('Error closing mongoose connection:', error);
        process.exit(1);
      }
    });
  }

  public async healthCheck(): Promise<{
    status: string;
    readyState: number;
    host?: string;
    port?: number;
    name?: string;
  }> {
    const connection = mongoose.connection;
    
    return {
      status: this.getConnectionStatus() ? 'connected' : 'disconnected',
      readyState: connection.readyState,
      host: connection.host,
      port: connection.port,
      name: connection.name
    };
  }
}

// Export singleton instance
export const databaseConnection = DatabaseConnection.getInstance();

// Convenience function for connecting to database
export const connectDatabase = async (): Promise<void> => {
  await databaseConnection.connect();
};

// Convenience function for disconnecting from database
export const disconnectDatabase = async (): Promise<void> => {
  await databaseConnection.disconnect();
};

// Convenience function for getting connection status
export const getDatabaseStatus = (): boolean => {
  return databaseConnection.getConnectionStatus();
};

// Convenience function for database health check
export const getDatabaseHealth = async () => {
  return await databaseConnection.healthCheck();
};

export default databaseConnection;

