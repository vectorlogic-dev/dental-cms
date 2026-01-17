import express from 'express';
import { body, param } from 'express-validator';
import {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from '../controllers/appointmentController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getAppointments);

router.get(
  '/:id',
  [param('id').isString().notEmpty().withMessage('Valid appointment ID is required')],
  validateRequest,
  getAppointment
);

router.post(
  '/',
  [
    body('patient').isString().notEmpty().withMessage('Patient ID is required'),
    body('dentist').isString().notEmpty().withMessage('Dentist ID is required'),
    body('appointmentDate').isISO8601().toDate().withMessage('Valid appointment date is required'),
    body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
    body('type').isIn(['checkup', 'cleaning', 'treatment', 'consultation', 'emergency', 'follow-up']).withMessage('Invalid appointment type'),
    body('status').optional().isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']).withMessage('Invalid status'),
  ],
  validateRequest,
  createAppointment
);

router.put(
  '/:id',
  [
    param('id').isString().notEmpty().withMessage('Valid appointment ID is required'),
    body('patient').optional().isString().notEmpty().withMessage('Patient ID must be a non-empty string'),
    body('dentist').optional().isString().notEmpty().withMessage('Dentist ID must be a non-empty string'),
    body('appointmentDate').optional().isISO8601().toDate().withMessage('Valid appointment date is required'),
    body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
    body('type').optional().isIn(['checkup', 'cleaning', 'treatment', 'consultation', 'emergency', 'follow-up']).withMessage('Invalid appointment type'),
    body('status').optional().isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']).withMessage('Invalid status'),
  ],
  validateRequest,
  updateAppointment
);

router.delete(
  '/:id',
  [param('id').isString().notEmpty().withMessage('Valid appointment ID is required')],
  validateRequest,
  deleteAppointment
);

export default router;
