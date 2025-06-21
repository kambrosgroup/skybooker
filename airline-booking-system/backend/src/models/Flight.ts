import mongoose, { Document, Schema } from 'mongoose';

// Flight segment interface for multi-leg flights
export interface IFlightSegment {
  segmentId: string;
  departure: {
    iataCode: string;
    terminal?: string;
    at: Date;
  };
  arrival: {
    iataCode: string;
    terminal?: string;
    at: Date;
  };
  carrierCode: string;
  number: string;
  aircraft: {
    code: string;
    name?: string;
  };
  operating?: {
    carrierCode: string;
    number: string;
  };
  duration: string; // ISO 8601 duration format (e.g., "PT2H30M")
  stops: number;
}

// Price breakdown interface
export interface IPriceBreakdown {
  currency: string;
  total: number;
  base: number;
  fees: Array<{
    amount: number;
    type: string;
    description?: string;
  }>;
  taxes: Array<{
    amount: number;
    code: string;
    description?: string;
  }>;
  refundableTaxes?: number;
}

// Traveler pricing interface
export interface ITravelerPricing {
  travelerId: string;
  fareOption: string;
  travelerType: 'ADULT' | 'CHILD' | 'INFANT' | 'SENIOR' | 'YOUNG' | 'HELD_INFANT' | 'SEATED_INFANT' | 'STUDENT';
  price: IPriceBreakdown;
  fareDetailsBySegment: Array<{
    segmentId: string;
    cabin: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
    fareBasis: string;
    brandedFare?: string;
    class: string;
    includedCheckedBags?: {
      quantity?: number;
      weight?: number;
      weightUnit?: string;
    };
    amenities?: Array<{
      description: string;
      isChargeable: boolean;
      amenityType: string;
    }>;
  }>;
}

// Flight interface
export interface IFlight extends Document {
  _id: mongoose.Types.ObjectId;
  
  // Amadeus flight offer data
  amadeusOfferId?: string;
  source: string; // 'amadeus' | 'manual' | 'other'
  type: 'flight-offer' | 'scheduled-flight';
  
  // Flight identification
  flightNumber: string;
  carrierCode: string;
  operatingCarrierCode?: string;
  
  // Route information
  origin: string; // IATA airport code
  destination: string; // IATA airport code
  
  // Timing
  departureDateTime: Date;
  arrivalDateTime: Date;
  duration: string; // ISO 8601 duration format
  
  // Flight segments (for connecting flights)
  itineraries: Array<{
    duration: string;
    segments: IFlightSegment[];
  }>;
  
  // Pricing information
  price: IPriceBreakdown;
  travelerPricings: ITravelerPricing[];
  
  // Availability
  numberOfBookableSeats: number;
  availableSeats: {
    economy: number;
    premiumEconomy: number;
    business: number;
    first: number;
  };
  
  // Aircraft information
  aircraft: {
    code: string;
    name?: string;
    configuration?: {
      totalSeats: number;
      economySeats: number;
      premiumEconomySeats: number;
      businessSeats: number;
      firstSeats: number;
    };
  };
  
  // Additional flight information
  validatingAirlineCodes: string[];
  lastTicketingDate?: Date;
  lastTicketingDateTime?: Date;
  
  // Booking and fare rules
  pricingOptions?: {
    fareType: string[];
    includedCheckedBagsOnly: boolean;
    refundableFare?: boolean;
    noRestrictionFare?: boolean;
    noPenaltyFare?: boolean;
  };
  
  // Status and metadata
  status: 'active' | 'cancelled' | 'delayed' | 'completed';
  isBookable: boolean;
  
