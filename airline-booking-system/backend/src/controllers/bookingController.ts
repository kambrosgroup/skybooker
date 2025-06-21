import { Request, Response, NextFunction } from 'express';
import { BookingService, IBookingCreateRequest, IBookingUpdateRequest, IPNRSearchCriteria } from '../services/bookingService';
import { createError, catchAsync } from '../middleware/errorHandler';
import { logBusinessEvent } from '../utils/logger';

/**
 * Create a new booking
 */
export const createBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?._id.toString();
  
  if (!userId) {
    throw createError.unauthorized('Authentication required', 'AUTH_REQUIRED');
  }

  const bookingData: IBookingCreateRequest = {
    userId,
    ...req.body
  };

  // Create booking
  const booking = await BookingService.createBooking(bookingData);

  // Log business event
  logBusinessEvent('Booking creation requested', userId, {
    bookingId: booking._id.toString(),
    pnr: booking.pnr,
    totalPrice: booking.pricing.totalPrice
  });

  res.status(201).json({
    success: true,
    data: {
      booking: {
        id: booking._id,
        pnr: booking.pnr,
        bookingReference: booking.bookingReference,
        status: booking.status,
        flights: booking.flights,
        passengers: booking.passengers,
        contactInfo: booking.contactInfo,
        pricing: booking.pricing,
        bookedAt: booking.bookedAt,
        expiresAt: booking.expiresAt
      }
    },
    message: 'Booking created successfully'
  });
});

/**
 * Get booking by ID
 */
export const getBookingById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { bookingId } = req.params;
  const userId = req.user?._id.toString();

  // For non-admin users, only allow access to their own bookings
  const searchUserId = req.user?.role === 'admin' ? undefined : userId;

  const booking = await BookingService.getBookingById(bookingId, searchUserId);

  res.json({
    success: true,
    data: {
      booking
    }
  });
});

/**
 * Search bookings by PNR or other criteria
 */
export const searchBookings = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const {
    pnr,
    bookingReference,
    email,
    lastName,
    departureDate,
    flightNumber,
    status,
    startDate,
    endDate
  } = req.query;

  const userId = req.user?._id.toString();

  // Build search criteria
  const criteria: IPNRSearchCriteria = {};

  if (pnr) criteria.pnr = pnr as string;
  if (bookingReference) criteria.bookingReference = bookingReference as string;
  if (email) criteria.email = email as string;
  if (lastName) criteria.lastName = lastName as string;
  if (flightNumber) criteria.flightNumber = flightNumber as string;
  if (status) criteria.status = status as string;
  if (departureDate) criteria.departureDate = new Date(departureDate as string);

  // For non-admin users, only allow searching their own bookings
  if (req.user?.role !== 'admin') {
    criteria.userId = userId;
  }

  // Add date range if provided
  if (startDate && endDate) {
    criteria.dateRange = {
      start: new Date(startDate as string),
      end: new Date(endDate as string)
    };
  }

  const bookings = await BookingService.searchBookings(criteria);

  // Log business event
  logBusinessEvent('Booking search performed', userId || 'anonymous', {
    criteria,
    resultCount: bookings.length
  });

  res.json({
    success: true,
    data: {
      bookings,
      searchCriteria: criteria,
      resultCount: bookings.length
    }
  });
});

/**
 * Update booking
 */
export const updateBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { bookingId } = req.params;
  const userId = req.user?._id.toString();
  const updateData: IBookingUpdateRequest = req.body;

  // For non-admin users, only allow updating their own bookings
  const searchUserId = req.user?.role === 'admin' ? undefined : userId;

  const booking = await BookingService.updateBooking(bookingId, updateData, searchUserId);

  // Log business event
  logBusinessEvent('Booking updated', userId || 'system', {
    bookingId: booking._id.toString(),
    pnr: booking.pnr,
    updateData
  });

  res.json({
    success: true,
    data: {
      booking
    },
    message: 'Booking updated successfully'
  });
});

/**
 * Cancel booking
 */
export const cancelBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { bookingId } = req.params;
  const { reason } = req.body;
  const userId = req.user?._id.toString();

  if (!reason) {
    throw createError.badRequest('Cancellation reason is required', 'MISSING_REASON');
  }

  // For non-admin users, only allow cancelling their own bookings
  const searchUserId = req.user?.role === 'admin' ? undefined : userId;

  const booking = await BookingService.cancelBooking(bookingId, reason, searchUserId);

  // Log business event
  logBusinessEvent('Booking cancelled', userId || 'system', {
    bookingId: booking._id.toString(),
    pnr: booking.pnr,
    reason
  });

  res.json({
    success: true,
    data: {
      booking
    },
    message: 'Booking cancelled successfully'
  });
});

/**
 * Get user bookings
 */
export const getUserBookings = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?._id.toString();
  
  if (!userId) {
    throw createError.unauthorized('Authentication required', 'AUTH_REQUIRED');
  }

  const {
    status,
    limit = '20',
    offset = '0',
    sortBy = 'bookedAt',
    sortOrder = 'desc'
  } = req.query;

  const options = {
    status: status as string,
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc'
  };

  const result = await BookingService.getUserBookings(userId, options);

  res.json({
    success: true,
    data: {
      bookings: result.bookings,
      pagination: {
        total: result.total,
        limit: options.limit,
        offset: options.offset,
        hasMore: result.total > options.offset + options.limit
      }
    }
  });
});

/**
 * Get booking statistics (admin only)
 */
export const getBookingStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Check admin permission
  if (req.user?.role !== 'admin') {
    throw createError.forbidden('Admin access required', 'ADMIN_REQUIRED');
  }

  const { startDate, endDate } = req.query;

  let dateRange: { start: Date; end: Date } | undefined;
  if (startDate && endDate) {
    dateRange = {
      start: new Date(startDate as string),
      end: new Date(endDate as string)
    };
  }

  const stats = await BookingService.getBookingStats(dateRange);

  res.json({
    success: true,
    data: {
      statistics: stats
    }
  });
});

