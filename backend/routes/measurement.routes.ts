import { Router } from 'express';
import { MeasurementController } from '../controllers/measurement.controller.ts';
import { authenticate } from '../middlewares/auth.middleware.ts';
import { requireRole } from '../middlewares/role.middleware.ts';

const router = Router();

router.use(authenticate);

// Get all measurement profiles for a customer
router.get('/customer/:customerId', MeasurementController.getByCustomer);

// Get single measurement profile
router.get('/:id', MeasurementController.getById);

// Create new measurement profile (Admin/Staff only)
router.post('/', requireRole('admin', 'staff'), MeasurementController.create);

// Update measurement profile (Admin/Staff only)
router.patch('/:id', requireRole('admin', 'staff'), MeasurementController.update);

// Delete measurement profile (Admin only)
router.delete('/:id', requireRole('admin'), MeasurementController.delete);

export default router;