  // Search and filtering metadata
  searchMetadata?: {
    searchId: string;
    searchDate: Date;
    searchCriteria: any;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date; // For cached flight offers
}

// Flight schema
const flightSegmentSchema = new Schema<IFlightSegment>({
  segmentId: {
    type: String,
    required: true
  },
  departure: {
    iataCode: {
      type: String,
      required: true,
      uppercase: true,
      match: [/^[A-Z]{3}$/, 'IATA code must be 3 uppercase letters']
    },
    terminal: String,
    at: {
      type: Date,
      required: true
    }
  },
  arrival: {
    iataCode: {
      type: String,
      required: true,
      uppercase: true,
      match: [/^[A-Z]{3}$/, 'IATA code must be 3 uppercase letters']
    },
    terminal: String,
    at: {
      type: Date,
      required: true
    }
  },
  carrierCode: {
    type: String,
    required: true,
    uppercase: true,
    match: [/^[A-Z0-9]{2,3}$/, 'Carrier code must be 2-3 uppercase alphanumeric characters']
  },
  number: {
    type: String,
    required: true
  },
  aircraft: {
    code: {
      type: String,
      required: true
    },
    name: String
  },
  operating: {
    carrierCode: String,
    number: String
  },
  duration: {
    type: String,
    required: true,
    match: [/^PT\d+H\d+M$/, 'Duration must be in ISO 8601 format (e.g., PT2H30M)']
  },
  stops: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

const priceBreakdownSchema = new Schema<IPriceBreakdown>({
  currency: {
    type: String,
    required: true,
    uppercase: true,
    match: [/^[A-Z]{3}$/, 'Currency must be a valid 3-letter code']
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  base: {
    type: Number,
    required: true,
    min: 0
  },
  fees: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    type: {
      type: String,
      required: true
    },
    description: String
  }],
  taxes: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    code: {
      type: String,
      required: true
    },
    description: String
  }],
  refundableTaxes: {
    type: Number,
    min: 0
  }
}, { _id: false });

const travelerPricingSchema = new Schema<ITravelerPricing>({
  travelerId: {
    type: String,
    required: true
  },
  fareOption: {
    type: String,
    required: true
  },
  travelerType: {
    type: String,
    required: true,
    enum: ['ADULT', 'CHILD', 'INFANT', 'SENIOR', 'YOUNG', 'HELD_INFANT', 'SEATED_INFANT', 'STUDENT']
  },
  price: {
    type: priceBreakdownSchema,
    required: true
  },
  fareDetailsBySegment: [{
    segmentId: {
      type: String,
      required: true
    },
    cabin: {
      type: String,
      required: true,
      enum: ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']
    },
    fareBasis: {
      type: String,
      required: true
    },
    brandedFare: String,
    class: {
      type: String,
      required: true
    },
    includedCheckedBags: {
      quantity: Number,
      weight: Number,
      weightUnit: String
    },
    amenities: [{
      description: String,
      isChargeable: Boolean,
      amenityType: String
    }]
  }]
}, { _id: false });

