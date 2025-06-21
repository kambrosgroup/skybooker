import { Request, Response, NextFunction } from 'express';
import { AmadeusService, IFlightSearchParams } from '../services/amadeusService';
import { Flight } from '../models/Flight';
import { Airport, Airline } from '../models/Airport';
import { createError, catchAsync } from '../middleware/errorHandler';
import { logBusinessEvent } from '../utils/logger';

/**
 * Search for flights
 */
export const searchFlights = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const {
    origin,
    destination,
    departureDate,
    returnDate,
    passengers,
    cabin,
    currency,
    maxPrice,
    directFlightsOnly,
    maxStops,
    preferredAirlines,
    excludedAirlines
  } = req.body;

  // Prepare search parameters
  const searchParams: IFlightSearchParams = {
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate,
    returnDate,
    adults: passengers?.adults || 1,
    children: passengers?.children || 0,
    infants: passengers?.infants || 0,
    travelClass: cabin || 'ECONOMY',
    currencyCode: currency || 'USD',
    nonStop: directFlightsOnly,
    maxPrice,
    includedAirlineCodes: preferredAirlines,
    excludedAirlineCodes: excludedAirlines,
    max: 50 // Limit results for better performance
  };

  // Search flights using Amadeus API
  const searchResponse = await AmadeusService.searchFlights(searchParams);

  // Save flight offers to database for caching
  const savedFlights = await AmadeusService.saveFlightOffers(
    searchResponse.data,
    searchParams
  );

  // Log business event
  logBusinessEvent('Flight search performed', req.user?._id.toString(), {
    searchParams,
    resultCount: searchResponse.data.length
  });

  res.json({
    success: true,
    data: {
      flights: searchResponse.data,
      meta: searchResponse.meta,
      dictionaries: searchResponse.dictionaries,
      searchId: `search_${Date.now()}`,
      searchParams
    }
  });
});

/**
 * Get flight pricing for specific offers
 */
export const getFlightPricing = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { flightOffers } = req.body;

  if (!flightOffers || !Array.isArray(flightOffers) || flightOffers.length === 0) {
    throw createError.badRequest('Flight offers are required', 'MISSING_FLIGHT_OFFERS');
  }

  // Get pricing from Amadeus API
  const pricingResponse = await AmadeusService.getFlightPricing(flightOffers);

  // Log business event
  logBusinessEvent('Flight pricing requested', req.user?._id.toString(), {
    offerCount: flightOffers.length
  });

  res.json({
    success: true,
    data: pricingResponse
  });
});

/**
 * Get flight details by ID
 */
export const getFlightDetails = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { flightId } = req.params;

  // First try to find in our database
  let flight = await Flight.findById(flightId);

  if (!flight) {
    // If not found in database, check if it's an Amadeus offer ID
    flight = await Flight.findOne({ amadeusOfferId: flightId });
  }

  if (!flight) {
    throw createError.notFound('Flight not found', 'FLIGHT_NOT_FOUND');
  }

  res.json({
    success: true,
    data: {
      flight
    }
  });
});

/**
 * Search airports and cities
 */
export const searchLocations = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { query, type } = req.query;

  if (!query || typeof query !== 'string') {
    throw createError.badRequest('Search query is required', 'MISSING_QUERY');
  }

  // Search in our database first
  const localAirports = await Airport.search(query as string, 5);

  // Also search using Amadeus API for more comprehensive results
  const amadeusLocations = await AmadeusService.searchLocations(
    query as string,
    type as string
  );

  res.json({
    success: true,
    data: {
      local: localAirports,
      amadeus: amadeusLocations,
      combined: [...localAirports, ...amadeusLocations].slice(0, 10)
    }
  });
});

/**
 * Get airline information
 */
export const getAirlineInfo = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { airlineCodes } = req.query;

  if (!airlineCodes) {
    throw createError.badRequest('Airline codes are required', 'MISSING_AIRLINE_CODES');
  }

  const codes = Array.isArray(airlineCodes) 
    ? airlineCodes as string[]
    : (airlineCodes as string).split(',');

  // Search in our database first
  const localAirlines = await Airline.find({
    iataCode: { $in: codes }
  });

  // Get additional info from Amadeus if needed
  let amadeusAirlines = [];
  const missingCodes = codes.filter(code => 
    !localAirlines.find(airline => airline.iataCode === code)
  );

  if (missingCodes.length > 0) {
    amadeusAirlines = await AmadeusService.getAirlineInfo(missingCodes);
  }

  res.json({
    success: true,
    data: {
      airlines: [...localAirlines, ...amadeusAirlines]
    }
  });
});

