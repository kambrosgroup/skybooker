import Amadeus from 'amadeus';
import { config } from '../config/config';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { Flight, IFlight } from '../models/Flight';

// Initialize Amadeus client
const amadeus = new Amadeus({
  clientId: config.amadeusApiKey,
  clientSecret: config.amadeusApiSecret,
  hostname: config.amadeusEnvironment === 'production' ? 'production' : 'test'
});

// Flight search parameters interface
export interface IFlightSearchParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  includedAirlineCodes?: string[];
  excludedAirlineCodes?: string[];
  nonStop?: boolean;
  maxPrice?: number;
  max?: number;
  currencyCode?: string;
}

// Flight offer interface (from Amadeus API)
export interface IAmadeusFlightOffer {
  type: string;
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate: string;
  lastTicketingDateTime: string;
  numberOfBookableSeats: number;
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      carrierCode: string;
      number: string;
      aircraft: {
        code: string;
      };
      operating?: {
        carrierCode: string;
      };
      duration: string;
      id: string;
      numberOfStops: number;
      blacklistedInEU: boolean;
    }>;
  }>;
  price: {
    currency: string;
    total: string;
    base: string;
    fees: Array<{
      amount: string;
      type: string;
    }>;
    grandTotal: string;
  };
  pricingOptions: {
    fareType: string[];
    includedCheckedBagsOnly: boolean;
  };
  validatingAirlineCodes: string[];
  travelerPricings: Array<{
    travelerId: string;
    fareOption: string;
    travelerType: string;
    price: {
      currency: string;
      total: string;
      base: string;
    };
    fareDetailsBySegment: Array<{
      segmentId: string;
      cabin: string;
      fareBasis: string;
      brandedFare?: string;
      class: string;
      includedCheckedBags?: {
        quantity?: number;
      };
    }>;
  }>;
}

// Flight search response interface
export interface IFlightSearchResponse {
  data: IAmadeusFlightOffer[];
  meta: {
    count: number;
    links?: {
      self: string;
    };
  };
  dictionaries?: {
    locations: Record<string, any>;
    aircraft: Record<string, any>;
    currencies: Record<string, any>;
    carriers: Record<string, any>;
  };
}

// Flight pricing request interface
export interface IFlightPricingRequest {
  data: {
    type: 'flight-offers-pricing';
    flightOffers: IAmadeusFlightOffer[];
  };
}

// Booking request interface
export interface IFlightBookingRequest {
  data: {
    type: 'flight-order';
    flightOffers: IAmadeusFlightOffer[];
    travelers: Array<{
      id: string;
      dateOfBirth: string;
      name: {
        firstName: string;
        lastName: string;
      };
      gender: string;
      contact: {
        emailAddress: string;
        phones: Array<{
          deviceType: string;
          countryCallingCode: string;
          number: string;
        }>;
      };
      documents?: Array<{
        documentType: string;
        birthPlace?: string;
        issuanceLocation?: string;
        issuanceDate?: string;
        number: string;
        expiryDate?: string;
        issuanceCountry?: string;
        validityCountry?: string;
        nationality?: string;
        holder?: boolean;
      }>;
    }>;
    remarks?: {
      general?: Array<{
        subType: string;
        text: string;
      }>;
    };
    ticketingAgreement?: {
      option: string;
      delay?: string;
    };
    contacts?: Array<{
      addresseeName: {
        firstName: string;
        lastName: string;
      };
      companyName?: string;
      purpose: string;
      phones: Array<{
        deviceType: string;
        countryCallingCode: string;
        number: string;
      }>;
      emailAddress: string;
      address: {
        lines: string[];
        postalCode: string;
        cityName: string;
        countryCode: string;
      };
    }>;
  };
}

/**
 * Amadeus API Service
 * Handles all interactions with the Amadeus API for flight search, pricing, and booking
 */
