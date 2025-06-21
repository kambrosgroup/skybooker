import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';
import { IFlight } from './Flight';

// Passenger details interface
export interface IPassenger {
  passengerId: string;
  type: 'ADULT' | 'CHILD' | 'INFANT' | 'SENIOR';
  title: 'Mr' | 'Mrs' | 'Ms' | 'Dr' | 'Prof';
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: Date;
  nationality: string;
  passportNumber?: string;
  passportExpiry?: Date;
  passportIssuingCountry?: string;
  
  // Contact information
  email?: string;
  phone?: string;
  
  // Special requirements
  specialRequests?: string[];
  medicalConditions?: string[];
  dietaryRequirements?: string[];
  mobilityAssistance?: boolean;
  
  // Seat preferences
  seatPreference?: 'Window' | 'Aisle' | 'Middle';
  seatNumber?: string;
  
  // Frequent flyer information
  frequentFlyerNumber?: string;
  frequentFlyerProgram?: string;
}

// Flight booking details interface
export interface IFlightBooking {
  flightId: mongoose.Types.ObjectId;
  amadeusOfferId?: string;
  
  // Flight information snapshot (for historical records)
  flightDetails: {
    flightNumber: string;
    carrierCode: string;
    origin: string;
    destination: string;
    departureDateTime: Date;
    arrivalDateTime: Date;
    duration: string;
    aircraft: {
      code: string;
      name?: string;
    };
  };
  
  // Booking class and fare information
  cabin: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  fareClass: string;
  fareBasis: string;
  brandedFare?: string;
  
  // Seat assignments
  seatAssignments: Array<{
    passengerId: string;
    seatNumber: string;
    seatType: 'Window' | 'Aisle' | 'Middle';
  }>;
  
  // Baggage information
  baggage: {
    checkedBags: Array<{
      passengerId: string;
      quantity: number;
      weight: number;
      weightUnit: 'kg' | 'lb';
    }>;
    carryOnBags: Array<{
      passengerId: string;
      quantity: number;
    }>;
  };
  
  // Services and add-ons
  services: Array<{
    type: string;
    description: string;
    price: number;
    currency: string;
    passengerId?: string;
  }>;
}

// Payment information interface
export interface IPaymentInfo {
  paymentId?: string;
  stripePaymentIntentId?: string;
  method: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'cash';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  
  // Amount breakdown
  amount: {
    total: number;
    subtotal: number;
    taxes: number;
    fees: number;
    currency: string;
  };
  
  // Payment details
  transactionId?: string;
  transactionDate?: Date;
  
  // Refund information
  refunds?: Array<{
    refundId: string;
    amount: number;
    reason: string;
    processedDate: Date;
    status: 'pending' | 'completed' | 'failed';
  }>;
  
  // Billing information
  billingAddress?: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
}

// Booking interface
export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  
  // Unique identifiers
  pnr: string; // Passenger Name Record
  bookingReference: string;
  amadeusOrderId?: string;
  
  // User and contact information
  userId: mongoose.Types.ObjectId | IUser;
  contactEmail: string;
  contactPhone: string;
  
  // Booking type and status
  type: 'one-way' | 'round-trip' | 'multi-city';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'expired' | 'refunded';
  bookingSource: 'web' | 'mobile' | 'api' | 'agent' | 'phone';
  
  // Flight bookings (outbound, return, etc.)
  flights: IFlightBooking[];
  
  // Passenger information
  passengers: IPassenger[];
  
  // Pricing information
  pricing: {
    totalAmount: number;
    currency: string;
    breakdown: {
      baseFare: number;
      taxes: number;
      fees: number;
      services: number;
      discounts: number;
    };
    
    // Per passenger pricing
    passengerPricing: Array<{
      passengerId: string;
      amount: number;
      breakdown: {
        baseFare: number;
        taxes: number;
        fees: number;
      };
    }>;
  };
  
  // Payment information
  payment: IPaymentInfo;
  
  // Important dates
  bookingDate: Date;
  ticketingDeadline?: Date;
  lastModified: Date;
  
  // Booking rules and conditions
  fareRules: {
    refundable: boolean;
    changeable: boolean;
    cancellationFee?: number;
    changeFee?: number;
    restrictions?: string[];
  };
  
  // Communication and notifications
  notifications: Array<{
    type: 'booking_confirmation' | 'payment_confirmation' | 'check_in_reminder' | 'flight_update' | 'cancellation';
    sentDate: Date;
    channel: 'email' | 'sms' | 'push';
    status: 'sent' | 'delivered' | 'failed';
    content?: string;
  }>;
  
  // Additional information
  specialRequests?: string[];
  notes?: string;
  agentId?: mongoose.Types.ObjectId;
  
  // Metadata
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    searchId?: string;
    affiliateId?: string;
    promoCode?: string;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  generatePNR(): string;
  calculateTotalAmount(): number;
  canBeCancelled(): boolean;
  canBeModified(): boolean;
  addNotification(type: string, channel: string): void;
}

