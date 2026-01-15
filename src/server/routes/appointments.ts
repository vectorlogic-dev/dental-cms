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

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getAppointments);

router.get(
  '/:id',
  [param('id').isMongoId()],
  getAppointment
);

router.post(
  '/',
  [
    body('patient').isMongoId(),
    body('dentist').isMongoId(),
    body('appointmentDate').isISO8601().toDate(),
    body('duration').optional().isInt({ min: 1 }),
    body('type').isIn(['checkup', 'cleaning', 'treatment', 'consultation', 'emergency', 'follow-up']),
    body('status').optional().isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']),
  ],
  createAppointment
);

router.put(
  '/:id',
  [
    param('id').isMongoId(),
    body('appointmentDate').optional().isISO8601().toDate(),
    body('type').optional().isIn(['checkup', 'cleaning', 'treatment', 'consultation', 'emergency', 'follow-up']),
    body('status').optional().isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show']),
  ],
  updateAppointment
);

router.delete(
  '/:id',
  [param('id').isMongoId()],
  deleteAppointment
);

export default router;
