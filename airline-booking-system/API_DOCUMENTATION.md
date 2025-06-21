# API Documentation - Enterprise Airline Booking System

## 🌐 Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://your-domain.com/api`

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Token Management
- **Access Token**: Expires in 15 minutes
- **Refresh Token**: Expires in 7 days
- **Auto-refresh**: Frontend automatically refreshes tokens

## 📋 API Endpoints

### 🔑 Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "nationality": "US"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "user": {
      "id": "user_id",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

#### POST /auth/login
Authenticate user and get tokens.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_access_token"
  }
}
```

#### POST /auth/logout
Logout user and invalidate tokens.

**Headers:** `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### POST /auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### POST /auth/reset-password
Reset password using reset token.

**Request Body:**
```json
{
  "token": "reset_token",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

### ✈️ Flight Endpoints

#### POST /flights/search
Search for flights using Amadeus API.

**Request Body:**
```json
{
  "originLocationCode": "NYC",
  "destinationLocationCode": "LAX",
  "departureDate": "2024-12-25",
  "returnDate": "2024-12-30",
  "adults": 1,
  "children": 0,
  "infants": 0,
  "travelClass": "ECONOMY",
  "nonStop": false,
  "currencyCode": "USD",
  "maxPrice": 1000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "flights": [
      {
        "id": "flight_offer_id",
        "source": "GDS",
        "instantTicketingRequired": false,
        "nonHomogeneous": false,
        "oneWay": false,
        "lastTicketingDate": "2024-12-20",
        "numberOfBookableSeats": 9,
        "itineraries": [
          {
            "duration": "PT6H30M",
            "segments": [
              {
                "departure": {
                  "iataCode": "JFK",
                  "terminal": "4",
                  "at": "2024-12-25T08:00:00"
                },
                "arrival": {
                  "iataCode": "LAX",
                  "terminal": "7",
                  "at": "2024-12-25T11:30:00"
                },
                "carrierCode": "AA",
                "number": "123",
                "aircraft": {
                  "code": "321"
                },
                "operating": {
                  "carrierCode": "AA"
                },
                "duration": "PT6H30M",
                "id": "1",
                "numberOfStops": 0
              }
            ]
          }
        ],
        "price": {
          "currency": "USD",
          "total": "299.99",
          "base": "250.00",
          "fees": [
            {
              "amount": "49.99",
              "type": "SUPPLIER"
            }
          ]
        },
        "pricingOptions": {
          "fareType": ["PUBLISHED"],
          "includedCheckedBagsOnly": true
        },
        "validatingAirlineCodes": ["AA"],
        "travelerPricings": [
          {
            "travelerId": "1",
            "fareOption": "STANDARD",
            "travelerType": "ADULT",
            "price": {
              "currency": "USD",
              "total": "299.99",
              "base": "250.00"
            }
          }
        ]
      }
    ],
    "meta": {
      "count": 50,
      "links": {
        "self": "https://api.amadeus.com/v2/shopping/flight-offers"
      }
    }
  }
}
```

#### POST /flights/pricing
Get detailed pricing for specific flight offers.

**Request Body:**
```json
{
  "data": {
    "type": "flight-offers-pricing",
    "flightOffers": [
      {
        "type": "flight-offer",
        "id": "flight_offer_id",
        // ... flight offer data
      }
    ]
  }
}
```

#### GET /flights/locations
Search for airports and cities.

**Query Parameters:**
- `keyword` (required): Search term
- `subType`: AIRPORT, CITY, or ANY

**Example:** `/flights/locations?keyword=New York&subType=CITY`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "location",
      "subType": "CITY",
      "name": "NEW YORK",
      "detailedName": "NEW YORK/NY/US",
      "id": "CNYC",
      "self": {
        "href": "https://api.amadeus.com/v1/reference-data/locations/CNYC",
        "methods": ["GET"]
      },
      "timeZoneOffset": "-05:00",
      "iataCode": "NYC",
      "geoCode": {
        "latitude": 40.71427,
        "longitude": -74.00597
      },
      "address": {
        "cityName": "NEW YORK",
        "cityCode": "NYC",
        "countryName": "UNITED STATES OF AMERICA",
        "countryCode": "US",
        "regionCode": "NAMER"
      }
    }
  ]
}
```

