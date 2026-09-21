import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.ts';
import { authenticate, requireRole, validatePaymentRecord } from '../middlewares/index.ts';

const router = Router();

router.use(authenticate);

// Record payment (Staff or above)
router.post('/', requireRole('admin', 'manager', 'staff'), validatePaymentRecord, PaymentController.record);

// Get payment history for an order
router.get('/order/:orderId', PaymentController.getByOrder);

export default router;

