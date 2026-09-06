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

// Create new measurement profile (Staff or above)
router.post('/', requireRole('admin', 'manager', 'staff'), MeasurementController.create);

// Update measurement profile (Staff or above)
router.patch('/:id', requireRole('admin', 'manager', 'staff'), MeasurementController.update);

// Delete measurement profile (Admin only)
router.delete('/:id', requireRole('admin'), MeasurementController.delete);

export default router;

