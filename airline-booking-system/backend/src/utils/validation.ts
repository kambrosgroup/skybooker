import Joi from 'joi';

// User registration validation schema
export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Password confirmation does not match',
      'any.required': 'Password confirmation is required'
    }),
  
  profile: Joi.object({
    firstName: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.min': 'First name is required',
        'string.max': 'First name cannot exceed 50 characters',
        'any.required': 'First name is required'
      }),
    
    lastName: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.min': 'Last name is required',
        'string.max': 'Last name cannot exceed 50 characters',
        'any.required': 'Last name is required'
      }),
    
    phone: Joi.string()
      .pattern(new RegExp('^\\+?[\\d\\s\\-\\(\\)]+$'))
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    
    dateOfBirth: Joi.date()
      .max('now')
      .optional()
      .messages({
        'date.max': 'Date of birth must be in the past'
      }),
    
    nationality: Joi.string()
      .trim()
      .max(50)
      .optional(),
    
    title: Joi.string()
      .valid('Mr', 'Mrs', 'Ms', 'Dr', 'Prof')
      .optional(),
    
    gender: Joi.string()
      .valid('Male', 'Female', 'Other')
      .optional()
  }).required(),
  
  preferences: Joi.object({
    currency: Joi.string()
      .length(3)
      .uppercase()
      .default('USD')
      .optional(),
    
    language: Joi.string()
      .length(2)
      .lowercase()
      .default('en')
      .optional(),
    
    notifications: Joi.object({
      email: Joi.boolean().default(true),
      sms: Joi.boolean().default(false),
      push: Joi.boolean().default(true)
    }).optional()
  }).optional()
});

// User login validation schema
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    }),
  
  rememberMe: Joi.boolean()
    .default(false)
    .optional()
});

// Refresh token validation schema
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required'
    })
});

// Forgot password validation schema
export const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

// Reset password validation schema
export const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Reset token is required'
    }),
  
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Password confirmation does not match',
      'any.required': 'Password confirmation is required'
    })
});

// Change password validation schema
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.max': 'New password cannot exceed 128 characters',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'New password is required'
    }),
  
  confirmNewPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'New password confirmation does not match',
      'any.required': 'New password confirmation is required'
    })
});

// Update profile validation schema
export const updateProfileSchema = Joi.object({
  profile: Joi.object({
    firstName: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .optional()
      .messages({
        'string.min': 'First name cannot be empty',
        'string.max': 'First name cannot exceed 50 characters'
      }),
    
    lastName: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Last name cannot be empty',
        'string.max': 'Last name cannot exceed 50 characters'
      }),
    
    phone: Joi.string()
      .pattern(new RegExp('^\\+?[\\d\\s\\-\\(\\)]+$'))
      .optional()
      .allow('')
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    
    dateOfBirth: Joi.date()
      .max('now')
      .optional()
      .messages({
        'date.max': 'Date of birth must be in the past'
      }),
    
    nationality: Joi.string()
      .trim()
      .max(50)
      .optional()
      .allow(''),
    
    passportNumber: Joi.string()
      .trim()
      .max(20)
      .optional()
      .allow(''),
    
    passportExpiry: Joi.date()
      .min('now')
      .optional()
      .messages({
        'date.min': 'Passport expiry date must be in the future'
      }),
    
    title: Joi.string()
      .valid('Mr', 'Mrs', 'Ms', 'Dr', 'Prof')
      .optional(),
    
    gender: Joi.string()
      .valid('Male', 'Female', 'Other')
      .optional()
  }).optional(),
  
  preferences: Joi.object({
    currency: Joi.string()
      .length(3)
      .uppercase()
      .optional(),
    
    language: Joi.string()
      .length(2)
      .lowercase()
      .optional(),
    
    notifications: Joi.object({
      email: Joi.boolean().optional(),
      sms: Joi.boolean().optional(),
      push: Joi.boolean().optional()
    }).optional(),
    
    seatPreference: Joi.string()
      .valid('Window', 'Aisle', 'Middle')
      .optional(),
    
    mealPreference: Joi.string()
      .trim()
      .max(100)
      .optional()
      .allow('')
  }).optional()
});

