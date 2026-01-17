import express from 'express';
import { body, param } from 'express-validator';
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
} from '../controllers/patientController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getPatients);

router.get(
  '/:id',
  [param('id').isMongoId()],
  validateRequest,
  getPatient
);

router.post(
  '/',
  [
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('dateOfBirth').isISO8601().toDate(),
    body('gender').isIn(['male', 'female', 'other']),
    body('phone').notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  validateRequest,
  createPatient
);

router.put(
  '/:id',
  [
    param('id').isMongoId(),
    body('email').optional().isEmail().normalizeEmail(),
    body('gender').optional().isIn(['male', 'female', 'other']),
  ],
  validateRequest,
  updatePatient
);

router.delete(
  '/:id',
  [param('id').isMongoId()],
  validateRequest,
  deletePatient
);

export default router;
