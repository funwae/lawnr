import express from 'express';
import { authenticate, authorize } from '../utils/auth.js';
import {
  uploadPropertyMedia,
  uploadJobMedia,
  uploadContractorPortfolio,
  uploadRequestMedia,
  deleteMedia,
  upload,
} from '../controllers/media.controller.js';

const router = express.Router();

// Property media routes (homeowners)
router.post(
  '/properties/:property_id',
  authenticate,
  authorize('homeowner', 'admin'),
  upload.single('file'),
  uploadPropertyMedia
);

router.delete(
  '/properties/:media_id',
  authenticate,
  authorize('homeowner', 'admin'),
  deleteMedia
);

// Job media routes (contractors)
router.post(
  '/jobs/:job_id',
  authenticate,
  authorize('contractor', 'admin'),
  upload.single('file'),
  uploadJobMedia
);

// Contractor portfolio routes
router.post(
  '/contractors/portfolio',
  authenticate,
  authorize('contractor', 'admin'),
  upload.single('file'),
  uploadContractorPortfolio
);

export default router;

