import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.ts';
import { authenticate } from '../middlewares/auth.middleware.ts';
import { requireRole } from '../middlewares/role.middleware.ts';

const router = Router();

router.use(authenticate);

// Record payment
router.post('/', requireRole('admin', 'staff'), PaymentController.record);

// Get payment history for an order
router.get('/order/:orderId', PaymentController.getByOrder);

export default router;
