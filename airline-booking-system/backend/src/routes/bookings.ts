import { Router } from 'express';
import bookingController from '../controllers/bookingController';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth';
import { validate } from '../utils/validation';
import { bookingCreateSchema, bookingUpdateSchema, pnrSearchSchema } from '../utils/validation';

const router = Router();

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get booking endpoints
 *     tags: [Bookings]
 *     responses:
 *       200:
 *         description: Available booking endpoints
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Booking API',
    endpoints: {
      create: 'POST /api/bookings',
      getById: 'GET /api/bookings/:bookingId',
      search: 'GET /api/bookings/search',
      update: 'PUT /api/bookings/:bookingId',
      cancel: 'POST /api/bookings/:bookingId/cancel',
      userBookings: 'GET /api/bookings/user/me',
      stats: 'GET /api/bookings/stats',
      pnrLookup: 'GET /api/bookings/pnr/:pnr',
      validate: 'POST /api/bookings/validate',
      timeline: 'GET /api/bookings/:bookingId/timeline',
      sync: 'POST /api/bookings/:bookingId/sync'
    }
  });
});

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new flight booking
 *     tags: [Bookings]
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
 *               - passengers
 *               - contactInfo
 *             properties:
 *               flightOffers:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Flight offers from search results
 *               passengers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - type
 *                     - firstName
 *                     - lastName
 *                     - dateOfBirth
 *                     - gender
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [adult, child, infant]
 *                     title:
 *                       type: string
 *                       example: "Mr"
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     dateOfBirth:
 *                       type: string
 *                       format: date
 *                       example: "1990-01-01"
 *                     gender:
 *                       type: string
 *                       enum: [M, F]
 *                     nationality:
 *                       type: string
 *                       example: "US"
 *                     passportNumber:
 *                       type: string
 *                     passportExpiry:
 *                       type: string
 *                       format: date
 *                     passportCountry:
 *                       type: string
 *                     email:
 *                       type: string
 *                       format: email
 *                     phone:
 *                       type: string
 *                     specialRequests:
 *                       type: array
 *                       items:
 *                         type: string
 *               contactInfo:
 *                 type: object
 *                 required:
 *                   - email
 *                   - phone
 *                   - address
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                   phone:
 *                     type: string
 *                   address:
 *                     type: object
 *                     properties:
 *                       street:
 *                         type: string
 *                       city:
 *                         type: string
 *                       state:
 *                         type: string
 *                       postalCode:
 *                         type: string
 *                       country:
 *                         type: string
 *               paymentInfo:
 *                 type: object
 *                 properties:
 *                   method:
 *                     type: string
 *                     enum: [credit_card, debit_card, paypal, bank_transfer]
 *                   amount:
 *                     type: number
 *                   currency:
 *                     type: string
 *               specialRequests:
 *                 type: array
 *                 items:
 *                   type: string
 *               remarks:
 *                 type: string
 *               travelInsurance:
 *                 type: boolean
 *               marketingConsent:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Invalid booking data
 *       401:
 *         description: Authentication required
 */
router.post('/',
  authenticate,
  validate(bookingCreateSchema),
  bookingController.createBooking
);

/**
 * @swagger
 * /api/bookings/{bookingId}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking details
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Authentication required
 */
router.get('/:bookingId',
  authenticate,
  bookingController.getBookingById
);

/**
 * @swagger
 * /api/bookings/search:
 *   get:
 *     summary: Search bookings by various criteria
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pnr
 *         schema:
 *           type: string
 *         description: PNR code
 *       - in: query
 *         name: bookingReference
 *         schema:
 *           type: string
 *         description: Booking reference
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Contact email
 *       - in: query
 *         name: lastName
 *         schema:
 *           type: string
 *         description: Passenger last name
 *       - in: query
 *         name: flightNumber
 *         schema:
 *           type: string
 *         description: Flight number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [confirmed, cancelled, pending, expired, refunded]
 *         description: Booking status
 *       - in: query
 *         name: departureDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Departure date
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Search start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Search end date
 *     responses:
 *       200:
 *         description: Search results
 *       401:
 *         description: Authentication required
 */
