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

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getTreatments);

router.get(
  '/:id',
  [param('id').isMongoId()],
  getTreatment
);

router.post(
  '/',
  [
    body('patient').isMongoId(),
    body('dentist').isMongoId(),
    body('treatmentDate').optional().isISO8601().toDate(),
    body('treatmentType').notEmpty(),
    body('procedure').notEmpty(),
    body('cost').isFloat({ min: 0 }),
    body('paid').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['pending', 'in-progress', 'completed', 'cancelled']),
  ],
  createTreatment
);

router.put(
  '/:id',
  [
    param('id').isMongoId(),
    body('cost').optional().isFloat({ min: 0 }),
    body('paid').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['pending', 'in-progress', 'completed', 'cancelled']),
  ],
  updateTreatment
);

router.delete(
  '/:id',
  [param('id').isMongoId()],
  deleteTreatment
);

export default router;
