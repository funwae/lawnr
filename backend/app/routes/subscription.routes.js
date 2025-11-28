import express from 'express';
import { authenticate, authorize } from '../utils/auth.js';
import {
  createSubscription,
  getSubscriptions,
  getSubscription,
  updateSubscription,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  skipSubscriptionService,
  rescheduleSubscriptionService,
  processSubscriptions
} from '../controllers/subscription.controller.js';

const router = express.Router();

router.use(authenticate);

// CRUD operations
router.post('/', authorize('homeowner', 'admin'), createSubscription);
router.get('/', getSubscriptions);
router.get('/:id', getSubscription);
router.put('/:id', authorize('homeowner', 'admin'), updateSubscription);

// Subscription management
router.post('/:id/pause', authorize('homeowner', 'admin'), pauseSubscription);
router.post('/:id/resume', authorize('homeowner', 'admin'), resumeSubscription);
router.post('/:id/cancel', authorize('homeowner', 'admin'), cancelSubscription);

// Service management
router.post('/services/:serviceId/skip', authorize('homeowner', 'admin'), skipSubscriptionService);
router.post('/services/:serviceId/reschedule', authorize('homeowner', 'admin'), rescheduleSubscriptionService);

// Admin only
router.post('/process', authorize('admin'), processSubscriptions);

export default router;