// Passenger schema
const passengerSchema = new Schema<IPassenger>({
  passengerId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['ADULT', 'CHILD', 'INFANT', 'SENIOR']
  },
  title: {
    type: String,
    required: true,
    enum: ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof']
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  dateOfBirth: {
    type: Date,
    required: true,
    validate: {
      validator: function(value: Date) {
        return value < new Date();
      },
      message: 'Date of birth must be in the past'
    }
  },
  nationality: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  passportNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  passportExpiry: {
    type: Date,
    validate: {
      validator: function(value: Date) {
        return value > new Date();
      },
      message: 'Passport expiry date must be in the future'
    }
  },
  passportIssuingCountry: {
    type: String,
    trim: true,
    uppercase: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  specialRequests: [String],
  medicalConditions: [String],
  dietaryRequirements: [String],
  mobilityAssistance: {
    type: Boolean,
    default: false
  },
  seatPreference: {
    type: String,
    enum: ['Window', 'Aisle', 'Middle']
  },
  seatNumber: String,
  frequentFlyerNumber: String,
  frequentFlyerProgram: String
}, { _id: false });

// Flight booking schema
const flightBookingSchema = new Schema<IFlightBooking>({
  flightId: {
    type: Schema.Types.ObjectId,
    ref: 'Flight',
    required: true
  },
  amadeusOfferId: String,
  flightDetails: {
    flightNumber: {
      type: String,
      required: true
    },
    carrierCode: {
      type: String,
      required: true
    },
    origin: {
      type: String,
      required: true,
      uppercase: true
    },
    destination: {
      type: String,
      required: true,
      uppercase: true
    },
    departureDateTime: {
      type: Date,
      required: true
    },
    arrivalDateTime: {
      type: Date,
      required: true
    },
    duration: {
      type: String,
      required: true
    },
    aircraft: {
      code: String,
      name: String
    }
  },
  cabin: {
    type: String,
    required: true,
    enum: ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']
  },
  fareClass: {
    type: String,
    required: true
  },
  fareBasis: {
    type: String,
    required: true
  },
  brandedFare: String,
  seatAssignments: [{
    passengerId: {
      type: String,
      required: true
    },
    seatNumber: {
      type: String,
      required: true
    },
    seatType: {
      type: String,
      enum: ['Window', 'Aisle', 'Middle']
    }
  }],
  baggage: {
    checkedBags: [{
      passengerId: String,
      quantity: Number,
      weight: Number,
      weightUnit: {
        type: String,
        enum: ['kg', 'lb']
      }
    }],
    carryOnBags: [{
      passengerId: String,
      quantity: Number
    }]
  },
  services: [{
    type: String,
    description: String,
    price: Number,
    currency: String,
    passengerId: String
  }]
}, { _id: false });

// Payment info schema
const paymentInfoSchema = new Schema<IPaymentInfo>({
  paymentId: String,
  stripePaymentIntentId: String,
  method: {
    type: String,
    required: true,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  amount: {
    total: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    taxes: {
      type: Number,
      default: 0,
      min: 0
    },
    fees: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      match: [/^[A-Z]{3}$/, 'Currency must be a valid 3-letter code']
    }
  },
  transactionId: String,
  transactionDate: Date,
  refunds: [{
    refundId: String,
    amount: Number,
    reason: String,
    processedDate: Date,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed']
    }
  }],
  billingAddress: {
    firstName: String,
    lastName: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  }
}, { _id: false });

