import { Router, type Response } from 'express';
import { authenticate, type AuthRequest } from '../middlewares/auth.middleware.ts';
import { Notification } from '../models/index.ts';
import type { ApiResponse } from '../types/index.ts';

const router = Router();

router.use(authenticate);

/**
 * GET /api/notifications
 * Returns list of notifications belonging exclusively to the authenticated user (IDOR protected)
 */
router.get('/', async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    const notifications = await Notification.find({ recipient: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.json({
      status: 'success',
      data: notifications,
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Marks a notification as read (strictly verified to belong to the authenticated user)
 */
router.patch('/:id/read', async (req: AuthRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // IDOR Protection: Update only if recipient matches authenticated user
    const updated = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user.userId },
      { isRead: true },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({
        status: 'error',
        message: 'Notification not found or access denied / نوٹیفکیشن نہیں ملا',
      });
      return;
    }

    res.json({
      status: 'success',
      message: 'Notification marked as read',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

export default router;
