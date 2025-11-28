import express from 'express';
import { authenticate } from '../utils/auth.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  registerFCMToken,
} from '../controllers/notification.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getNotifications);
router.get('/unread/count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read/all', markAllAsRead);
router.delete('/:id', deleteNotification);
router.post('/fcm-token', registerFCMToken);

export default router;

