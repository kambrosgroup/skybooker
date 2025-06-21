import { Types } from 'mongoose';
import { Booking, IBooking } from '../models/Booking';
import { User, IUser } from '../models/User';
import { Flight, IFlight } from '../models/Flight';
import { AmadeusService, IAmadeusFlightOffer, IFlightBookingRequest } from './amadeusService';
import { createError } from '../middleware/errorHandler';
import { logger, logBusinessEvent } from '../utils/logger';
import { generatePNR, generateBookingReference } from '../utils/pnrGenerator';
import { EmailService } from './emailService';

// Booking creation request interface
export interface IBookingCreateRequest {
  userId: string;
  flightOffers: IAmadeusFlightOffer[];
  passengers: Array<{
    type: 'adult' | 'child' | 'infant';
    title: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'M' | 'F';
    nationality?: string;
    passportNumber?: string;
    passportExpiry?: string;
    passportCountry?: string;
    email?: string;
    phone?: string;
    specialRequests?: string[];
    frequentFlyerNumber?: string;
    seatPreference?: string;
    mealPreference?: string;
  }>;
  contactInfo: {
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  paymentInfo?: {
    method: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';
    amount: number;
    currency: string;
    paymentIntentId?: string;
  };
  specialRequests?: string[];
  remarks?: string;
  travelInsurance?: boolean;
  marketingConsent?: boolean;
}

// Booking update request interface
export interface IBookingUpdateRequest {
  status?: 'confirmed' | 'cancelled' | 'pending' | 'expired' | 'refunded';
  passengers?: Array<{
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    specialRequests?: string[];
    seatAssignment?: string;
  }>;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
  specialRequests?: string[];
  remarks?: string;
}

// PNR search criteria interface
export interface IPNRSearchCriteria {
  pnr?: string;
  bookingReference?: string;
  email?: string;
  lastName?: string;
  departureDate?: Date;
  flightNumber?: string;
  userId?: string;
  status?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Booking Service
 * Handles all booking operations including creation, updates, cancellation, and PNR management
 */
export class BookingService {
  /**
   * Create a new flight booking
   */
  static async createBooking(bookingData: IBookingCreateRequest): Promise<IBooking> {
    try {
      logger.info('Creating new flight booking', { 
        userId: bookingData.userId,
        passengerCount: bookingData.passengers.length,
        flightOfferCount: bookingData.flightOffers.length
      });

      // Validate user exists
      const user = await User.findById(bookingData.userId);
      if (!user) {
        throw createError.notFound('User not found', 'USER_NOT_FOUND');
      }

      // Generate PNR and booking reference
      const pnr = generatePNR();
      const bookingReference = generateBookingReference();

      // Calculate total price from flight offers
      const totalPrice = bookingData.flightOffers.reduce((sum, offer) => {
        return sum + parseFloat(offer.price.total);
      }, 0);

      // Prepare Amadeus booking request
      const amadeusBookingRequest: IFlightBookingRequest = {
        data: {
          type: 'flight-order',
          flightOffers: bookingData.flightOffers,
          travelers: bookingData.passengers.map((passenger, index) => ({
            id: (index + 1).toString(),
            dateOfBirth: passenger.dateOfBirth,
            name: {
              firstName: passenger.firstName,
              lastName: passenger.lastName
            },
            gender: passenger.gender,
            contact: {
              emailAddress: passenger.email || bookingData.contactInfo.email,
              phones: [{
                deviceType: 'MOBILE',
                countryCallingCode: '1', // Default to US, should be extracted from phone
                number: passenger.phone || bookingData.contactInfo.phone
              }]
            },
            documents: passenger.passportNumber ? [{
              documentType: 'PASSPORT',
              number: passenger.passportNumber,
              expiryDate: passenger.passportExpiry,
              issuanceCountry: passenger.passportCountry,
              nationality: passenger.nationality,
              holder: true
            }] : undefined
          })),
          contacts: [{
            addresseeName: {
              firstName: bookingData.passengers[0].firstName,
              lastName: bookingData.passengers[0].lastName
            },
            purpose: 'STANDARD',
            phones: [{
              deviceType: 'MOBILE',
              countryCallingCode: '1',
              number: bookingData.contactInfo.phone
            }],
            emailAddress: bookingData.contactInfo.email,
            address: {
              lines: [bookingData.contactInfo.address.street],
              postalCode: bookingData.contactInfo.address.postalCode,
              cityName: bookingData.contactInfo.address.city,
              countryCode: bookingData.contactInfo.address.country
            }
          }],
          remarks: bookingData.remarks ? {
            general: [{
              subType: 'GENERAL_MISCELLANEOUS',
              text: bookingData.remarks
            }]
          } : undefined
        }
      };

      // Create booking with Amadeus (if not in test mode)
      let amadeusOrderId: string | undefined;
      let amadeusResponse: any;

      try {
        amadeusResponse = await AmadeusService.createFlightBooking(amadeusBookingRequest);
        amadeusOrderId = amadeusResponse.id;
        
        logger.info('Amadeus booking created successfully', { 
          amadeusOrderId,
          pnr 
        });
      } catch (amadeusError: any) {
        logger.error('Amadeus booking failed, creating local booking only', { 
          error: amadeusError.message,
          pnr 
        });
        // Continue with local booking creation even if Amadeus fails
      }

      // Create booking in our database
      const booking = new Booking({
        userId: new Types.ObjectId(bookingData.userId),
        pnr,
        bookingReference,
        amadeusOrderId,
        status: amadeusOrderId ? 'confirmed' : 'pending',
        
        // Flight information
        flights: bookingData.flightOffers.map(offer => ({
          amadeusOfferId: offer.id,
          flightNumber: `${offer.itineraries[0].segments[0].carrierCode}${offer.itineraries[0].segments[0].number}`,
          carrierCode: offer.itineraries[0].segments[0].carrierCode,
          origin: offer.itineraries[0].segments[0].departure.iataCode,
          destination: offer.itineraries[0].segments[offer.itineraries[0].segments.length - 1].arrival.iataCode,
          departureDateTime: new Date(offer.itineraries[0].segments[0].departure.at),
          arrivalDateTime: new Date(offer.itineraries[0].segments[offer.itineraries[0].segments.length - 1].arrival.at),
          duration: offer.itineraries[0].duration,
          segments: offer.itineraries[0].segments.map(segment => ({
            segmentId: segment.id,
            departure: {
              iataCode: segment.departure.iataCode,
              terminal: segment.departure.terminal,
              at: new Date(segment.departure.at)
            },
            arrival: {
              iataCode: segment.arrival.iataCode,
              terminal: segment.arrival.terminal,
              at: new Date(segment.arrival.at)
            },
            carrierCode: segment.carrierCode,
            number: segment.number,
            aircraft: {
              code: segment.aircraft.code
            },
            duration: segment.duration,
            stops: segment.numberOfStops
          }))
        })),

        // Passenger information
        passengers: bookingData.passengers.map((passenger, index) => ({
          id: `passenger_${index + 1}`,
          type: passenger.type,
          title: passenger.title,
          firstName: passenger.firstName,
          lastName: passenger.lastName,
          dateOfBirth: new Date(passenger.dateOfBirth),
          gender: passenger.gender,
          nationality: passenger.nationality,
          passport: passenger.passportNumber ? {
            number: passenger.passportNumber,
            expiryDate: passenger.passportExpiry ? new Date(passenger.passportExpiry) : undefined,
            issuingCountry: passenger.passportCountry
          } : undefined,
          contact: {
            email: passenger.email || bookingData.contactInfo.email,
            phone: passenger.phone || bookingData.contactInfo.phone
          },
          specialRequests: passenger.specialRequests || [],
          frequentFlyerNumber: passenger.frequentFlyerNumber,
          preferences: {
            seat: passenger.seatPreference,
            meal: passenger.mealPreference
          }
        })),

        // Contact information
        contactInfo: {
          email: bookingData.contactInfo.email,
          phone: bookingData.contactInfo.phone,
          address: bookingData.contactInfo.address,
          emergencyContact: bookingData.contactInfo.emergencyContact
        },

        // Pricing information
        pricing: {
          currency: bookingData.flightOffers[0].price.currency,
          basePrice: bookingData.flightOffers.reduce((sum, offer) => sum + parseFloat(offer.price.base), 0),
          taxes: bookingData.flightOffers.reduce((sum, offer) => {
            return sum + offer.price.fees.reduce((feeSum, fee) => feeSum + parseFloat(fee.amount), 0);
          }, 0),
          fees: [],
          totalPrice,
          breakdown: bookingData.flightOffers.map(offer => ({
            offerId: offer.id,
            basePrice: parseFloat(offer.price.base),
            taxes: offer.price.fees.reduce((sum, fee) => sum + parseFloat(fee.amount), 0),
            total: parseFloat(offer.price.total)
          }))
        },

        // Payment information
        payment: bookingData.paymentInfo ? {
          method: bookingData.paymentInfo.method,
          amount: bookingData.paymentInfo.amount,
          currency: bookingData.paymentInfo.currency,
          status: 'pending',
          paymentIntentId: bookingData.paymentInfo.paymentIntentId,
          paidAt: undefined
        } : undefined,

        // Additional information
        specialRequests: bookingData.specialRequests || [],
        remarks: bookingData.remarks,
        travelInsurance: bookingData.travelInsurance || false,
        marketingConsent: bookingData.marketingConsent || false,

        // Metadata
        bookingSource: 'web',
        ipAddress: undefined, // Should be passed from request
        userAgent: undefined, // Should be passed from request
        
        // Timestamps
        bookedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      });

      // Save booking to database
      await booking.save();

      // Log business event
      logBusinessEvent('Booking created', bookingData.userId, {
        bookingId: booking._id.toString(),
        pnr,
        bookingReference,
        amadeusOrderId,
        totalPrice,
        passengerCount: bookingData.passengers.length,
        status: booking.status
      });

      // Send confirmation email (async, don't wait)
      EmailService.sendBookingConfirmation(booking).catch(error => {
        logger.error('Failed to send booking confirmation email', { 
          bookingId: booking._id.toString(),
          error: error.message 
        });
      });

      logger.info('Booking created successfully', { 
        bookingId: booking._id.toString(),
        pnr,
        status: booking.status 
      });

      return booking;

    } catch (error: any) {
      logger.error('Booking creation failed', { 
        error: error.message,
        userId: bookingData.userId 
      });
      throw error;
    }
  }