router.get('/search',
  authenticate,
  bookingController.searchBookings
);

/**
 * @swagger
 * /api/bookings/{bookingId}:
 *   put:
 *     summary: Update booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmed, cancelled, pending, expired, refunded]
 *               passengers:
 *                 type: array
 *                 items:
 *                   type: object
 *               contactInfo:
 *                 type: object
 *               specialRequests:
 *                 type: array
 *                 items:
 *                   type: string
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Authentication required
 */
router.put('/:bookingId',
  authenticate,
  validate(bookingUpdateSchema),
  bookingController.updateBooking
);

/**
 * @swagger
 * /api/bookings/{bookingId}/cancel:
 *   post:
 *     summary: Cancel booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Cancellation reason
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Authentication required
 */
router.post('/:bookingId/cancel',
  authenticate,
  bookingController.cancelBooking
);

/**
 * @swagger
 * /api/bookings/user/me:
 *   get:
 *     summary: Get current user's bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: bookedAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: User bookings
 *       401:
 *         description: Authentication required
 */
router.get('/user/me',
  authenticate,
  bookingController.getUserBookings
);

/**
 * @swagger
 * /api/bookings/stats:
 *   get:
 *     summary: Get booking statistics (admin only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Statistics start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Statistics end date
 *     responses:
 *       200:
 *         description: Booking statistics
 *       403:
 *         description: Admin access required
 *       401:
 *         description: Authentication required
 */
router.get('/stats',
  authenticate,
  requireRole('admin'),
  bookingController.getBookingStats
);

/**
 * @swagger
 * /api/bookings/pnr/{pnr}:
 *   get:
 *     summary: Get booking by PNR (public lookup)
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: pnr
 *         required: true
 *         schema:
 *           type: string
 *         description: PNR code
 *       - in: query
 *         name: lastName
 *         schema:
 *           type: string
 *         description: Passenger last name for verification
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Contact email for verification
 *     responses:
 *       200:
 *         description: Booking information (limited)
 *       404:
 *         description: Booking not found
 *       400:
 *         description: Verification information required
 */
router.get('/pnr/:pnr',
  validate(pnrSearchSchema),
  bookingController.getBookingByPNR
);

/**
 * @swagger
 * /api/bookings/validate:
 *   post:
 *     summary: Validate booking data before creation
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Booking data to validate
 *     responses:
 *       200:
 *         description: Validation result
 *       400:
 *         description: Invalid booking data
 *       401:
 *         description: Authentication required
 */
router.post('/validate',
  authenticate,
  bookingController.validateBookingData
);

/**
 * @swagger
 * /api/bookings/{bookingId}/timeline:
 *   get:
 *     summary: Get booking timeline/history
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking timeline
 *       404:
 *         description: Booking not found
 *       401:
 *         description: Authentication required
 */
router.get('/:bookingId/timeline',
  authenticate,
  bookingController.getBookingTimeline
);

/**
 * @swagger
 * /api/bookings/{bookingId}/sync:
 *   post:
 *     summary: Sync booking with Amadeus (admin only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking synced successfully
 *       404:
 *         description: Booking not found
 *       403:
 *         description: Admin access required
 *       401:
 *         description: Authentication required
 */
router.post('/:bookingId/sync',
  authenticate,
  requireRole('admin'),
  bookingController.syncBookingWithAmadeus
);

router.put('/:pnr', (req: Request, res: Response) => {
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Update booking endpoint not yet implemented'
    }
  });
});

router.delete('/:pnr', (req: Request, res: Response) => {
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Cancel booking endpoint not yet implemented'
    }
  });
});

router.get('/user/:userId', (req: Request, res: Response) => {
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Get user bookings endpoint not yet implemented'
    }
  });
});

export default router;

