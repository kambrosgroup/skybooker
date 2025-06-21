import crypto from 'crypto';
import { logger } from './logger';

/**
 * PNR Generator Utility
 * Generates unique PNR codes and booking references for airline bookings
 */

// Characters used for PNR generation (excluding confusing characters like 0, O, I, 1)
const PNR_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const BOOKING_REF_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Generate a unique PNR (Passenger Name Record) code
 * Format: 6 characters (letters and numbers, no confusing characters)
 * Example: ABC123, XYZ789
 */
export function generatePNR(): string {
  let pnr = '';
  
  // Generate 6 random characters
  for (let i = 0; i < 6; i++) {
    const randomIndex = crypto.randomInt(0, PNR_CHARACTERS.length);
    pnr += PNR_CHARACTERS[randomIndex];
  }
  
  // Add timestamp-based suffix to ensure uniqueness
  const timestamp = Date.now().toString(36).slice(-2).toUpperCase();
  
  // Replace last 2 characters with timestamp-based characters for better uniqueness
  pnr = pnr.slice(0, 4) + timestamp;
  
  logger.debug('Generated PNR', { pnr });
  return pnr;
}

/**
 * Generate a unique booking reference
 * Format: 8 characters (letters and numbers)
 * Example: AB12CD34, XY98ZW76
 */
export function generateBookingReference(): string {
  let reference = '';
  
  // Generate 8 random characters
  for (let i = 0; i < 8; i++) {
    const randomIndex = crypto.randomInt(0, BOOKING_REF_CHARACTERS.length);
    reference += BOOKING_REF_CHARACTERS[randomIndex];
  }
  
  logger.debug('Generated booking reference', { reference });
  return reference;
}

/**
 * Generate a ticket number
 * Format: 13 digits (airline code + serial number)
 * Example: 0011234567890
 */
export function generateTicketNumber(airlineCode: string = '001'): string {
  // Ensure airline code is 3 digits
  const formattedAirlineCode = airlineCode.padStart(3, '0');
  
  // Generate 10-digit serial number
  const serialNumber = crypto.randomInt(1000000000, 9999999999).toString();
  
  const ticketNumber = formattedAirlineCode + serialNumber;
  
  logger.debug('Generated ticket number', { ticketNumber, airlineCode });
  return ticketNumber;
}

/**
 * Generate an e-ticket number
 * Format: 14 characters (airline prefix + unique identifier)
 * Example: AA1234567890AB
 */
export function generateETicketNumber(airlineCode: string = 'AA'): string {
  // Ensure airline code is 2 characters
  const formattedAirlineCode = airlineCode.padEnd(2, 'A').slice(0, 2);
  
  // Generate 10-digit number
  const number = crypto.randomInt(1000000000, 9999999999).toString();
  
  // Generate 2 random letters
  const letters = Array.from({ length: 2 }, () => {
    const randomIndex = crypto.randomInt(0, 26);
    return String.fromCharCode(65 + randomIndex); // A-Z
  }).join('');
  
  const eTicketNumber = formattedAirlineCode + number + letters;
  
  logger.debug('Generated e-ticket number', { eTicketNumber, airlineCode });
  return eTicketNumber;
}

/**
 * Generate a confirmation code
 * Format: 6 characters (letters only, easy to read)
 * Example: ABCDEF, XYZWVU
 */
export function generateConfirmationCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = crypto.randomInt(0, letters.length);
    code += letters[randomIndex];
  }
  
  logger.debug('Generated confirmation code', { code });
  return code;
}

/**
 * Generate a seat assignment
 * Format: Row number + Seat letter
 * Example: 12A, 34F, 7C
 */
export function generateSeatAssignment(
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first' = 'economy',
  aircraftType: string = 'A320'
): string {
  let rowRange: { min: number; max: number };
  let seatLetters: string[];
  
  // Define seat configuration based on cabin class and aircraft type
  switch (cabinClass) {
    case 'first':
      rowRange = { min: 1, max: 3 };
      seatLetters = ['A', 'F']; // Typical first class configuration
      break;
    case 'business':
      rowRange = { min: 4, max: 8 };
      seatLetters = ['A', 'C', 'D', 'F']; // Typical business class configuration
      break;
    case 'premium_economy':
      rowRange = { min: 9, max: 15 };
      seatLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
      break;
    case 'economy':
    default:
      rowRange = { min: 16, max: 45 };
      seatLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
      break;
  }
  
  // Adjust for specific aircraft types
  if (aircraftType.includes('777') || aircraftType.includes('A350')) {
    // Wide-body aircraft
    seatLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'];
    if (cabinClass === 'economy') {
      rowRange.max = 60;
    }
  }
  
  const row = crypto.randomInt(rowRange.min, rowRange.max + 1);
  const seatLetter = seatLetters[crypto.randomInt(0, seatLetters.length)];
  
  const seatAssignment = `${row}${seatLetter}`;
  
  logger.debug('Generated seat assignment', { 
    seatAssignment, 
    cabinClass, 
    aircraftType 
  });
  
  return seatAssignment;
}

