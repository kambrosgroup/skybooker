import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { JWTUtils, TokenBlacklist } from '../utils/jwt';
import { createError, catchAsync } from '../middleware/errorHandler';
import { logSecurityEvent, logBusinessEvent } from '../utils/logger';
import { config } from '../config/config';

// Email service (placeholder - will be implemented in Phase 9)
const sendEmail = async (to: string, subject: string, content: string) => {
  // TODO: Implement email sending in Phase 9
  console.log(`Email to ${to}: ${subject}`);
};

/**
 * Register a new user
 */
export const register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, profile, preferences } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw createError.conflict('User with this email already exists', 'USER_ALREADY_EXISTS');
  }

  // Create new user
  const user = new User({
    email: email.toLowerCase(),
    password,
    profile,
    preferences: {
      ...preferences,
      notifications: {
        email: true,
        sms: false,
        push: true,
        ...preferences?.notifications
      }
    }
  });

  // Generate email verification token
  user.emailVerificationToken = JWTUtils.generateEmailVerificationToken();

  await user.save();

  // Send verification email
  await sendEmail(
    user.email,
    'Verify Your Email Address',
    `Please verify your email by clicking this link: ${config.frontendUrl}/verify-email?token=${user.emailVerificationToken}`
  );

  // Generate tokens
  const tokens = JWTUtils.generateTokenPair(user);

  // Log business event
  logBusinessEvent('User registered', user._id.toString());

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please check your email for verification.',
    data: {
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        preferences: user.preferences,
        createdAt: user.createdAt
      },
      tokens
    }
  });
});

/**
 * Login user
 */
export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, rememberMe } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  
  if (!user) {
    logSecurityEvent('Login attempt with non-existent email', undefined, req.ip, req.get('User-Agent'), { email });
    throw createError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Check if account is locked
  if (user.isLocked()) {
    logSecurityEvent('Login attempt on locked account', user._id.toString(), req.ip, req.get('User-Agent'));
    throw createError.unauthorized('Account is temporarily locked due to too many failed login attempts', 'ACCOUNT_LOCKED');
  }

  // Check if account is active
  if (!user.isActive) {
    logSecurityEvent('Login attempt on inactive account', user._id.toString(), req.ip, req.get('User-Agent'));
    throw createError.unauthorized('Account is deactivated', 'ACCOUNT_DEACTIVATED');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    // Increment login attempts
    await user.incLoginAttempts();
    
    logSecurityEvent('Failed login attempt', user._id.toString(), req.ip, req.get('User-Agent'));
    throw createError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const tokens = JWTUtils.generateTokenPair(user);

  // Log successful login
  logBusinessEvent('User logged in', user._id.toString());

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        preferences: user.preferences,
        lastLogin: user.lastLogin
      },
      tokens
    }
  });
});

/**
 * Refresh access token
 */
export const refreshToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;

  // Verify refresh token
  const payload = JWTUtils.verifyRefreshToken(refreshToken);

  // Find user
  const user = await User.findById(payload.userId);
  
  if (!user) {
    throw createError.unauthorized('User not found', 'USER_NOT_FOUND');
  }

  if (!user.isActive) {
    throw createError.unauthorized('Account is deactivated', 'ACCOUNT_DEACTIVATED');
  }

  // Generate new tokens
  const tokens = JWTUtils.generateTokenPair(user);

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      tokens
    }
  });
});

/**
 * Logout user
 */
export const logout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.token;

  if (token) {
    // Add token to blacklist
    TokenBlacklist.addToken(token);
    
    logBusinessEvent('User logged out', req.user?._id.toString());
  }

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * Forgot password
 */
export const forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  
  if (!user) {
    // Don't reveal if email exists or not
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }

  // Generate password reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save();

  // Send password reset email
  await sendEmail(
    user.email,
    'Password Reset Request',
    `Reset your password by clicking this link: ${config.frontendUrl}/reset-password?token=${resetToken}`
  );

  logBusinessEvent('Password reset requested', user._id.toString());

  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.'
  });
});

/**
 * Reset password
 */
export const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { token, password } = req.body;

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() }
  });

  if (!user) {
    throw createError.badRequest('Invalid or expired reset token', 'INVALID_RESET_TOKEN');
  }

  // Update password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  
  await user.save();

  logBusinessEvent('Password reset completed', user._id.toString());

  res.json({
    success: true,
    message: 'Password reset successful'
  });
});

/**
 * Change password (for authenticated users)
 */
export const changePassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user!._id).select('+password');

  if (!user) {
    throw createError.notFound('User not found', 'USER_NOT_FOUND');
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  
  if (!isCurrentPasswordValid) {
    throw createError.badRequest('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  logBusinessEvent('Password changed', user._id.toString());

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * Verify email address
 */
export const verifyEmail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.body;

  const user = await User.findOne({ emailVerificationToken: token });

  if (!user) {
    throw createError.badRequest('Invalid verification token', 'INVALID_VERIFICATION_TOKEN');
  }

  // Mark email as verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  
  await user.save();

  logBusinessEvent('Email verified', user._id.toString());

  res.json({
    success: true,
    message: 'Email verified successfully'
  });
});

/**
 * Resend email verification
 */
export const resendVerification = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Don't reveal if email exists or not
    return res.json({
      success: true,
      message: 'If an account with that email exists and is not verified, a verification email has been sent.'
    });
  }

  if (user.isEmailVerified) {
    return res.json({
      success: true,
      message: 'Email is already verified'
    });
  }

  // Generate new verification token
  user.emailVerificationToken = JWTUtils.generateEmailVerificationToken();
  await user.save();

  // Send verification email
  await sendEmail(
    user.email,
    'Verify Your Email Address',
    `Please verify your email by clicking this link: ${config.frontendUrl}/verify-email?token=${user.emailVerificationToken}`
  );

  res.json({
    success: true,
    message: 'If an account with that email exists and is not verified, a verification email has been sent.'
  });
});

/**
 * Get current user profile
 */
export const getProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user!;

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  });
});

/**
 * Update user profile
 */
export const updateProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { profile, preferences } = req.body;
  const user = req.user!;

  // Update profile fields
  if (profile) {
    Object.assign(user.profile, profile);
  }

  // Update preferences
  if (preferences) {
    Object.assign(user.preferences, preferences);
  }

  await user.save();

  logBusinessEvent('Profile updated', user._id.toString());

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        preferences: user.preferences,
        updatedAt: user.updatedAt
      }
    }
  });
});

/**
 * Delete user account
 */
export const deleteAccount = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user!;

  // Soft delete - deactivate account
  user.isActive = false;
  await user.save();

  // Add current token to blacklist
  if (req.token) {
    TokenBlacklist.addToken(req.token);
  }

  logBusinessEvent('Account deleted', user._id.toString());

  res.json({
    success: true,
    message: 'Account deactivated successfully'
  });
});

/**
 * Check authentication status
 */
export const checkAuth = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;

  if (!user) {
    return res.json({
      success: false,
      authenticated: false
    });
  }

  res.json({
    success: true,
    authenticated: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    }
  });
});

export default {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  resendVerification,
  getProfile,
  updateProfile,
  deleteAccount,
  checkAuth
};