// Email verification validation schema
export const emailVerificationSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Verification token is required'
    })
});

// Resend verification email schema
export const resendVerificationSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

// Flight search validation schema
export const flightSearchSchema = Joi.object({
  origin: Joi.string()
    .length(3)
    .uppercase()
    .required()
    .messages({
      'string.length': 'Origin must be a valid 3-letter airport code',
      'any.required': 'Origin airport is required'
    }),
  
  destination: Joi.string()
    .length(3)
    .uppercase()
    .required()
    .messages({
      'string.length': 'Destination must be a valid 3-letter airport code',
      'any.required': 'Destination airport is required'
    }),
  
  departureDate: Joi.date()
    .min('now')
    .required()
    .messages({
      'date.min': 'Departure date must be in the future',
      'any.required': 'Departure date is required'
    }),
  
  returnDate: Joi.date()
    .min(Joi.ref('departureDate'))
    .optional()
    .messages({
      'date.min': 'Return date must be after departure date'
    }),
  
  passengers: Joi.object({
    adults: Joi.number()
      .integer()
      .min(1)
      .max(9)
      .default(1)
      .messages({
        'number.min': 'At least 1 adult passenger is required',
        'number.max': 'Maximum 9 passengers allowed'
      }),
    
    children: Joi.number()
      .integer()
      .min(0)
      .max(8)
      .default(0)
      .messages({
        'number.min': 'Children count cannot be negative',
        'number.max': 'Maximum 8 children allowed'
      }),
    
    infants: Joi.number()
      .integer()
      .min(0)
      .max(8)
      .default(0)
      .messages({
        'number.min': 'Infants count cannot be negative',
        'number.max': 'Maximum 8 infants allowed'
      })
  }).optional(),
  
  cabin: Joi.string()
    .valid('ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST')
    .default('ECONOMY')
    .optional(),
  
  currency: Joi.string()
    .length(3)
    .uppercase()
    .default('USD')
    .optional(),
  
  maxPrice: Joi.number()
    .positive()
    .optional(),
  
  directFlightsOnly: Joi.boolean()
    .default(false)
    .optional(),
  
  maxStops: Joi.number()
    .integer()
    .min(0)
    .max(3)
    .optional(),
  
  preferredAirlines: Joi.array()
    .items(Joi.string().length(2).uppercase())
    .optional(),
  
  excludedAirlines: Joi.array()
    .items(Joi.string().length(2).uppercase())
    .optional()
});

// Booking creation validation schema
export const createBookingSchema = Joi.object({
  flightOffers: Joi.array()
    .items(Joi.string().required())
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one flight offer is required',
      'any.required': 'Flight offers are required'
    }),
  
  passengers: Joi.array()
    .items(Joi.object({
      type: Joi.string()
        .valid('ADULT', 'CHILD', 'INFANT', 'SENIOR')
        .required(),
      
      title: Joi.string()
        .valid('Mr', 'Mrs', 'Ms', 'Dr', 'Prof')
        .required(),
      
      firstName: Joi.string()
        .trim()
        .min(1)
        .max(50)
        .required(),
      
      lastName: Joi.string()
        .trim()
        .min(1)
        .max(50)
        .required(),
      
      gender: Joi.string()
        .valid('Male', 'Female', 'Other')
        .required(),
      
      dateOfBirth: Joi.date()
        .max('now')
        .required(),
      
      nationality: Joi.string()
        .trim()
        .max(50)
        .required(),
      
      passportNumber: Joi.string()
        .trim()
        .max(20)
        .optional(),
      
      passportExpiry: Joi.date()
        .min('now')
        .optional(),
      
      email: Joi.string()
        .email()
        .optional(),
      
      phone: Joi.string()
        .pattern(new RegExp('^\\+?[\\d\\s\\-\\(\\)]+$'))
        .optional(),
      
      specialRequests: Joi.array()
        .items(Joi.string())
        .optional(),
      
      seatPreference: Joi.string()
        .valid('Window', 'Aisle', 'Middle')
        .optional()
    }))
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one passenger is required',
      'any.required': 'Passenger information is required'
    }),
  
  contactInfo: Joi.object({
    email: Joi.string()
      .email()
      .required(),
    
    phone: Joi.string()
      .pattern(new RegExp('^\\+?[\\d\\s\\-\\(\\)]+$'))
      .required()
  }).required(),
  
  specialRequests: Joi.array()
    .items(Joi.string())
    .optional(),
  
  promoCode: Joi.string()
    .trim()
    .optional()
});

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: validationErrors,
          timestamp: new Date().toISOString()
        }
      });
    }

    req.body = value;
    next();
  };
};

