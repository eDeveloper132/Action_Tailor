import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.ts';
import { authenticate } from '../middlewares/auth.middleware.ts';
import { requireRole } from '../middlewares/role.middleware.ts';

const router = Router();

// Pakistani clothing categories list (public/accessible)
router.get('/clothing-types', DashboardController.getClothingTypes);

// Admin dashboard operational metrics
router.get('/admin', authenticate, requireRole('admin', 'staff'), DashboardController.getAdminData);

// Customer portal dashboard
router.get('/customer', authenticate, DashboardController.getCustomerData);

export default router;

