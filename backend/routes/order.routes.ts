import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.ts';
import { authenticate, requireRole, validateOrderCreation } from '../middlewares/index.ts';

const router = Router();

router.use(authenticate);

// List and filter orders
router.get('/', OrderController.list);

// Get single order with populated customer and measurement snapshot
router.get('/:id', OrderController.getById);

// Create / book a new order (Staff or above)
router.post('/', requireRole('admin', 'manager', 'staff'), validateOrderCreation, OrderController.create);

// Update order status (cutting, stitching, ready, delivered) (Staff or above)
router.patch('/:id/status', requireRole('admin', 'manager', 'staff'), OrderController.updateStatus);

export default router;

