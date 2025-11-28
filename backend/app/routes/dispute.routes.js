import express from 'express';
import { authenticate, authorize } from '../utils/auth.js';
import {
  createDispute,
  getDisputes,
  getDispute,
  addEvidence,
  resolveDispute
} from '../controllers/dispute.controller.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createDispute);
router.get('/', getDisputes);
router.get('/:id', getDispute);
router.post('/:id/evidence', addEvidence);
router.post('/:id/resolve', authorize('admin'), resolveDispute);

export default router;