export default {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  emailVerificationSchema,
  resendVerificationSchema,
  flightSearchSchema,
  createBookingSchema,
  validate
};



// Flight search validation schema
export const flightSearchSchema = Joi.object({
  origin: Joi.string()
    .length(3)
    .uppercase()
    .required()
    .messages({
      'string.length': 'Origin must be a 3-letter IATA airport code',
      'string.uppercase': 'Origin must be uppercase',
      'any.required': 'Origin airport code is required'
    }),
  
  destination: Joi.string()
    .length(3)
    .uppercase()
    .required()
    .messages({
      'string.length': 'Destination must be a 3-letter IATA airport code',
      'string.uppercase': 'Destination must be uppercase',
      'any.required': 'Destination airport code is required'
    }),
  
  departureDate: Joi.date()
    .min('now')
    .required()
    .messages({
      'date.min': 'Departure date must be in the future',
      'any.required': 'Departure date is required'
    }),
  
  returnDate: Joi.date()
    .min(Joi.ref('departureDate'))
    .optional()
    .messages({
      'date.min': 'Return date must be after departure date'
    }),
  
  passengers: Joi.object({
    adults: Joi.number()
      .integer()
      .min(1)
      .max(9)
      .default(1)
      .messages({
        'number.min': 'At least 1 adult passenger is required',
        'number.max': 'Maximum 9 adult passengers allowed'
      }),
    
    children: Joi.number()
      .integer()
      .min(0)
      .max(8)
      .default(0)
      .messages({
        'number.min': 'Children count cannot be negative',
        'number.max': 'Maximum 8 children allowed'
      }),
    
    infants: Joi.number()
      .integer()
      .min(0)
      .max(8)
      .default(0)
      .messages({
        'number.min': 'Infants count cannot be negative',
        'number.max': 'Maximum 8 infants allowed'
      })
  }).optional(),
  
  cabin: Joi.string()
    .valid('ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST')
    .default('ECONOMY')
    .messages({
      'any.only': 'Cabin must be one of: ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST'
    }),
  
  currency: Joi.string()
    .length(3)
    .uppercase()
    .default('USD')
    .messages({
      'string.length': 'Currency must be a 3-letter currency code',
      'string.uppercase': 'Currency must be uppercase'
    }),
  
  maxPrice: Joi.number()
    .positive()
    .optional()
    .messages({
      'number.positive': 'Maximum price must be positive'
    }),
  
  directFlightsOnly: Joi.boolean()
    .default(false),
  
  maxStops: Joi.number()
    .integer()
    .min(0)
    .max(3)
    .optional()
    .messages({
      'number.min': 'Maximum stops cannot be negative',
      'number.max': 'Maximum 3 stops allowed'
    }),
  
  preferredAirlines: Joi.array()
    .items(Joi.string().length(2).uppercase())
    .optional()
    .messages({
      'array.includes': 'Preferred airlines must be 2-letter airline codes'
    }),
  
  excludedAirlines: Joi.array()
    .items(Joi.string().length(2).uppercase())
    .optional()
    .messages({
      'array.includes': 'Excluded airlines must be 2-letter airline codes'
    })
});