// Main booking schema
const bookingSchema = new Schema<IBooking>({
  pnr: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: [/^[A-Z0-9]{6}$/, 'PNR must be 6 alphanumeric characters'],
    index: true
  },
  bookingReference: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  amadeusOrderId: {
    type: String,
    sparse: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  contactEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  contactPhone: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['one-way', 'round-trip', 'multi-city']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'expired', 'refunded'],
    default: 'pending',
    index: true
  },
  bookingSource: {
    type: String,
    required: true,
    enum: ['web', 'mobile', 'api', 'agent', 'phone'],
    default: 'web'
  },
  flights: [flightBookingSchema],
  passengers: [passengerSchema],
  pricing: {
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      uppercase: true
    },
    breakdown: {
      baseFare: Number,
      taxes: Number,
      fees: Number,
      services: Number,
      discounts: Number
    },
    passengerPricing: [{
      passengerId: String,
      amount: Number,
      breakdown: {
        baseFare: Number,
        taxes: Number,
        fees: Number
      }
    }]
  },
  payment: paymentInfoSchema,
  bookingDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  ticketingDeadline: Date,
  lastModified: {
    type: Date,
    default: Date.now
  },
  fareRules: {
    refundable: {
      type: Boolean,
      default: false
    },
    changeable: {
      type: Boolean,
      default: false
    },
    cancellationFee: Number,
    changeFee: Number,
    restrictions: [String]
  },
  notifications: [{
    type: {
      type: String,
      enum: ['booking_confirmation', 'payment_confirmation', 'check_in_reminder', 'flight_update', 'cancellation']
    },
    sentDate: Date,
    channel: {
      type: String,
      enum: ['email', 'sms', 'push']
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed']
    },
    content: String
  }],
  specialRequests: [String],
  notes: String,
  agentId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    searchId: String,
    affiliateId: String,
    promoCode: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
bookingSchema.index({ pnr: 1 });
bookingSchema.index({ bookingReference: 1 });
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ contactEmail: 1 });
bookingSchema.index({ 'flights.flightDetails.departureDateTime': 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ status: 1, bookingDate: -1 });

// Virtual for passenger count
bookingSchema.virtual('passengerCount').get(function() {
  return this.passengers.length;
});

// Virtual for total duration
bookingSchema.virtual('totalDuration').get(function() {
  return this.flights.reduce((total, flight) => {
    const match = flight.flightDetails.duration.match(/PT(\d+)H(\d+)M/);
    if (match) {
      return total + parseInt(match[1]) * 60 + parseInt(match[2]);
    }
    return total;
  }, 0);
});

// Pre-save middleware to generate PNR and booking reference
bookingSchema.pre('save', function(next) {
  if (this.isNew) {
    if (!this.pnr) {
      this.pnr = this.generatePNR();
    }
    if (!this.bookingReference) {
      this.bookingReference = `BK${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    }
  }
  this.lastModified = new Date();
  next();
});

// Instance method to generate PNR
bookingSchema.methods.generatePNR = function(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let pnr = '';
  for (let i = 0; i < 6; i++) {
    pnr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pnr;
};

// Instance method to calculate total amount
bookingSchema.methods.calculateTotalAmount = function(): number {
  return this.pricing.breakdown.baseFare + 
         this.pricing.breakdown.taxes + 
         this.pricing.breakdown.fees + 
         this.pricing.breakdown.services - 
         this.pricing.breakdown.discounts;
};

// Instance method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function(): boolean {
  const now = new Date();
  const departureTime = new Date(this.flights[0]?.flightDetails.departureDateTime);
  const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return this.status === 'confirmed' && 
         hoursUntilDeparture > 24 && 
         this.fareRules.refundable;
};

// Instance method to check if booking can be modified
bookingSchema.methods.canBeModified = function(): boolean {
  const now = new Date();
  const departureTime = new Date(this.flights[0]?.flightDetails.departureDateTime);
  const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return this.status === 'confirmed' && 
         hoursUntilDeparture > 2 && 
         this.fareRules.changeable;
};

// Instance method to add notification
bookingSchema.methods.addNotification = function(type: string, channel: string): void {
  this.notifications.push({
    type,
    sentDate: new Date(),
    channel,
    status: 'sent'
  });
};

// Static method to find by PNR
bookingSchema.statics.findByPNR = function(pnr: string) {
  return this.findOne({ pnr: pnr.toUpperCase() });
};

// Static method to find user bookings
bookingSchema.statics.findUserBookings = function(userId: string, status?: string) {
  const query: any = { userId };
  if (status) {
    query.status = status;
  }
  return this.find(query).sort({ createdAt: -1 });
};

// Create and export the model
export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
export default Booking;

