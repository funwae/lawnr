import Invoice from '../models/Invoice.js';
import Job from '../models/Job.js';
import { createEscrowPayment, releaseEscrowPayment, processRefund } from '../services/payment.service.js';
import Stripe from 'stripe';

const isDemoMode = process.env.DEMO_MODE === 'true';
const stripe = isDemoMode ? null : new Stripe(process.env.STRIPE_SECRET_KEY || '');

export const getInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.findByUser(req.user.id, req.user.role);
    res.json({ invoices });
  } catch (error) {
    next(error);
  }
};

export const getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: { message: 'Invoice not found' } });
    }

    res.json({ invoice });
  } catch (error) {
    next(error);
  }
};

export const processPayment = async (req, res, next) => {
  try {
    const { job_id, payment_token, payment_method = 'card' } = req.body;

    const invoice = await Invoice.findByJobId(job_id);

    if (!invoice) {
      return res.status(404).json({ error: { message: 'Invoice not found' } });
    }

    if (invoice.payment_status === 'paid') {
      return res.status(400).json({ error: { message: 'Invoice already paid' } });
    }

    const job = await Job.findById(job_id);

    // Handle bank transfer payment
    if (payment_method === 'bank_transfer') {
      // Update invoice with bank transfer method and pending status
      await Invoice.update(invoice.id, {
        payment_method: 'bank_transfer',
        payment_status: 'pending',
      });

      return res.json({
        invoice: await Invoice.findById(invoice.id),
        message: 'Payment pending bank transfer verification',
        bank_details: {
          account_name: 'Lawnr Platform',
          account_number: process.env.BANK_ACCOUNT_NUMBER || 'TBD',
          routing_number: process.env.BANK_ROUTING_NUMBER || 'TBD',
          reference: invoice.id,
        },
      });
    }

    // Card payment processing
    if (!payment_token) {
      return res.status(400).json({
        error: { message: 'payment_token is required for card payments' },
      });
    }

    // Use escrow payment if job is not yet completed
    if (job.status !== 'completed') {
      // Hold payment in escrow
      const result = await createEscrowPayment(invoice.id, payment_token);
      return res.json(result);
    }

    // If job is completed and dispute window passed, process normal payment
    // Otherwise, still use escrow
    const result = await createEscrowPayment(invoice.id, payment_token);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const releasePayment = async (req, res, next) => {
  try {
    const { invoice_id } = req.params;
    const { dispute_window_hours } = req.body;

    const invoice = await releaseEscrowPayment(
      invoice_id,
      dispute_window_hours || 48
    );

    res.json({ invoice });
  } catch (error) {
    if (error.message.includes('Dispute window')) {
      return res.status(400).json({ error: { message: error.message } });
    }
    next(error);
  }
};

export const refundPayment = async (req, res, next) => {
  try {
    const { invoice_id } = req.params;
    const { amount, reason } = req.body;

    const result = await processRefund(invoice_id, amount, reason);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Handle payment events
    if (event.type === 'charge.succeeded') {
      // Update invoice status
      // Implementation depends on how you link Stripe charges to invoices
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};