#### GET /flights/airlines
Get airline information.

**Query Parameters:**
- `airlineCodes`: Comma-separated airline codes

**Example:** `/flights/airlines?airlineCodes=AA,DL,UA`

### 🎫 Booking Endpoints

#### POST /bookings
Create a new flight booking.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "flightOffer": {
    // Complete flight offer object from search
  },
  "travelers": [
    {
      "id": "1",
      "dateOfBirth": "1990-01-01",
      "name": {
        "firstName": "JOHN",
        "lastName": "DOE"
      },
      "gender": "MALE",
      "contact": {
        "emailAddress": "john.doe@example.com",
        "phones": [
          {
            "deviceType": "MOBILE",
            "countryCallingCode": "1",
            "number": "2345678901"
          }
        ]
      },
      "documents": [
        {
          "documentType": "PASSPORT",
          "birthPlace": "New York",
          "issuanceLocation": "New York",
          "issuanceDate": "2015-04-14",
          "number": "00000000",
          "expiryDate": "2025-04-14",
          "issuanceCountry": "US",
          "validityCountry": "US",
          "nationality": "US",
          "holder": true
        }
      ]
    }
  ],
  "remarks": {
    "general": [
      {
        "subType": "GENERAL_MISCELLANEOUS",
        "text": "ONLINE BOOKING FROM SKYBOOKER"
      }
    ]
  },
  "ticketingAgreement": {
    "option": "DELAY_TO_CANCEL",
    "delay": "6D"
  },
  "contacts": [
    {
      "addresseeName": {
        "firstName": "JOHN",
        "lastName": "DOE"
      },
      "companyName": "SKYBOOKER",
      "purpose": "STANDARD",
      "phones": [
        {
          "deviceType": "LANDLINE",
          "countryCallingCode": "1",
          "number": "2125551234"
        }
      ],
      "emailAddress": "john.doe@example.com",
      "address": {
        "lines": ["123 Main Street"],
        "postalCode": "10001",
        "cityName": "New York",
        "countryCode": "US"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "id": "booking_id",
      "pnr": "ABC123",
      "bookingReference": "SKY12345",
      "status": "confirmed",
      "totalAmount": 299.99,
      "currency": "USD",
      "passengers": [
        {
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com",
          "phone": "+12345678901",
          "ticketNumber": "1234567890123",
          "eTicketNumber": "AA1234567890123"
        }
      ],
      "flights": [
        {
          "flightNumber": "AA123",
          "airline": "American Airlines",
          "departure": {
            "airport": "JFK",
            "city": "New York",
            "date": "2024-12-25",
            "time": "08:00"
          },
          "arrival": {
            "airport": "LAX",
            "city": "Los Angeles",
            "date": "2024-12-25",
            "time": "11:30"
          }
        }
      ],
      "createdAt": "2024-12-20T10:00:00Z",
      "updatedAt": "2024-12-20T10:00:00Z"
    }
  }
}
```

#### GET /bookings/:bookingId
Get booking details by ID.

**Headers:** `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "booking": {
      // Complete booking object
    }
  }
}
```

#### GET /bookings/search
Advanced booking search (Admin only).

**Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:**
- `pnr`: PNR code
- `email`: Passenger email
- `flightNumber`: Flight number
- `status`: Booking status
- `dateFrom`: Start date
- `dateTo`: End date
- `page`: Page number
- `limit`: Results per page

#### GET /bookings/user/me
Get current user's bookings.

**Headers:** `Authorization: Bearer <access_token>`

**Query Parameters:**
- `status`: Filter by status
- `page`: Page number
- `limit`: Results per page

#### POST /bookings/:bookingId/cancel
Cancel a booking.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "reason": "Change of plans",
  "refundRequested": true
}
```