/**
 * Sync booking with Amadeus (admin only)
 */
export const syncBookingWithAmadeus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Check admin permission
  if (req.user?.role !== 'admin') {
    throw createError.forbidden('Admin access required', 'ADMIN_REQUIRED');
  }

  const { bookingId } = req.params;
  const userId = req.user?._id.toString();

  const booking = await BookingService.syncWithAmadeus(bookingId);

  // Log business event
  logBusinessEvent('Booking synced with Amadeus', userId || 'system', {
    bookingId: booking._id.toString(),
    pnr: booking.pnr,
    amadeusOrderId: booking.amadeusOrderId
  });

  res.json({
    success: true,
    data: {
      booking
    },
    message: 'Booking synced with Amadeus successfully'
  });
});

/**
 * Get booking by PNR (public endpoint with limited info)
 */
export const getBookingByPNR = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { pnr } = req.params;
  const { lastName, email } = req.query;

  if (!lastName && !email) {
    throw createError.badRequest('Last name or email is required for PNR lookup', 'MISSING_VERIFICATION');
  }

  // Search for booking
  const criteria: IPNRSearchCriteria = { pnr };
  if (lastName) criteria.lastName = lastName as string;
  if (email) criteria.email = email as string;

  const bookings = await BookingService.searchBookings(criteria);

  if (bookings.length === 0) {
    throw createError.notFound('Booking not found', 'BOOKING_NOT_FOUND');
  }

  const booking = bookings[0];

  // Return limited information for security
  const publicBookingInfo = {
    pnr: booking.pnr,
    bookingReference: booking.bookingReference,
    status: booking.status,
    flights: booking.flights.map(flight => ({
      flightNumber: flight.flightNumber,
      origin: flight.origin,
      destination: flight.destination,
      departureDateTime: flight.departureDateTime,
      arrivalDateTime: flight.arrivalDateTime
    })),
    passengers: booking.passengers.map(passenger => ({
      firstName: passenger.firstName,
      lastName: passenger.lastName,
      type: passenger.type
    })),
    totalPrice: booking.pricing.totalPrice,
    currency: booking.pricing.currency,
    bookedAt: booking.bookedAt
  };

  // Log business event
  logBusinessEvent('Public PNR lookup performed', 'anonymous', {
    pnr,
    hasLastName: !!lastName,
    hasEmail: !!email
  });

  res.json({
    success: true,
    data: {
      booking: publicBookingInfo
    }
  });
});

/**
 * Validate booking data before creation
 */
export const validateBookingData = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const bookingData = req.body;

  // Basic validation
  if (!bookingData.flightOffers || !Array.isArray(bookingData.flightOffers) || bookingData.flightOffers.length === 0) {
    throw createError.badRequest('Flight offers are required', 'MISSING_FLIGHT_OFFERS');
  }

  if (!bookingData.passengers || !Array.isArray(bookingData.passengers) || bookingData.passengers.length === 0) {
    throw createError.badRequest('Passenger information is required', 'MISSING_PASSENGERS');
  }

  if (!bookingData.contactInfo || !bookingData.contactInfo.email) {
    throw createError.badRequest('Contact email is required', 'MISSING_CONTACT_EMAIL');
  }

  // Validate passenger data
  for (const passenger of bookingData.passengers) {
    if (!passenger.firstName || !passenger.lastName || !passenger.dateOfBirth) {
      throw createError.badRequest('Passenger name and date of birth are required', 'INVALID_PASSENGER_DATA');
    }
  }

  res.json({
    success: true,
    data: {
      valid: true,
      passengerCount: bookingData.passengers.length,
      flightOfferCount: bookingData.flightOffers.length
    },
    message: 'Booking data is valid'
  });
});

/**
 * Get booking timeline/history
 */
export const getBookingTimeline = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { bookingId } = req.params;
  const userId = req.user?._id.toString();

  // For non-admin users, only allow access to their own bookings
  const searchUserId = req.user?.role === 'admin' ? undefined : userId;

  const booking = await BookingService.getBookingById(bookingId, searchUserId);

  // Build timeline from booking data
  const timeline = [
    {
      event: 'Booking Created',
      timestamp: booking.bookedAt,
      status: 'confirmed',
      description: `Booking ${booking.pnr} was created`
    },
    ...booking.statusHistory.map(history => ({
      event: 'Status Changed',
      timestamp: history.changedAt,
      status: history.status,
      description: `Status changed to ${history.status}`,
      reason: history.reason
    }))
  ];

  // Add payment events if available
  if (booking.payment?.paidAt) {
    timeline.push({
      event: 'Payment Processed',
      timestamp: booking.payment.paidAt,
      status: 'confirmed',
      description: `Payment of ${booking.pricing.currency} ${booking.payment.amount} processed`
    });
  }

  // Add cancellation event if cancelled
  if (booking.cancelledAt) {
    timeline.push({
      event: 'Booking Cancelled',
      timestamp: booking.cancelledAt,
      status: 'cancelled',
      description: `Booking cancelled: ${booking.cancellationReason}`
    });
  }

  // Sort timeline by timestamp
  timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  res.json({
    success: true,
    data: {
      bookingId: booking._id,
      pnr: booking.pnr,
      timeline
    }
  });
});

export default {
  createBooking,
  getBookingById,
  searchBookings,
  updateBooking,
  cancelBooking,
  getUserBookings,
  getBookingStats,
  syncBookingWithAmadeus,
  getBookingByPNR,
  validateBookingData,
  getBookingTimeline
};

