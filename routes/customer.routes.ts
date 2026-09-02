import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller.ts';
import { authenticate } from '../middlewares/auth.middleware.ts';
import { requireRole } from '../middlewares/role.middleware.ts';

const router = Router();

router.use(authenticate);

// Search customers (fast query by name or phone)
router.get('/search', requireRole('admin', 'staff'), CustomerController.search);

// List all customers (paginated)
router.get('/', requireRole('admin', 'staff'), CustomerController.list);

// Single customer details with measurements and orders
router.get('/:id', CustomerController.getById);

// Register new customer
router.post('/', requireRole('admin', 'staff'), CustomerController.create);

// Update customer details
router.patch('/:id', requireRole('admin', 'staff'), CustomerController.update);

// Delete customer
router.delete('/:id', requireRole('admin'), CustomerController.delete);

export default router;