// Flight pricing validation schema
export const flightPricingSchema = Joi.object({
  flightOffers: Joi.array()
    .items(Joi.object())
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one flight offer is required',
      'any.required': 'Flight offers are required'
    })
});

// Location search validation schema
export const locationSearchSchema = Joi.object({
  query: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Search query must be at least 2 characters',
      'string.max': 'Search query must be less than 50 characters',
      'any.required': 'Search query is required'
    }),
  
  type: Joi.string()
    .valid('AIRPORT', 'CITY')
    .optional()
    .messages({
      'any.only': 'Type must be either AIRPORT or CITY'
    })
});

// Airline info validation schema
export const airlineInfoSchema = Joi.object({
  airlineCodes: Joi.alternatives()
    .try(
      Joi.string().pattern(/^[A-Z]{2}(,[A-Z]{2})*$/),
      Joi.array().items(Joi.string().length(2).uppercase())
    )
    .required()
    .messages({
      'alternatives.match': 'Airline codes must be 2-letter codes separated by commas or an array',
      'any.required': 'Airline codes are required'
    })
});


// Booking creation validation schema
export const bookingCreateSchema = Joi.object({
  flightOffers: Joi.array()
    .items(Joi.object())
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one flight offer is required',
      'any.required': 'Flight offers are required'
    }),

  passengers: Joi.array()
    .items(Joi.object({
      type: Joi.string()
        .valid('adult', 'child', 'infant')
        .required()
        .messages({
          'any.only': 'Passenger type must be adult, child, or infant',
          'any.required': 'Passenger type is required'
        }),
      
      title: Joi.string()
        .valid('Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof')
        .optional(),
      
      firstName: Joi.string()
        .min(1)
        .max(50)
        .required()
        .messages({
          'string.min': 'First name is required',
          'string.max': 'First name must be less than 50 characters',
          'any.required': 'First name is required'
        }),
      
      lastName: Joi.string()
        .min(1)
        .max(50)
        .required()
        .messages({
          'string.min': 'Last name is required',
          'string.max': 'Last name must be less than 50 characters',
          'any.required': 'Last name is required'
        }),
      
      dateOfBirth: Joi.date()
        .max('now')
        .required()
        .messages({
          'date.max': 'Date of birth cannot be in the future',
          'any.required': 'Date of birth is required'
        }),
      
      gender: Joi.string()
        .valid('M', 'F')
        .required()
        .messages({
          'any.only': 'Gender must be M or F',
          'any.required': 'Gender is required'
        }),
      
      nationality: Joi.string()
        .length(2)
        .uppercase()
        .optional()
        .messages({
          'string.length': 'Nationality must be a 2-letter country code'
        }),
      
      passportNumber: Joi.string()
        .min(6)
        .max(20)
        .optional()
        .messages({
          'string.min': 'Passport number must be at least 6 characters',
          'string.max': 'Passport number must be less than 20 characters'
        }),
      
      passportExpiry: Joi.date()
        .min('now')
        .optional()
        .messages({
          'date.min': 'Passport expiry date must be in the future'
        }),
      
      passportCountry: Joi.string()
        .length(2)
        .uppercase()
        .optional()
        .messages({
          'string.length': 'Passport country must be a 2-letter country code'
        }),
      
      email: Joi.string()
        .email()
        .optional()
        .messages({
          'string.email': 'Invalid email format'
        }),
      
      phone: Joi.string()
        .pattern(/^\+?[\d\s\-\(\)]+$/)
        .optional()
        .messages({
          'string.pattern.base': 'Invalid phone number format'
        }),
      
      specialRequests: Joi.array()
        .items(Joi.string())
        .optional(),
      
      frequentFlyerNumber: Joi.string()
        .optional(),
      
      seatPreference: Joi.string()
        .valid('window', 'aisle', 'middle', 'any')
        .optional(),
      
      mealPreference: Joi.string()
        .valid('regular', 'vegetarian', 'vegan', 'kosher', 'halal', 'gluten_free', 'diabetic')
        .optional()
    }))
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one passenger is required',
      'any.required': 'Passenger information is required'
    }),

  contactInfo: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Invalid email format',
        'any.required': 'Contact email is required'
      }),
    
    phone: Joi.string()
      .pattern(/^\+?[\d\s\-\(\)]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid phone number format',
        'any.required': 'Contact phone is required'
      }),
    
    address: Joi.object({
      street: Joi.string()
        .min(1)
        .max(100)
        .required()
        .messages({
          'string.min': 'Street address is required',
          'any.required': 'Street address is required'
        }),
      
      city: Joi.string()
        .min(1)
        .max(50)
        .required()
        .messages({
          'string.min': 'City is required',
          'any.required': 'City is required'
        }),
      
      state: Joi.string()
        .min(1)
        .max(50)
        .optional(),
      
      postalCode: Joi.string()
        .min(1)
        .max(20)
        .required()
        .messages({
          'string.min': 'Postal code is required',
          'any.required': 'Postal code is required'
        }),
      
      country: Joi.string()
        .length(2)
        .uppercase()
        .required()
        .messages({
          'string.length': 'Country must be a 2-letter country code',
          'any.required': 'Country is required'
        })
    }).required(),
    
    emergencyContact: Joi.object({
      name: Joi.string()
        .min(1)
        .max(100)
        .required(),
      
      phone: Joi.string()
        .pattern(/^\+?[\d\s\-\(\)]+$/)
        .required(),
      
      relationship: Joi.string()
        .min(1)
        .max(50)
        .required()
    }).optional()
  }).required(),

  paymentInfo: Joi.object({
    method: Joi.string()
      .valid('credit_card', 'debit_card', 'paypal', 'bank_transfer')
      .required(),
    
    amount: Joi.number()
      .positive()
      .required(),
    
    currency: Joi.string()
      .length(3)
      .uppercase()
      .required(),
    
    paymentIntentId: Joi.string()
      .optional()
  }).optional(),

  specialRequests: Joi.array()
    .items(Joi.string())
    .optional(),

  remarks: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Remarks must be less than 500 characters'
    }),

  travelInsurance: Joi.boolean()
    .default(false),

  marketingConsent: Joi.boolean()
    .default(false)
});

