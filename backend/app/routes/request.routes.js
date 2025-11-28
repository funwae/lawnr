import express from 'express';
import { authenticate, authorize } from '../utils/auth.js';
import {
  createRequest,
  getRequests,
  getRequest,
  getAvailableRequests,
  submitQuote,
  acceptQuote
} from '../controllers/request.controller.js';

const router = express.Router();

// Homeowner routes
router.post('/', authenticate, authorize('homeowner', 'admin'), createRequest);
router.get('/', authenticate, authorize('homeowner', 'admin'), getRequests);
router.get('/:id', authenticate, getRequest);
router.post('/:id/accept-quote/:quoteId', authenticate, authorize('homeowner', 'admin'), acceptQuote);

// Contractor routes
router.get('/available/list', authenticate, authorize('contractor', 'admin'), getAvailableRequests);
router.post('/:id/quote', authenticate, authorize('contractor', 'admin'), submitQuote);

export default router;

