import { Router } from 'express';
import { MeasurementController } from '../controllers/measurement.controller.ts';
import { authenticate } from '../middlewares/auth.middleware.ts';

const router = Router();

router.use(authenticate);

// Get all measurement profiles for a customer
router.get('/customer/:customerId', MeasurementController.getByCustomer);

// Get single measurement profile
router.get('/:id', MeasurementController.getById);

// Create new measurement profile
router.post('/', MeasurementController.create);

// Update measurement profile
router.patch('/:id', MeasurementController.update);

// Delete measurement profile
router.delete('/:id', MeasurementController.delete);

export default router;