export class AmadeusService {
  /**
   * Search for flight offers
   */
  static async searchFlights(params: IFlightSearchParams): Promise<IFlightSearchResponse> {
    try {
      logger.info('Searching flights with Amadeus API', { params });

      // Prepare search parameters
      const searchParams: any = {
        originLocationCode: params.originLocationCode,
        destinationLocationCode: params.destinationLocationCode,
        departureDate: params.departureDate,
        adults: params.adults,
        max: params.max || 250 // Default to 250 results
      };

      // Add optional parameters
      if (params.returnDate) {
        searchParams.returnDate = params.returnDate;
      }
      if (params.children) {
        searchParams.children = params.children;
      }
      if (params.infants) {
        searchParams.infants = params.infants;
      }
      if (params.travelClass) {
        searchParams.travelClass = params.travelClass;
      }
      if (params.includedAirlineCodes) {
        searchParams.includedAirlineCodes = params.includedAirlineCodes.join(',');
      }
      if (params.excludedAirlineCodes) {
        searchParams.excludedAirlineCodes = params.excludedAirlineCodes.join(',');
      }
      if (params.nonStop !== undefined) {
        searchParams.nonStop = params.nonStop;
      }
      if (params.maxPrice) {
        searchParams.maxPrice = params.maxPrice;
      }
      if (params.currencyCode) {
        searchParams.currencyCode = params.currencyCode;
      }

      // Make API call
      const response = await amadeus.shopping.flightOffersSearch.get(searchParams);

      logger.info('Flight search completed', { 
        resultCount: response.data.length,
        searchParams 
      });

      return {
        data: response.data,
        meta: response.meta,
        dictionaries: response.dictionaries
      };

    } catch (error: any) {
      logger.error('Amadeus flight search failed', { error: error.message, params });
      
      if (error.response) {
        const amadeusError = error.response.body;
        throw createError.badRequest(
          amadeusError.errors?.[0]?.detail || 'Flight search failed',
          'AMADEUS_SEARCH_ERROR'
        );
      }
      
      throw createError.internalServerError('Flight search service unavailable', 'SERVICE_UNAVAILABLE');
    }
  }

  /**
   * Get flight offer pricing
   */
  static async getFlightPricing(flightOffers: IAmadeusFlightOffer[]): Promise<any> {
    try {
      logger.info('Getting flight pricing from Amadeus API', { 
        offerCount: flightOffers.length 
      });

      const pricingRequest: IFlightPricingRequest = {
        data: {
          type: 'flight-offers-pricing',
          flightOffers
        }
      };

      const response = await amadeus.shopping.flightOffersSearch.pricing.post(
        JSON.stringify(pricingRequest)
      );

      logger.info('Flight pricing completed', { 
        resultCount: response.data.flightOffers?.length || 0 
      });

      return response.data;

    } catch (error: any) {
      logger.error('Amadeus flight pricing failed', { error: error.message });
      
      if (error.response) {
        const amadeusError = error.response.body;
        throw createError.badRequest(
          amadeusError.errors?.[0]?.detail || 'Flight pricing failed',
          'AMADEUS_PRICING_ERROR'
        );
      }
      
      throw createError.internalServerError('Flight pricing service unavailable', 'SERVICE_UNAVAILABLE');
    }
  }

  /**
   * Create flight booking
   */
  static async createFlightBooking(bookingRequest: IFlightBookingRequest): Promise<any> {
    try {
      logger.info('Creating flight booking with Amadeus API', { 
        travelerCount: bookingRequest.data.travelers.length 
      });

      const response = await amadeus.booking.flightOrders.post(
        JSON.stringify(bookingRequest)
      );

      logger.info('Flight booking created', { 
        orderId: response.data.id,
        pnr: response.data.associatedRecords?.[0]?.reference 
      });

      return response.data;

    } catch (error: any) {
      logger.error('Amadeus flight booking failed', { error: error.message });
      
      if (error.response) {
        const amadeusError = error.response.body;
        throw createError.badRequest(
          amadeusError.errors?.[0]?.detail || 'Flight booking failed',
          'AMADEUS_BOOKING_ERROR'
        );
      }
      
      throw createError.internalServerError('Flight booking service unavailable', 'SERVICE_UNAVAILABLE');
    }
  }

