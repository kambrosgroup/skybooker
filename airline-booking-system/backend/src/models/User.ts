import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/config';

// User interface
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: Date;
    nationality?: string;
    passportNumber?: string;
    passportExpiry?: Date;
    title?: 'Mr' | 'Mrs' | 'Ms' | 'Dr' | 'Prof';
    gender?: 'Male' | 'Female' | 'Other';
  };
  role: 'user' | 'admin' | 'agent';
  preferences: {
    currency: string;
    language: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    seatPreference?: 'Window' | 'Aisle' | 'Middle';
    mealPreference?: string;
  };
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generatePasswordResetToken(): string;
  isLocked(): boolean;
  incLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

// User schema
const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  profile: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function(value: Date) {
          return value < new Date();
        },
        message: 'Date of birth must be in the past'
      }
    },
    nationality: {
      type: String,
      trim: true,
      maxlength: [50, 'Nationality cannot exceed 50 characters']
    },
    passportNumber: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: [20, 'Passport number cannot exceed 20 characters']
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
    title: {
      type: String,
      enum: ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof']
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other']
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'agent'],
    default: 'user'
  },
  preferences: {
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      match: [/^[A-Z]{3}$/, 'Currency must be a valid 3-letter code']
    },
    language: {
      type: String,
      default: 'en',
      lowercase: true,
      match: [/^[a-z]{2}$/, 'Language must be a valid 2-letter code']
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    seatPreference: {
      type: String,
      enum: ['Window', 'Aisle', 'Middle']
    },
    mealPreference: {
      type: String,
      trim: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ 'profile.firstName': 1, 'profile.lastName': 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('profile.fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, config.bcryptRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate password reset token
userSchema.methods.generatePasswordResetToken = function(): string {
  const resetToken = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
  
  this.passwordResetToken = resetToken;
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  return resetToken;
};

// Instance method to check if account is locked
userSchema.methods.isLocked = function(): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = async function(): Promise<void> {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates: any = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + 2 * 60 * 60 * 1000) }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = async function(): Promise<void> {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Static method to find by email
userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Create and export the model
export const User = mongoose.model<IUser>('User', userSchema);
export default User;