/**
 * Get popular destinations
 */
export const getPopularDestinations = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { origin, limit = 10 } = req.query;

  // Get popular destinations from our flight data
  const popularDestinations = await Flight.aggregate([
    ...(origin ? [{ $match: { origin: origin as string } }] : []),
    {
      $group: {
        _id: '$destination',
        count: { $sum: 1 },
        avgPrice: { $avg: '$price.total' },
        minPrice: { $min: '$price.total' },
        carriers: { $addToSet: '$carrierCode' }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: parseInt(limit as string)
    },
    {
      $lookup: {
        from: 'airports',
        localField: '_id',
        foreignField: 'iataCode',
        as: 'airport'
      }
    },
    {
      $unwind: {
        path: '$airport',
        preserveNullAndEmptyArrays: true
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      destinations: popularDestinations
    }
  });
});

/**
 * Get flight statistics
 */
export const getFlightStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { origin, destination, period = '30d' } = req.query;

  // Calculate date range based on period
  const now = new Date();
  let startDate = new Date();
  
  switch (period) {
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(now.getDate() - 90);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
  }

  // Build match criteria
  const matchCriteria: any = {
    createdAt: { $gte: startDate }
  };

  if (origin) {
    matchCriteria.origin = origin;
  }
  if (destination) {
    matchCriteria.destination = destination;
  }

  // Get flight statistics
  const stats = await Flight.aggregate([
    { $match: matchCriteria },
    {
      $group: {
        _id: null,
        totalFlights: { $sum: 1 },
        avgPrice: { $avg: '$price.total' },
        minPrice: { $min: '$price.total' },
        maxPrice: { $max: '$price.total' },
        carriers: { $addToSet: '$carrierCode' },
        routes: { $addToSet: { origin: '$origin', destination: '$destination' } }
      }
    }
  ]);

  // Get price trends
  const priceTrends = await Flight.aggregate([
    { $match: matchCriteria },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt'
          }
        },
        avgPrice: { $avg: '$price.total' },
        flightCount: { $sum: 1 }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      stats: stats[0] || {
        totalFlights: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        carriers: [],
        routes: []
      },
      trends: priceTrends,
      period,
      dateRange: {
        start: startDate,
        end: now
      }
    }
  });
});

/**
 * Get flight inspiration (cheapest destinations)
 */
export const getFlightInspiration = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { origin, maxPrice, departureDate, oneWay = true } = req.query;

  if (!origin) {
    throw createError.badRequest('Origin is required', 'MISSING_ORIGIN');
  }

  // Get cheapest flights from origin
  const matchCriteria: any = {
    origin: origin as string,
    status: 'active',
    isBookable: true
  };

  if (maxPrice) {
    matchCriteria['price.total'] = { $lte: parseFloat(maxPrice as string) };
  }

  if (departureDate) {
    const date = new Date(departureDate as string);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    
    matchCriteria.departureDateTime = {
      $gte: date,
      $lt: nextDay
    };
  }

  const inspirationFlights = await Flight.aggregate([
    { $match: matchCriteria },
    {
      $group: {
        _id: '$destination',
        minPrice: { $min: '$price.total' },
        currency: { $first: '$price.currency' },
        sampleFlight: { $first: '$$ROOT' }
      }
    },
    {
      $sort: { minPrice: 1 }
    },
    {
      $limit: 20
    },
    {
      $lookup: {
        from: 'airports',
        localField: '_id',
        foreignField: 'iataCode',
        as: 'destinationAirport'
      }
    },
    {
      $unwind: {
        path: '$destinationAirport',
        preserveNullAndEmptyArrays: true
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      inspiration: inspirationFlights,
      origin,
      searchCriteria: {
        maxPrice,
        departureDate,
        oneWay
      }
    }
  });
});

/**
 * Health check for flight services
 */
export const healthCheck = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Check database connectivity
  const dbFlightCount = await Flight.countDocuments();
  
  // Check Amadeus API connectivity
  const amadeusHealthy = await AmadeusService.healthCheck();

  res.json({
    success: true,
    data: {
      database: {
        connected: true,
        flightCount: dbFlightCount
      },
      amadeus: {
        connected: amadeusHealthy
      },
      timestamp: new Date().toISOString()
    }
  });
});

export default {
  searchFlights,
  getFlightPricing,
  getFlightDetails,
  searchLocations,
  getAirlineInfo,
  getPopularDestinations,
  getFlightStats,
  getFlightInspiration,
  healthCheck
};