#### GET /bookings/pnr/:pnr
Public PNR lookup (no authentication required).

**Query Parameters:**
- `lastName`: Passenger last name
- `email`: Passenger email (alternative to lastName)

**Example:** `/bookings/pnr/ABC123?lastName=DOE`

### 👤 User Endpoints

#### GET /auth/profile
Get current user profile.

**Headers:** `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "dateOfBirth": "1990-01-01",
      "nationality": "US",
      "role": "user",
      "emailVerified": true,
      "preferences": {
        "currency": "USD",
        "language": "en",
        "newsletter": true
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-12-20T10:00:00Z"
    }
  }
}
```

#### PUT /auth/profile
Update user profile.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "preferences": {
    "currency": "USD",
    "language": "en",
    "newsletter": false
  }
}
```

## 📊 Admin Endpoints

### GET /admin/dashboard
Get admin dashboard statistics.

**Headers:** `Authorization: Bearer <admin_access_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalBookings": 1250,
      "totalRevenue": 125000.50,
      "totalUsers": 850,
      "bookingsToday": 15,
      "revenueToday": 4500.00,
      "newUsersToday": 5
    },
    "recentBookings": [
      // Recent booking objects
    ],
    "topDestinations": [
      {
        "destination": "Los Angeles",
        "bookings": 45,
        "revenue": 13500.00
      }
    ]
  }
}
```

### GET /admin/bookings
Get all bookings with advanced filtering.

**Headers:** `Authorization: Bearer <admin_access_token>`

**Query Parameters:**
- All booking search parameters
- Additional admin filters

### GET /admin/users
Get all users.

**Headers:** `Authorization: Bearer <admin_access_token>`

**Query Parameters:**
- `role`: Filter by role
- `status`: Filter by status
- `page`: Page number
- `limit`: Results per page

## 🔧 Utility Endpoints

### GET /health
Health check endpoint (no authentication required).

**Response:**
```json
{
  "success": true,
  "message": "Server is healthy",
  "data": {
    "timestamp": "2024-12-20T10:00:00Z",
    "uptime": 3600,
    "version": "1.0.0",
    "environment": "production"
  }
}
```

### GET /flights/health
Flight service health check.

**Response:**
```json
{
  "success": true,
  "message": "Flight service is healthy",
  "data": {
    "amadeusConnection": "connected",
    "lastApiCall": "2024-12-20T09:59:00Z",
    "responseTime": "250ms"
  }
}
```

## 🚨 Error Responses

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Request validation failed
- `AUTHENTICATION_ERROR`: Invalid or missing authentication
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_SERVER_ERROR`: Server error
- `AMADEUS_API_ERROR`: External API error
- `DATABASE_ERROR`: Database operation failed

## 📝 Request/Response Examples

### Complete Flight Search Example

**Request:**
```bash
curl -X POST http://localhost:5000/api/flights/search \
  -H "Content-Type: application/json" \
  -d '{
    "originLocationCode": "NYC",
    "destinationLocationCode": "LAX",
    "departureDate": "2024-12-25",
    "adults": 1,
    "travelClass": "ECONOMY"
  }'
```

### Complete Booking Example

**Request:**
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_access_token" \
  -d '{
    "flightOffer": { /* flight offer object */ },
    "travelers": [
      {
        "id": "1",
        "dateOfBirth": "1990-01-01",
        "name": {
          "firstName": "JOHN",
          "lastName": "DOE"
        },
        "gender": "MALE",
        "contact": {
          "emailAddress": "john.doe@example.com"
        }
      }
    ]
  }'
```

## 🔐 Authentication Flow

1. **Register/Login**: Get access and refresh tokens
2. **API Calls**: Include access token in Authorization header
3. **Token Refresh**: Use refresh token when access token expires
4. **Logout**: Invalidate both tokens

## 📊 Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **Flight Search**: 50 requests per hour per user
- **Booking Creation**: 10 requests per hour per user

## 🔍 Pagination

List endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

This API documentation provides comprehensive information for integrating with the airline booking system.

