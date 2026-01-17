import { Router } from 'express';
import authRoutes from './auth';
import patientRoutes from './patients';
import appointmentRoutes from './appointments';
import treatmentRoutes from './treatments';
import userRoutes from './users';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Dental CMS API is running' });
});

router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/treatments', treatmentRoutes);
router.use('/users', userRoutes);

export default router;