  /**
   * Get flight order details
   */
  static async getFlightOrder(orderId: string): Promise<any> {
    try {
      logger.info('Retrieving flight order from Amadeus API', { orderId });

      const response = await amadeus.booking.flightOrder(orderId).get();

      logger.info('Flight order retrieved', { orderId });

      return response.data;

    } catch (error: any) {
      logger.error('Amadeus flight order retrieval failed', { error: error.message, orderId });
      
      if (error.response) {
        const amadeusError = error.response.body;
        throw createError.badRequest(
          amadeusError.errors?.[0]?.detail || 'Flight order retrieval failed',
          'AMADEUS_ORDER_ERROR'
        );
      }
      
      throw createError.internalServerError('Flight order service unavailable', 'SERVICE_UNAVAILABLE');
    }
  }

  /**
   * Cancel flight order
   */
  static async cancelFlightOrder(orderId: string): Promise<any> {
    try {
      logger.info('Cancelling flight order with Amadeus API', { orderId });

      const response = await amadeus.booking.flightOrder(orderId).delete();

      logger.info('Flight order cancelled', { orderId });

      return response.data;

    } catch (error: any) {
      logger.error('Amadeus flight order cancellation failed', { error: error.message, orderId });
      
      if (error.response) {
        const amadeusError = error.response.body;
        throw createError.badRequest(
          amadeusError.errors?.[0]?.detail || 'Flight order cancellation failed',
          'AMADEUS_CANCELLATION_ERROR'
        );
      }
      
      throw createError.internalServerError('Flight cancellation service unavailable', 'SERVICE_UNAVAILABLE');
    }
  }

  /**
   * Get airport and city search
   */
  static async searchLocations(keyword: string, subType?: string): Promise<any> {
    try {
      logger.info('Searching locations with Amadeus API', { keyword, subType });

      const params: any = {
        keyword,
        'page[limit]': 10
      };

      if (subType) {
        params.subType = subType;
      }

      const response = await amadeus.referenceData.locations.get(params);

      logger.info('Location search completed', { 
        resultCount: response.data.length,
        keyword 
      });

      return response.data;

    } catch (error: any) {
      logger.error('Amadeus location search failed', { error: error.message, keyword });
      
      if (error.response) {
        const amadeusError = error.response.body;
        throw createError.badRequest(
          amadeusError.errors?.[0]?.detail || 'Location search failed',
          'AMADEUS_LOCATION_ERROR'
        );
      }
      
      throw createError.internalServerError('Location search service unavailable', 'SERVICE_UNAVAILABLE');
    }
  }

  /**
   * Get airline information
   */
  static async getAirlineInfo(airlineCodes: string[]): Promise<any> {
    try {
      logger.info('Getting airline information from Amadeus API', { airlineCodes });

      const response = await amadeus.referenceData.airlines.get({
        airlineCodes: airlineCodes.join(',')
      });

      logger.info('Airline information retrieved', { 
        resultCount: response.data.length 
      });

      return response.data;

    } catch (error: any) {
      logger.error('Amadeus airline info retrieval failed', { error: error.message, airlineCodes });
      
      if (error.response) {
        const amadeusError = error.response.body;
        throw createError.badRequest(
          amadeusError.errors?.[0]?.detail || 'Airline info retrieval failed',
          'AMADEUS_AIRLINE_ERROR'
        );
      }
      
      throw createError.internalServerError('Airline info service unavailable', 'SERVICE_UNAVAILABLE');
    }
  }