// Booking update validation schema
export const bookingUpdateSchema = Joi.object({
  status: Joi.string()
    .valid('confirmed', 'cancelled', 'pending', 'expired', 'refunded')
    .optional()
    .messages({
      'any.only': 'Status must be one of: confirmed, cancelled, pending, expired, refunded'
    }),

  passengers: Joi.array()
    .items(Joi.object({
      id: Joi.string().optional(),
      firstName: Joi.string().min(1).max(50).optional(),
      lastName: Joi.string().min(1).max(50).optional(),
      email: Joi.string().email().optional(),
      phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
      specialRequests: Joi.array().items(Joi.string()).optional(),
      seatAssignment: Joi.string().optional()
    }))
    .optional(),

  contactInfo: Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
    address: Joi.object({
      street: Joi.string().min(1).max(100).optional(),
      city: Joi.string().min(1).max(50).optional(),
      state: Joi.string().min(1).max(50).optional(),
      postalCode: Joi.string().min(1).max(20).optional(),
      country: Joi.string().length(2).uppercase().optional()
    }).optional()
  }).optional(),

  specialRequests: Joi.array()
    .items(Joi.string())
    .optional(),

  remarks: Joi.string()
    .max(500)
    .optional()
});

// PNR search validation schema
export const pnrSearchSchema = Joi.object({
  pnr: Joi.string()
    .length(6)
    .uppercase()
    .pattern(/^[A-Z0-9]{6}$/)
    .required()
    .messages({
      'string.length': 'PNR must be 6 characters',
      'string.pattern.base': 'PNR must contain only letters and numbers',
      'any.required': 'PNR is required'
    }),

  lastName: Joi.string()
    .min(1)
    .max(50)
    .optional(),

  email: Joi.string()
    .email()
    .optional()
}).or('lastName', 'email')
  .messages({
    'object.missing': 'Either last name or email is required for verification'
  });