const flightSchema = new Schema<IFlight>({
  amadeusOfferId: {
    type: String,
    sparse: true,
    index: true
  },
  source: {
    type: String,
    required: true,
    enum: ['amadeus', 'manual', 'other'],
    default: 'amadeus'
  },
  type: {
    type: String,
    required: true,
    enum: ['flight-offer', 'scheduled-flight'],
    default: 'flight-offer'
  },
  flightNumber: {
    type: String,
    required: true,
    uppercase: true,
    index: true
  },
  carrierCode: {
    type: String,
    required: true,
    uppercase: true,
    match: [/^[A-Z0-9]{2,3}$/, 'Carrier code must be 2-3 uppercase alphanumeric characters']
  },
  operatingCarrierCode: {
    type: String,
    uppercase: true,
    match: [/^[A-Z0-9]{2,3}$/, 'Operating carrier code must be 2-3 uppercase alphanumeric characters']
  },
  origin: {
    type: String,
    required: true,
    uppercase: true,
    match: [/^[A-Z]{3}$/, 'Origin must be a valid 3-letter IATA code'],
    index: true
  },
  destination: {
    type: String,
    required: true,
    uppercase: true,
    match: [/^[A-Z]{3}$/, 'Destination must be a valid 3-letter IATA code'],
    index: true
  },
  departureDateTime: {
    type: Date,
    required: true,
    index: true
  },
  arrivalDateTime: {
    type: Date,
    required: true,
    index: true
  },
  duration: {
    type: String,
    required: true,
    match: [/^PT\d+H\d+M$/, 'Duration must be in ISO 8601 format (e.g., PT2H30M)']
  },
  itineraries: [{
    duration: {
      type: String,
      required: true
    },
    segments: [flightSegmentSchema]
  }],
  price: {
    type: priceBreakdownSchema,
    required: true
  },
  travelerPricings: [travelerPricingSchema],
  numberOfBookableSeats: {
    type: Number,
    required: true,
    min: 0
  },
  availableSeats: {
    economy: {
      type: Number,
      default: 0,
      min: 0
    },
    premiumEconomy: {
      type: Number,
      default: 0,
      min: 0
    },
    business: {
      type: Number,
      default: 0,
      min: 0
    },
    first: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  aircraft: {
    code: {
      type: String,
      required: true
    },
    name: String,
    configuration: {
      totalSeats: Number,
      economySeats: Number,
      premiumEconomySeats: Number,
      businessSeats: Number,
      firstSeats: Number
    }
  },
  validatingAirlineCodes: [{
    type: String,
    uppercase: true
  }],
  lastTicketingDate: Date,
  lastTicketingDateTime: Date,
  pricingOptions: {
    fareType: [String],
    includedCheckedBagsOnly: Boolean,
    refundableFare: Boolean,
    noRestrictionFare: Boolean,
    noPenaltyFare: Boolean
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'delayed', 'completed'],
    default: 'active',
    index: true
  },
  isBookable: {
    type: Boolean,
    default: true,
    index: true
  },
  searchMetadata: {
    searchId: String,
    searchDate: Date,
    searchCriteria: Schema.Types.Mixed
  },
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 } // TTL index for automatic cleanup
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient querying
flightSchema.index({ origin: 1, destination: 1, departureDateTime: 1 });
flightSchema.index({ carrierCode: 1, flightNumber: 1, departureDateTime: 1 });
flightSchema.index({ 'price.total': 1 });
flightSchema.index({ status: 1, isBookable: 1 });
flightSchema.index({ createdAt: -1 });

// Virtual for route
flightSchema.virtual('route').get(function() {
  return `${this.origin}-${this.destination}`;
});

// Virtual for total duration in minutes
flightSchema.virtual('durationMinutes').get(function() {
  const match = this.duration.match(/PT(\d+)H(\d+)M/);
  if (match) {
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  }
  return 0;
});

// Static method to find flights by route and date
flightSchema.statics.findByRoute = function(origin: string, destination: string, departureDate: Date) {
  const startOfDay = new Date(departureDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(departureDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    origin: origin.toUpperCase(),
    destination: destination.toUpperCase(),
    departureDateTime: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: 'active',
    isBookable: true
  }).sort({ departureDateTime: 1 });
};

// Static method to find available flights
flightSchema.statics.findAvailable = function(criteria: any) {
  return this.find({
    ...criteria,
    status: 'active',
    isBookable: true,
    numberOfBookableSeats: { $gt: 0 }
  });
};

// Instance method to check if flight is expired
flightSchema.methods.isExpired = function(): boolean {
  return this.expiresAt ? this.expiresAt < new Date() : false;
};

// Instance method to update available seats
flightSchema.methods.updateAvailableSeats = function(cabin: string, seatsBooked: number) {
  if (this.availableSeats[cabin as keyof typeof this.availableSeats] !== undefined) {
    this.availableSeats[cabin as keyof typeof this.availableSeats] -= seatsBooked;
    this.numberOfBookableSeats -= seatsBooked;
  }
  return this.save();
};

// Create and export the model
export const Flight = mongoose.model<IFlight>('Flight', flightSchema);
export default Flight;

