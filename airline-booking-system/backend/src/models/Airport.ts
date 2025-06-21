import mongoose, { Document, Schema } from 'mongoose';

// Airport interface
export interface IAirport extends Document {
  _id: mongoose.Types.ObjectId;
  
  // Basic airport information
  iataCode: string; // 3-letter IATA code (e.g., 'JFK')
  icaoCode?: string; // 4-letter ICAO code (e.g., 'KJFK')
  name: string;
  
  // Location information
  city: string;
  country: string;
  countryCode: string; // ISO 2-letter country code
  region?: string; // State/Province/Region
  
  // Geographic coordinates
  coordinates: {
    latitude: number;
    longitude: number;
    altitude?: number; // in meters
  };
  
  // Airport details
  timezone: string; // IANA timezone (e.g., 'America/New_York')
  utcOffset: number; // UTC offset in hours
  
  // Facilities and services
  facilities: {
    terminals: number;
    runways: number;
    parkingSpaces?: number;
    lounges?: string[];
    shops?: string[];
    restaurants?: string[];
    hotels?: string[];
    carRental?: string[];
    publicTransport?: string[];
  };
  
  // Operational information
  operationalStatus: 'active' | 'inactive' | 'seasonal' | 'under_construction';
  isInternational: boolean;
  isDomestic: boolean;
  
  // Contact and website information
  website?: string;
  phone?: string;
  email?: string;
  
