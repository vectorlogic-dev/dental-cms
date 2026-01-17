import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
} from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

router.post(
  '/register',
  authenticate,
  authorize('admin'),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('role').optional().isIn(['admin', 'dentist', 'assistant', 'receptionist']),
  ],
  validateRequest,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validateRequest,
  login
);

router.get('/me', authenticate, getMe);

export default router;
