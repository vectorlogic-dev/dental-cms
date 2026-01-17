import express from 'express';
import { authenticate } from '../middleware/auth';
import { queryDatabase } from '../controllers/adminController';

const router = express.Router();

// All admin routes require authentication
router.use(authenticate);

// Execute database query
router.post('/query', queryDatabase);

export default router;
