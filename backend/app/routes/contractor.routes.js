import express from 'express';
import { authenticate, authorize } from '../utils/auth.js';
import {
  createContractorProfile,
  updateContractorProfile,
  getContractorProfile,
  searchContractors,
  uploadLogo,
  uploadPortfolioImage,
  upload
} from '../controllers/contractor.controller.js';

const router = express.Router();

router.post('/profile', authenticate, authorize('contractor', 'admin'), createContractorProfile);
router.put('/profile', authenticate, authorize('contractor', 'admin'), updateContractorProfile);
router.post('/profile/logo', authenticate, authorize('contractor', 'admin'), upload.single('logo'), uploadLogo);
router.post('/profile/portfolio', authenticate, authorize('contractor', 'admin'), upload.single('image'), uploadPortfolioImage);
router.get('/:id', authenticate, getContractorProfile);
router.get('/search', authenticate, searchContractors);

export default router;
