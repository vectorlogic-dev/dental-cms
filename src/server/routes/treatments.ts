import express from 'express';
import { body, param } from 'express-validator';
import {
  getTreatments,
  getTreatment,
  createTreatment,
  updateTreatment,
  deleteTreatment,
} from '../controllers/treatmentController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getTreatments);

router.get(
  '/:id',
  [param('id').isString().notEmpty().withMessage('Valid treatment ID is required')],
  validateRequest,
  getTreatment
);

router.post(
  '/',
  [
    body('patient').isString().notEmpty().withMessage('Patient ID is required'),
    body('dentist').isString().notEmpty().withMessage('Dentist ID is required'),
    body('treatmentDate').optional().isISO8601().toDate().withMessage('Valid treatment date is required'),
    body('treatmentType').notEmpty().withMessage('Treatment type is required'),
    body('procedure').notEmpty().withMessage('Procedure is required'),
    body('cost').isFloat({ min: 0 }).withMessage('Cost must be a non-negative number'),
    body('paid').optional().isFloat({ min: 0 }).withMessage('Paid amount must be a non-negative number'),
    body('status').optional().isIn(['pending', 'in-progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  ],
  validateRequest,
  createTreatment
);

router.put(
  '/:id',
  [
    param('id').isString().notEmpty().withMessage('Valid treatment ID is required'),
    body('patient').optional().isString().notEmpty().withMessage('Patient ID must be a non-empty string'),
    body('dentist').optional().isString().notEmpty().withMessage('Dentist ID must be a non-empty string'),
    body('treatmentDate').optional().isISO8601().toDate().withMessage('Valid treatment date is required'),
    body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a non-negative number'),
    body('paid').optional().isFloat({ min: 0 }).withMessage('Paid amount must be a non-negative number'),
    body('status').optional().isIn(['pending', 'in-progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  ],
  validateRequest,
  updateTreatment
);

router.delete(
  '/:id',
  [param('id').isString().notEmpty().withMessage('Valid treatment ID is required')],
  validateRequest,
  deleteTreatment
);

export default router;
