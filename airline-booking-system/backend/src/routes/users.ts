import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get user endpoints
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Available user endpoints
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Users API',
    endpoints: {
      profile: 'GET /api/users/profile',
      updateProfile: 'PUT /api/users/profile',
      changePassword: 'PUT /api/users/change-password',
      deleteAccount: 'DELETE /api/users/account'
    }
  });
});

// Placeholder routes - will be implemented in Phase 4
router.get('/profile', (req: Request, res: Response) => {
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'User profile endpoint not yet implemented'
    }
  });
});

router.put('/profile', (req: Request, res: Response) => {
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Update profile endpoint not yet implemented'
    }
  });
});

export default router;

