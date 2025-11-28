import express from 'express';
import { authenticate, authorize } from '../utils/auth.js';
import { createReview, getContractorReviews } from '../controllers/review.controller.js';

const router = express.Router();

router.post('/jobs/:jobId', authenticate, authorize('homeowner', 'admin'), createReview);
router.get('/contractors/:contractorId', getContractorReviews);

export default router;

