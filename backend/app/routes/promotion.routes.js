import express from 'express';
import { authenticate, authorize } from '../utils/auth.js';
import {
  createPromotionCode,
  validatePromotionCode,
  getPromotionCodes
} from '../controllers/promotion.controller.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('admin'), createPromotionCode);
router.post('/validate', validatePromotionCode);
router.get('/', getPromotionCodes);

export default router;