/**
 * Generate a frequent flyer number
 * Format: Airline code + 8-10 digits
 * Example: AA12345678, DL1234567890
 */
export function generateFrequentFlyerNumber(airlineCode: string): string {
  const formattedAirlineCode = airlineCode.toUpperCase().slice(0, 2);
  const numberLength = crypto.randomInt(8, 11); // 8-10 digits
  
  let number = '';
  for (let i = 0; i < numberLength; i++) {
    number += crypto.randomInt(0, 10).toString();
  }
  
  const ffNumber = formattedAirlineCode + number;
  
  logger.debug('Generated frequent flyer number', { 
    ffNumber, 
    airlineCode 
  });
  
  return ffNumber;
}

/**
 * Validate PNR format
 */
export function validatePNR(pnr: string): boolean {
  // PNR should be 6 characters, alphanumeric, uppercase
  const pnrRegex = /^[A-Z0-9]{6}$/;
  return pnrRegex.test(pnr);
}

/**
 * Validate booking reference format
 */
export function validateBookingReference(reference: string): boolean {
  // Booking reference should be 8 characters, alphanumeric, uppercase
  const refRegex = /^[A-Z0-9]{8}$/;
  return refRegex.test(reference);
}

/**
 * Validate ticket number format
 */
export function validateTicketNumber(ticketNumber: string): boolean {
  // Ticket number should be 13 digits
  const ticketRegex = /^\d{13}$/;
  return ticketRegex.test(ticketNumber);
}

/**
 * Generate a unique identifier for internal use
 * Format: UUID v4
 */
export function generateUniqueId(): string {
  return crypto.randomUUID();
}

/**
 * Generate a short unique identifier
 * Format: 8 character alphanumeric string
 */
export function generateShortId(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Generate a secure random string
 * Used for tokens, API keys, etc.
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a numeric code (for SMS verification, etc.)
 */
export function generateNumericCode(length: number = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += crypto.randomInt(0, 10).toString();
  }
  return code;
}

/**
 * Generate a check-in sequence number
 * Format: 3-digit number
 */
export function generateCheckInSequence(): string {
  return crypto.randomInt(1, 1000).toString().padStart(3, '0');
}

/**
 * Generate a baggage tag number
 * Format: Airline code + 10 digits
 */
export function generateBaggageTag(airlineCode: string): string {
  const formattedAirlineCode = airlineCode.toUpperCase().slice(0, 2);
  const number = crypto.randomInt(1000000000, 9999999999).toString();
  
  return formattedAirlineCode + number;
}

/**
 * Generate multiple PNRs at once (for bulk operations)
 */
export function generateMultiplePNRs(count: number): string[] {
  const pnrs: string[] = [];
  const generated = new Set<string>();
  
  while (pnrs.length < count) {
    const pnr = generatePNR();
    if (!generated.has(pnr)) {
      generated.add(pnr);
      pnrs.push(pnr);
    }
  }
  
  logger.debug('Generated multiple PNRs', { count, pnrs });
  return pnrs;
}

/**
 * Check if a PNR is likely to be valid (format check only)
 */
export function isPNRValid(pnr: string): boolean {
  if (!pnr || typeof pnr !== 'string') {
    return false;
  }
  
  // Check format
  if (!validatePNR(pnr)) {
    return false;
  }
  
  // Additional checks can be added here
  // e.g., checksum validation, blacklist check, etc.
  
  return true;
}

/**
 * Format PNR for display (add spaces or hyphens)
 */
export function formatPNRForDisplay(pnr: string, format: 'spaced' | 'hyphenated' = 'spaced'): string {
  if (!isPNRValid(pnr)) {
    return pnr;
  }
  
  switch (format) {
    case 'spaced':
      return pnr.slice(0, 3) + ' ' + pnr.slice(3);
    case 'hyphenated':
      return pnr.slice(0, 3) + '-' + pnr.slice(3);
    default:
      return pnr;
  }
}

export default {
  generatePNR,
  generateBookingReference,
  generateTicketNumber,
  generateETicketNumber,
  generateConfirmationCode,
  generateSeatAssignment,
  generateFrequentFlyerNumber,
  validatePNR,
  validateBookingReference,
  validateTicketNumber,
  generateUniqueId,
  generateShortId,
  generateSecureToken,
  generateNumericCode,
  generateCheckInSequence,
  generateBaggageTag,
  generateMultiplePNRs,
  isPNRValid,
  formatPNRForDisplay
};

