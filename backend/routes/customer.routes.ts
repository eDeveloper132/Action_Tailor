import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller.ts';
import { authenticate } from '../middlewares/auth.middleware.ts';
import { requireRole } from '../middlewares/role.middleware.ts';

const router = Router();

router.use(authenticate);

// Search customers (fast query by name or phone)
router.get('/search', requireRole('admin', 'manager', 'staff'), CustomerController.search);

// List all customers (paginated)
router.get('/', requireRole('admin', 'manager', 'staff'), CustomerController.list);

// Single customer details with measurements and orders (IDOR protected in controller)
router.get('/:id', CustomerController.getById);

// Register new customer (Staff or above)
router.post('/', requireRole('admin', 'manager', 'staff'), CustomerController.create);

// Update customer details (Staff or above)
router.patch('/:id', requireRole('admin', 'manager', 'staff'), CustomerController.update);

// Delete customer (Admin only)
router.delete('/:id', requireRole('admin'), CustomerController.delete);

export default router;

