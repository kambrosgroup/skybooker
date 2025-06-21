import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/config';
import { IUser } from '../models/User';
import { createError } from '../middleware/errorHandler';

// Token payload interface
export interface ITokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Refresh token payload interface
export interface IRefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}

// Token pair interface
export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

// JWT utility class
export class JWTUtils {
  /**
   * Generate access token
   */
  static generateAccessToken(user: IUser): string {
    const payload: ITokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpire,
      issuer: 'airline-booking-system',
      audience: 'airline-booking-users'
    });
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(userId: string): string {
    const tokenId = crypto.randomBytes(16).toString('hex');
    
    const payload: IRefreshTokenPayload = {
      userId,
      tokenId
    };

    return jwt.sign(payload, config.jwtRefreshSecret, {
      expiresIn: config.jwtRefreshExpire,
      issuer: 'airline-booking-system',
      audience: 'airline-booking-refresh'
    });
  }

  /**
   * Generate token pair (access + refresh)
   */
  static generateTokenPair(user: IUser): ITokenPair {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user._id.toString());

    // Calculate expiration times
    const accessTokenDecoded = jwt.decode(accessToken) as any;
    const refreshTokenDecoded = jwt.decode(refreshToken) as any;

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenDecoded.exp - accessTokenDecoded.iat,
      refreshExpiresIn: refreshTokenDecoded.exp - refreshTokenDecoded.iat
    };
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): ITokenPayload {
    try {
      const decoded = jwt.verify(token, config.jwtSecret, {
        issuer: 'airline-booking-system',
        audience: 'airline-booking-users'
      }) as ITokenPayload;

      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw createError.unauthorized('Access token has expired', 'TOKEN_EXPIRED');
      } else if (error.name === 'JsonWebTokenError') {
        throw createError.unauthorized('Invalid access token', 'INVALID_TOKEN');
      } else {
        throw createError.unauthorized('Token verification failed', 'TOKEN_VERIFICATION_FAILED');
      }
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): IRefreshTokenPayload {
    try {
      const decoded = jwt.verify(token, config.jwtRefreshSecret, {
        issuer: 'airline-booking-system',
        audience: 'airline-booking-refresh'
      }) as IRefreshTokenPayload;

      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw createError.unauthorized('Refresh token has expired', 'REFRESH_TOKEN_EXPIRED');
      } else if (error.name === 'JsonWebTokenError') {
        throw createError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
      } else {
        throw createError.unauthorized('Refresh token verification failed', 'REFRESH_TOKEN_VERIFICATION_FAILED');
      }
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Check if token is expired (without verification)
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return null;
      }

      return new Date(decoded.exp * 1000);
    } catch {
      return null;
    }
  }

  /**
   * Get remaining token time in seconds
   */
  static getRemainingTokenTime(token: string): number {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return 0;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const remainingTime = decoded.exp - currentTime;
      return Math.max(0, remainingTime);
    } catch {
      return 0;
    }
  }

  /**
   * Generate email verification token
   */
  static generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate password reset token
   */
  static generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash token for storage (for email verification, password reset, etc.)
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate secure random string
   */
  static generateSecureRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Create API key
   */
  static generateApiKey(): string {
    const prefix = 'ak_';
    const randomPart = crypto.randomBytes(24).toString('hex');
    return prefix + randomPart;
  }

  /**
   * Validate token format (basic check)
   */
  static isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    return parts.length === 3;
  }

  /**
   * Get token payload without verification (for debugging)
   */
  static decodeTokenPayload(token: string): any {
    try {
      return jwt.decode(token);
    } catch {
      return null;
    }
  }
}

// Token blacklist utility (for logout functionality)
export class TokenBlacklist {
  private static blacklistedTokens = new Set<string>();

  /**
   * Add token to blacklist
   */
  static addToken(token: string): void {
    this.blacklistedTokens.add(token);
  }

  /**
   * Check if token is blacklisted
   */
  static isBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  /**
   * Remove expired tokens from blacklist
   */
  static cleanupExpiredTokens(): void {
    const tokensToRemove: string[] = [];
    
    this.blacklistedTokens.forEach(token => {
      if (JWTUtils.isTokenExpired(token)) {
        tokensToRemove.push(token);
      }
    });

    tokensToRemove.forEach(token => {
      this.blacklistedTokens.delete(token);
    });
  }

  /**
   * Clear all blacklisted tokens
   */
  static clear(): void {
    this.blacklistedTokens.clear();
  }

  /**
   * Get blacklist size
   */
  static size(): number {
    return this.blacklistedTokens.size;
  }
}

// Periodic cleanup of expired tokens (run every hour)
setInterval(() => {
  TokenBlacklist.cleanupExpiredTokens();
}, 60 * 60 * 1000);

export default JWTUtils;

