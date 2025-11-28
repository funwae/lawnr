import express from 'express';
import { authenticate } from '../utils/auth.js';
import {
  getMyReferralCode,
  getMyReferrals,
  applyReferralCode
} from '../controllers/referral.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/my-code', getMyReferralCode);
router.get('/my-referrals', getMyReferrals);
router.post('/apply', applyReferralCode);

export default router;

