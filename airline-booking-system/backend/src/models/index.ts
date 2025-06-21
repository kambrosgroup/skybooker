// Export all models from a central location
export { User, IUser } from './User';
export { Flight, IFlight, IFlightSegment, IPriceBreakdown, ITravelerPricing } from './Flight';
export { Booking, IBooking, IPassenger, IFlightBooking, IPaymentInfo } from './Booking';
export { Airport, Airline, IAirport, IAirline } from './Airport';

// Re-export mongoose types for convenience
export { Document, Schema, Types } from 'mongoose';

// Model registry for dynamic access
export const models = {
  User,
  Flight,
  Booking,
  Airport,
  Airline
};

// Type definitions for model names
export type ModelName = keyof typeof models;

// Helper function to get model by name
export function getModel(name: ModelName) {
  return models[name];
}

// Database connection status
export { connectDatabase, disconnectDatabase, getDatabaseStatus, getDatabaseHealth } from '../config/database';

