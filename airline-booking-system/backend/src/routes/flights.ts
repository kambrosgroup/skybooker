import { Router } from 'express';
import flightController from '../controllers/flightController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { validate } from '../utils/validation';
import { flightSearchSchema } from '../utils/validation';

const router = Router();

/**
 * @swagger
 * /api/flights:
 *   get:
 *     summary: Get flight endpoints
 *     tags: [Flights]
 *     responses:
 *       200:
 *         description: Available flight endpoints
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Flight API',
    endpoints: {
      search: 'POST /api/flights/search',
      pricing: 'POST /api/flights/pricing',
      details: 'GET /api/flights/:flightId',
      locations: 'GET /api/flights/locations',
      airlines: 'GET /api/flights/airlines',
      popular: 'GET /api/flights/popular',
      stats: 'GET /api/flights/stats',
      inspiration: 'GET /api/flights/inspiration',
      health: 'GET /api/flights/health'
    }
  });
});

/**
 * @swagger
 * /api/flights/search:
 *   post:
 *     summary: Search for flights
 *     tags: [Flights]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origin
 *               - destination
 *               - departureDate
 *             properties:
 *               origin:
 *                 type: string
 *                 description: Origin airport IATA code
 *                 example: "JFK"
 *               destination:
 *                 type: string
 *                 description: Destination airport IATA code
 *                 example: "LAX"
 *               departureDate:
 *                 type: string
 *                 format: date
 *                 description: Departure date
 *                 example: "2024-12-25"
 *               returnDate:
 *                 type: string
 *                 format: date
 *                 description: Return date (for round-trip)
 *                 example: "2024-12-30"
 *               passengers:
 *                 type: object
 *                 properties:
 *                   adults:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 9
 *                     default: 1
 *                   children:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 8
 *                     default: 0
 *                   infants:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 8
 *                     default: 0
 *               cabin:
 *                 type: string
 *                 enum: [ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST]
 *                 default: ECONOMY
 *               currency:
 *                 type: string
 *                 description: Currency code
 *                 default: USD
 *               maxPrice:
 *                 type: number
 *                 description: Maximum price filter
 *               directFlightsOnly:
 *                 type: boolean
 *                 default: false
 *               maxStops:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 3
 *               preferredAirlines:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Preferred airline codes
 *               excludedAirlines:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Excluded airline codes
 *     responses:
 *       200:
 *         description: Flight search results
 *       400:
 *         description: Invalid search parameters
 *       500:
 *         description: Search service unavailable
 */
router.post('/search',
  optionalAuthenticate,
  validate(flightSearchSchema),
  flightController.searchFlights
);

/**
 * @swagger
 * /api/flights/pricing:
 *   post:
 *     summary: Get flight pricing for specific offers
 *     tags: [Flights]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - flightOffers
 *             properties:
 *               flightOffers:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Flight offers from search results
 *     responses:
 *       200:
 *         description: Flight pricing information
 *       400:
 *         description: Invalid flight offers
 *       401:
 *         description: Authentication required
 */
router.post('/pricing',
  authenticate,
  flightController.getFlightPricing
);

/**
 * @swagger
 * /api/flights/{flightId}:
 *   get:
 *     summary: Get flight details by ID
 *     tags: [Flights]
 *     parameters:
 *       - in: path
 *         name: flightId
 *         required: true
 *         schema:
 *           type: string
 *         description: Flight ID or Amadeus offer ID
 *     responses:
 *       200:
 *         description: Flight details
 *       404:
 *         description: Flight not found
 */
router.get('/:flightId',
  optionalAuthenticate,
  flightController.getFlightDetails
);

/**
 * @swagger
 * /api/flights/locations:
 *   get:
 *     summary: Search airports and cities
 *     tags: [Flights]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (city name, airport name, or IATA code)
 *         example: "New York"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [AIRPORT, CITY]
 *         description: Location type filter
 *     responses:
 *       200:
 *         description: Location search results
 *       400:
 *         description: Missing search query
 */
router.get('/locations',
  flightController.searchLocations
);

/**
 * @swagger
 * /api/flights/airlines:
 *   get:
 *     summary: Get airline information
 *     tags: [Flights]
 *     parameters:
 *       - in: query
 *         name: airlineCodes
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated airline IATA codes
 *         example: "AA,DL,UA"
 *     responses:
 *       200:
 *         description: Airline information
 *       400:
 *         description: Missing airline codes
 */
router.get('/airlines',
  flightController.getAirlineInfo
);

/**
 * @swagger
 * /api/flights/popular:
 *   get:
 *     summary: Get popular destinations
 *     tags: [Flights]
 *     parameters:
 *       - in: query
 *         name: origin
 *         schema:
 *           type: string
 *         description: Origin airport IATA code
 *         example: "JFK"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Popular destinations
 */
router.get('/popular',
  flightController.getPopularDestinations
);

/**
 * @swagger
 * /api/flights/stats:
 *   get:
 *     summary: Get flight statistics
 *     tags: [Flights]
 *     parameters:
 *       - in: query
 *         name: origin
 *         schema:
 *           type: string
 *         description: Origin airport IATA code
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *         description: Destination airport IATA code
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *         description: Statistics period
 *     responses:
 *       200:
 *         description: Flight statistics and trends
 */
router.get('/stats',
  optionalAuthenticate,
  flightController.getFlightStats
);

/**
 * @swagger
 * /api/flights/inspiration:
 *   get:
 *     summary: Get flight inspiration (cheapest destinations)
 *     tags: [Flights]
 *     parameters:
 *       - in: query
 *         name: origin
 *         required: true
 *         schema:
 *           type: string
 *         description: Origin airport IATA code
 *         example: "JFK"
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: departureDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Departure date
 *       - in: query
 *         name: oneWay
 *         schema:
 *           type: boolean
 *           default: true
 *         description: One-way or round-trip
 *     responses:
 *       200:
 *         description: Flight inspiration results
 *       400:
 *         description: Missing origin
 */
router.get('/inspiration',
  flightController.getFlightInspiration
);

/**
 * @swagger
 * /api/flights/health:
 *   get:
 *     summary: Health check for flight services
 *     tags: [Flights]
 *     responses:
 *       200:
 *         description: Service health status
 */
router.get('/health',
  flightController.healthCheck
);

export default router;