  // Additional metadata
  aliases?: string[]; // Alternative names
  keywords?: string[]; // For search optimization
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Airport schema
const airportSchema = new Schema<IAirport>({
  iataCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: [/^[A-Z]{3}$/, 'IATA code must be 3 uppercase letters'],
    index: true
  },
  icaoCode: {
    type: String,
    uppercase: true,
    match: [/^[A-Z]{4}$/, 'ICAO code must be 4 uppercase letters'],
    sparse: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    index: true
  },
  city: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  country: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  countryCode: {
    type: String,
    required: true,
    uppercase: true,
    match: [/^[A-Z]{2}$/, 'Country code must be 2 uppercase letters'],
    index: true
  },
  region: {
    type: String,
    trim: true,
    maxlength: 100
  },
  coordinates: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    altitude: {
      type: Number,
      min: -500,
      max: 10000
    }
  },
  timezone: {
    type: String,
    required: true,
    trim: true
  },
  utcOffset: {
    type: Number,
    required: true,
    min: -12,
    max: 14
  },
  facilities: {
    terminals: {
      type: Number,
      default: 1,
      min: 1
    },
    runways: {
      type: Number,
      default: 1,
      min: 1
    },
    parkingSpaces: {
      type: Number,
      min: 0
    },
    lounges: [String],
    shops: [String],
    restaurants: [String],
    hotels: [String],
    carRental: [String],
    publicTransport: [String]
  },
  operationalStatus: {
    type: String,
    enum: ['active', 'inactive', 'seasonal', 'under_construction'],
    default: 'active',
    index: true
  },
  isInternational: {
    type: Boolean,
    default: true,
    index: true
  },
  isDomestic: {
    type: Boolean,
    default: true,
    index: true
  },
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Website must be a valid URL']
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  aliases: [String],
  keywords: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient searching
airportSchema.index({ iataCode: 1 });
airportSchema.index({ city: 1, country: 1 });
airportSchema.index({ name: 'text', city: 'text', country: 'text', aliases: 'text' });
airportSchema.index({ 'coordinates.latitude': 1, 'coordinates.longitude': 1 });
airportSchema.index({ operationalStatus: 1, isInternational: 1 });

// Virtual for full location
airportSchema.virtual('fullLocation').get(function() {
  return this.region ? `${this.city}, ${this.region}, ${this.country}` : `${this.city}, ${this.country}`;
});

// Virtual for display name
airportSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.iataCode})`;
});

// Static method to search airports
airportSchema.statics.search = function(query: string, limit: number = 10) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    $or: [
      { iataCode: searchRegex },
      { icaoCode: searchRegex },
      { name: searchRegex },
      { city: searchRegex },
      { country: searchRegex },
      { aliases: { $in: [searchRegex] } }
    ],
    operationalStatus: 'active'
  }).limit(limit).sort({ name: 1 });
};

// Static method to find nearby airports
airportSchema.statics.findNearby = function(latitude: number, longitude: number, maxDistance: number = 100) {
  return this.find({
    'coordinates.latitude': {
      $gte: latitude - (maxDistance / 111), // Rough conversion: 1 degree ≈ 111 km
      $lte: latitude + (maxDistance / 111)
    },
    'coordinates.longitude': {
      $gte: longitude - (maxDistance / (111 * Math.cos(latitude * Math.PI / 180))),
      $lte: longitude + (maxDistance / (111 * Math.cos(latitude * Math.PI / 180)))
    },
    operationalStatus: 'active'
  }).sort({ name: 1 });
};

// Create and export the Airport model
export const Airport = mongoose.model<IAirport>('Airport', airportSchema);

// Airline interface
export interface IAirline extends Document {
  _id: mongoose.Types.ObjectId;
  
  // Basic airline information
  iataCode: string; // 2-letter IATA code (e.g., 'AA')
  icaoCode?: string; // 3-letter ICAO code (e.g., 'AAL')
  name: string;
  
  // Branding and display
  displayName?: string;
  logo?: string; // URL to logo image
  website?: string;
  
  // Operational information
  country: string;
  countryCode: string; // ISO 2-letter country code
  headquarters: string;
  
  // Fleet and operations
  fleetSize?: number;
  destinations?: number;
  foundedYear?: number;
  
  // Alliance and partnerships
  alliance?: 'Star Alliance' | 'SkyTeam' | 'Oneworld' | 'None';
  partners?: string[]; // IATA codes of partner airlines
  
  // Service information
  serviceType: 'full-service' | 'low-cost' | 'regional' | 'charter' | 'cargo';
  cabinClasses: Array<'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'>;
  
  // Contact information
  phone?: string;
  email?: string;
  customerService?: {
    phone?: string;
    email?: string;
    hours?: string;
  };
  
  // Frequent flyer program
  loyaltyProgram?: {
    name: string;
    website?: string;
    tiers?: string[];
  };
  
  // Operational status
  operationalStatus: 'active' | 'inactive' | 'suspended' | 'merged';
  
  // Additional metadata
  aliases?: string[]; // Alternative names
  keywords?: string[]; // For search optimization
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Airline schema
const airlineSchema = new Schema<IAirline>({
  iataCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: [/^[A-Z0-9]{2}$/, 'IATA code must be 2 uppercase alphanumeric characters'],
    index: true
  },
  icaoCode: {
    type: String,
    uppercase: true,
    match: [/^[A-Z]{3}$/, 'ICAO code must be 3 uppercase letters'],
    sparse: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    index: true
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: 200
  },
  logo: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Logo must be a valid URL']
  },
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Website must be a valid URL']
  },
  country: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  countryCode: {
    type: String,
    required: true,
    uppercase: true,
    match: [/^[A-Z]{2}$/, 'Country code must be 2 uppercase letters'],
    index: true
  },
  headquarters: {
    type: String,
    trim: true,
    maxlength: 200
  },
  fleetSize: {
    type: Number,
    min: 0
  },
  destinations: {
    type: Number,
    min: 0
  },
  foundedYear: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear()
  },
  alliance: {
    type: String,
    enum: ['Star Alliance', 'SkyTeam', 'Oneworld', 'None'],
    default: 'None'
  },
  partners: [{
    type: String,
    uppercase: true,
    match: [/^[A-Z0-9]{2}$/, 'Partner code must be 2 uppercase alphanumeric characters']
  }],
  serviceType: {
    type: String,
    required: true,
    enum: ['full-service', 'low-cost', 'regional', 'charter', 'cargo'],
    index: true
  },
  cabinClasses: [{
    type: String,
    enum: ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']
  }],
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  customerService: {
    phone: String,
    email: {
      type: String,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    hours: String
  },
  loyaltyProgram: {
    name: String,
    website: {
      type: String,
      match: [/^https?:\/\/.+/, 'Website must be a valid URL']
    },
    tiers: [String]
  },
  operationalStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'merged'],
    default: 'active',
    index: true
  },
  aliases: [String],
  keywords: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient searching
airlineSchema.index({ iataCode: 1 });
airlineSchema.index({ name: 'text', displayName: 'text', aliases: 'text' });
airlineSchema.index({ country: 1, operationalStatus: 1 });
airlineSchema.index({ serviceType: 1, operationalStatus: 1 });

// Virtual for full display name
airlineSchema.virtual('fullDisplayName').get(function() {
  return this.displayName || this.name;
});

// Virtual for airline identifier
airlineSchema.virtual('identifier').get(function() {
  return `${this.name} (${this.iataCode})`;
});

// Static method to search airlines
airlineSchema.statics.search = function(query: string, limit: number = 10) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    $or: [
      { iataCode: searchRegex },
      { icaoCode: searchRegex },
      { name: searchRegex },
      { displayName: searchRegex },
      { aliases: { $in: [searchRegex] } }
    ],
    operationalStatus: 'active'
  }).limit(limit).sort({ name: 1 });
};

// Static method to find by service type
airlineSchema.statics.findByServiceType = function(serviceType: string) {
  return this.find({
    serviceType,
    operationalStatus: 'active'
  }).sort({ name: 1 });
};

// Create and export the Airline model
export const Airline = mongoose.model<IAirline>('Airline', airlineSchema);

// Export both models
export { Airport };
export default { Airport, Airline };

