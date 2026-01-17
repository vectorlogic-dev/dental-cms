import express from 'express';
import { body, param } from 'express-validator';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

router.get('/', getUsers);

router.get(
  '/:id',
  [param('id').isMongoId()],
  validateRequest,
  getUser
);

router.put(
  '/:id',
  [
    param('id').isMongoId(),
    body('email').optional().isEmail().normalizeEmail(),
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('role').optional().isIn(['admin', 'dentist', 'assistant', 'receptionist']),
    body('isActive').optional().isBoolean(),
  ],
  validateRequest,
  updateUser
);

router.delete(
  '/:id',
  [param('id').isMongoId()],
  validateRequest,
  deleteUser
);

export default router;