  /**
   * Convert Amadeus flight offer to our Flight model
   */
  static convertAmadeusOfferToFlight(offer: IAmadeusFlightOffer, searchCriteria?: any): Partial<IFlight> {
    const firstItinerary = offer.itineraries[0];
    const firstSegment = firstItinerary.segments[0];
    const lastSegment = firstItinerary.segments[firstItinerary.segments.length - 1];

    return {
      amadeusOfferId: offer.id,
      source: 'amadeus',
      type: 'flight-offer',
      flightNumber: `${firstSegment.carrierCode}${firstSegment.number}`,
      carrierCode: firstSegment.carrierCode,
      operatingCarrierCode: firstSegment.operating?.carrierCode,
      origin: firstSegment.departure.iataCode,
      destination: lastSegment.arrival.iataCode,
      departureDateTime: new Date(firstSegment.departure.at),
      arrivalDateTime: new Date(lastSegment.arrival.at),
      duration: firstItinerary.duration,
      itineraries: offer.itineraries.map(itinerary => ({
        duration: itinerary.duration,
        segments: itinerary.segments.map(segment => ({
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
          operating: segment.operating ? {
            carrierCode: segment.operating.carrierCode,
            number: segment.number
          } : undefined,
          duration: segment.duration,
          stops: segment.numberOfStops
        }))
      })),
      price: {
        currency: offer.price.currency,
        total: parseFloat(offer.price.total),
        base: parseFloat(offer.price.base),
        fees: offer.price.fees.map(fee => ({
          amount: parseFloat(fee.amount),
          type: fee.type,
          description: fee.type
        })),
        taxes: [] // Will be populated from traveler pricing if available
      },
      travelerPricings: offer.travelerPricings.map(pricing => ({
        travelerId: pricing.travelerId,
        fareOption: pricing.fareOption,
        travelerType: pricing.travelerType as any,
        price: {
          currency: pricing.price.currency,
          total: parseFloat(pricing.price.total),
          base: parseFloat(pricing.price.base),
          fees: [],
          taxes: []
        },
        fareDetailsBySegment: pricing.fareDetailsBySegment.map(fareDetail => ({
          segmentId: fareDetail.segmentId,
          cabin: fareDetail.cabin as any,
          fareBasis: fareDetail.fareBasis,
          brandedFare: fareDetail.brandedFare,
          class: fareDetail.class,
          includedCheckedBags: fareDetail.includedCheckedBags
        }))
      })),
      numberOfBookableSeats: offer.numberOfBookableSeats,
      availableSeats: {
        economy: 0, // Will be updated based on cabin availability
        premiumEconomy: 0,
        business: 0,
        first: 0
      },
      aircraft: {
        code: firstSegment.aircraft.code
      },
      validatingAirlineCodes: offer.validatingAirlineCodes,
      lastTicketingDate: offer.lastTicketingDate ? new Date(offer.lastTicketingDate) : undefined,
      lastTicketingDateTime: offer.lastTicketingDateTime ? new Date(offer.lastTicketingDateTime) : undefined,
      pricingOptions: {
        fareType: offer.pricingOptions.fareType,
        includedCheckedBagsOnly: offer.pricingOptions.includedCheckedBagsOnly
      },
      status: 'active',
      isBookable: true,
      searchMetadata: searchCriteria ? {
        searchId: `search_${Date.now()}`,
        searchDate: new Date(),
        searchCriteria
      } : undefined,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // Expire in 30 minutes
    };
  }

  /**
   * Save flight offers to database
   */
  static async saveFlightOffers(offers: IAmadeusFlightOffer[], searchCriteria?: any): Promise<IFlight[]> {
    try {
      const flights: IFlight[] = [];

      for (const offer of offers) {
        const flightData = this.convertAmadeusOfferToFlight(offer, searchCriteria);
        const flight = new Flight(flightData);
        await flight.save();
        flights.push(flight);
      }

      logger.info('Flight offers saved to database', { count: flights.length });
      return flights;

    } catch (error: any) {
      logger.error('Failed to save flight offers to database', { error: error.message });
      throw createError.internalServerError('Failed to save flight data', 'DATABASE_SAVE_ERROR');
    }
  }

  /**
   * Health check for Amadeus API
   */
  static async healthCheck(): Promise<boolean> {
    try {
      // Simple API call to check if service is available
      await amadeus.referenceData.locations.get({
        keyword: 'LON',
        'page[limit]': 1
      });
      
      return true;
    } catch (error) {
      logger.error('Amadeus API health check failed', { error });
      return false;
    }
  }
}

export default AmadeusService;

