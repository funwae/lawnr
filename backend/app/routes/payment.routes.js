import express from 'express';
import { authenticate, authorize } from '../utils/auth.js';
import {
  getInvoices,
  getInvoice,
  processPayment,
  releasePayment,
  refundPayment,
  handleWebhook
} from '../controllers/payment.controller.js';

const router = express.Router();

router.get('/', authenticate, getInvoices);
router.get('/:id', authenticate, getInvoice);
router.post('/', authenticate, processPayment);
router.post('/:invoice_id/release', authenticate, authorize('admin'), releasePayment);
router.post('/:invoice_id/refund', authenticate, authorize('admin', 'homeowner'), refundPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;