  /**
   * Get booking by ID
   */
  static async getBookingById(bookingId: string, userId?: string): Promise<IBooking> {
    try {
      const query: any = { _id: bookingId };
      if (userId) {
        query.userId = userId;
      }

      const booking = await Booking.findOne(query)
        .populate('userId', 'firstName lastName email')
        .lean();

      if (!booking) {
        throw createError.notFound('Booking not found', 'BOOKING_NOT_FOUND');
      }

      return booking as IBooking;

    } catch (error: any) {
      logger.error('Failed to get booking by ID', { 
        bookingId,
        userId,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Search bookings by PNR or other criteria
   */
  static async searchBookings(criteria: IPNRSearchCriteria): Promise<IBooking[]> {
    try {
      const query: any = {};

      // Build search query
      if (criteria.pnr) {
        query.pnr = criteria.pnr.toUpperCase();
      }
      if (criteria.bookingReference) {
        query.bookingReference = criteria.bookingReference.toUpperCase();
      }
      if (criteria.email) {
        query['contactInfo.email'] = { $regex: criteria.email, $options: 'i' };
      }
      if (criteria.lastName) {
        query['passengers.lastName'] = { $regex: criteria.lastName, $options: 'i' };
      }
      if (criteria.flightNumber) {
        query['flights.flightNumber'] = criteria.flightNumber.toUpperCase();
      }
      if (criteria.userId) {
        query.userId = criteria.userId;
      }
      if (criteria.status) {
        query.status = criteria.status;
      }
      if (criteria.departureDate) {
        const startOfDay = new Date(criteria.departureDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(criteria.departureDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        query['flights.departureDateTime'] = {
          $gte: startOfDay,
          $lte: endOfDay
        };
      }
      if (criteria.dateRange) {
        query.bookedAt = {
          $gte: criteria.dateRange.start,
          $lte: criteria.dateRange.end
        };
      }

      const bookings = await Booking.find(query)
        .populate('userId', 'firstName lastName email')
        .sort({ bookedAt: -1 })
        .limit(100) // Limit results for performance
        .lean();

      logger.info('Booking search completed', { 
        criteria,
        resultCount: bookings.length 
      });

      return bookings as IBooking[];

    } catch (error: any) {
      logger.error('Booking search failed', { 
        criteria,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Update booking
   */
  static async updateBooking(
    bookingId: string, 
    updateData: IBookingUpdateRequest, 
    userId?: string
  ): Promise<IBooking> {
    try {
      const query: any = { _id: bookingId };
      if (userId) {
        query.userId = userId;
      }

      const booking = await Booking.findOne(query);
      if (!booking) {
        throw createError.notFound('Booking not found', 'BOOKING_NOT_FOUND');
      }

      // Update fields
      if (updateData.status) {
        booking.status = updateData.status;
        booking.statusHistory.push({
          status: updateData.status,
          changedAt: new Date(),
          reason: 'Manual update'
        });
      }

      if (updateData.passengers) {
        updateData.passengers.forEach(passengerUpdate => {
          const passenger = booking.passengers.find(p => p.id === passengerUpdate.id);
          if (passenger) {
            if (passengerUpdate.firstName) passenger.firstName = passengerUpdate.firstName;
            if (passengerUpdate.lastName) passenger.lastName = passengerUpdate.lastName;
            if (passengerUpdate.email) passenger.contact.email = passengerUpdate.email;
            if (passengerUpdate.phone) passenger.contact.phone = passengerUpdate.phone;
            if (passengerUpdate.specialRequests) passenger.specialRequests = passengerUpdate.specialRequests;
            if (passengerUpdate.seatAssignment) passenger.seatAssignment = passengerUpdate.seatAssignment;
          }
        });
      }

      if (updateData.contactInfo) {
        if (updateData.contactInfo.email) booking.contactInfo.email = updateData.contactInfo.email;
        if (updateData.contactInfo.phone) booking.contactInfo.phone = updateData.contactInfo.phone;
        if (updateData.contactInfo.address) {
          Object.assign(booking.contactInfo.address, updateData.contactInfo.address);
        }
      }

      if (updateData.specialRequests) {
        booking.specialRequests = updateData.specialRequests;
      }

      if (updateData.remarks) {
        booking.remarks = updateData.remarks;
      }

      booking.updatedAt = new Date();

      await booking.save();

      // Log business event
      logBusinessEvent('Booking updated', userId || 'system', {
        bookingId: booking._id.toString(),
        pnr: booking.pnr,
        updateData
      });

      logger.info('Booking updated successfully', { 
        bookingId: booking._id.toString(),
        pnr: booking.pnr 
      });

      return booking;

    } catch (error: any) {
      logger.error('Booking update failed', { 
        bookingId,
        updateData,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Cancel booking
   */
  static async cancelBooking(bookingId: string, reason: string, userId?: string): Promise<IBooking> {
    try {
      const query: any = { _id: bookingId };
      if (userId) {
        query.userId = userId;
      }

      const booking = await Booking.findOne(query);
      if (!booking) {
        throw createError.notFound('Booking not found', 'BOOKING_NOT_FOUND');
      }

      if (booking.status === 'cancelled') {
        throw createError.badRequest('Booking is already cancelled', 'BOOKING_ALREADY_CANCELLED');
      }

      // Cancel with Amadeus if order exists
      if (booking.amadeusOrderId) {
        try {
          await AmadeusService.cancelFlightOrder(booking.amadeusOrderId);
          logger.info('Amadeus order cancelled', { 
            amadeusOrderId: booking.amadeusOrderId,
            pnr: booking.pnr 
          });
        } catch (amadeusError: any) {
          logger.error('Failed to cancel Amadeus order', { 
            amadeusOrderId: booking.amadeusOrderId,
            error: amadeusError.message 
          });
          // Continue with local cancellation even if Amadeus fails
        }
      }

      // Update booking status
      booking.status = 'cancelled';
      booking.statusHistory.push({
        status: 'cancelled',
        changedAt: new Date(),
        reason
      });
      booking.cancelledAt = new Date();
      booking.cancellationReason = reason;
      booking.updatedAt = new Date();

      await booking.save();

      // Log business event
      logBusinessEvent('Booking cancelled', userId || 'system', {
        bookingId: booking._id.toString(),
        pnr: booking.pnr,
        reason
      });

      // Send cancellation email (async)
      EmailService.sendBookingCancellation(booking, reason).catch(error => {
        logger.error('Failed to send booking cancellation email', { 
          bookingId: booking._id.toString(),
          error: error.message 
        });
      });

      logger.info('Booking cancelled successfully', { 
        bookingId: booking._id.toString(),
        pnr: booking.pnr,
        reason 
      });

      return booking;

    } catch (error: any) {
      logger.error('Booking cancellation failed', { 
        bookingId,
        reason,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get user bookings
   */
  static async getUserBookings(
    userId: string, 
    options: {
      status?: string;
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ bookings: IBooking[]; total: number }> {
    try {
      const query: any = { userId };
      
      if (options.status) {
        query.status = options.status;
      }

      const limit = options.limit || 20;
      const offset = options.offset || 0;
      const sortBy = options.sortBy || 'bookedAt';
      const sortOrder = options.sortOrder || 'desc';

      const [bookings, total] = await Promise.all([
        Booking.find(query)
          .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
          .limit(limit)
          .skip(offset)
          .lean(),
        Booking.countDocuments(query)
      ]);

      logger.info('User bookings retrieved', { 
        userId,
        resultCount: bookings.length,
        total 
      });

      return {
        bookings: bookings as IBooking[],
        total
      };

    } catch (error: any) {
      logger.error('Failed to get user bookings', { 
        userId,
        options,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get booking statistics
   */
  static async getBookingStats(dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const matchCriteria: any = {};
      
      if (dateRange) {
        matchCriteria.bookedAt = {
          $gte: dateRange.start,
          $lte: dateRange.end
        };
      }

      const stats = await Booking.aggregate([
        { $match: matchCriteria },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: '$pricing.totalPrice' },
            avgBookingValue: { $avg: '$pricing.totalPrice' },
            confirmedBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
            },
            cancelledBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            },
            pendingBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            totalPassengers: { $sum: { $size: '$passengers' } },
            currencies: { $addToSet: '$pricing.currency' }
          }
        }
      ]);

      // Get booking trends by day
      const trends = await Booking.aggregate([
        { $match: matchCriteria },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$bookedAt'
              }
            },
            bookings: { $sum: 1 },
            revenue: { $sum: '$pricing.totalPrice' },
            passengers: { $sum: { $size: '$passengers' } }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      return {
        summary: stats[0] || {
          totalBookings: 0,
          totalRevenue: 0,
          avgBookingValue: 0,
          confirmedBookings: 0,
          cancelledBookings: 0,
          pendingBookings: 0,
          totalPassengers: 0,
          currencies: []
        },
        trends,
        dateRange
      };

    } catch (error: any) {
      logger.error('Failed to get booking statistics', { 
        dateRange,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Sync booking with Amadeus
   */
  static async syncWithAmadeus(bookingId: string): Promise<IBooking> {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw createError.notFound('Booking not found', 'BOOKING_NOT_FOUND');
      }

      if (!booking.amadeusOrderId) {
        throw createError.badRequest('No Amadeus order ID found', 'NO_AMADEUS_ORDER');
      }

      // Get latest order details from Amadeus
      const amadeusOrder = await AmadeusService.getFlightOrder(booking.amadeusOrderId);

      // Update booking with latest information
      if (amadeusOrder.flightOffers) {
        // Update flight information if needed
        // This would involve comparing and updating flight details
      }

      booking.lastSyncedAt = new Date();
      await booking.save();

      logger.info('Booking synced with Amadeus', { 
        bookingId: booking._id.toString(),
        amadeusOrderId: booking.amadeusOrderId 
      });

      return booking;

    } catch (error: any) {
      logger.error('Booking sync with Amadeus failed', { 
        bookingId,
        error: error.message 
      });
      throw error;
    }
  }
}

export default BookingService;

