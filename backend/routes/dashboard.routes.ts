import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.ts';
import { authenticate } from '../middlewares/auth.middleware.ts';
import { requireRole } from '../middlewares/role.middleware.ts';

const router = Router();

// Pakistani clothing categories list (public/accessible)
router.get('/clothing-types', DashboardController.getClothingTypes);

// Admin dashboard operational metrics (Admin, Manager, Staff only)
router.get('/admin', authenticate, requireRole('admin', 'manager', 'staff'), DashboardController.getAdminData);

// Customer portal dashboard (Customer only)
router.get('/customer', authenticate, requireRole('customer'), DashboardController.getCustomerData);

export default router;

