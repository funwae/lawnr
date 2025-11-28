import express from 'express';
import { authenticate, authorize } from '../utils/auth.js';
import {
  purchasePremiumListing,
  confirmPayment,
  getMyPremiumListings,
  getActiveListings,
  getPricing
} from '../controllers/premium.controller.js';

const router = express.Router();

router.use(authenticate);

// Public pricing
router.get('/pricing', getPricing);

// Contractor routes
router.post('/purchase', authorize('contractor', 'admin'), purchasePremiumListing);
router.post('/confirm', authorize('contractor', 'admin'), confirmPayment);
router.get('/my-listings', authorize('contractor', 'admin'), getMyPremiumListings);
router.get('/active', authorize('contractor', 'admin'), getActiveListings);

export default router;

