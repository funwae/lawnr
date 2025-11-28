import Invoice from '../models/Invoice.js';
import Job from '../models/Job.js';
import pool from '../../config/database.js';
import Stripe from 'stripe';

const isDemoMode = process.env.DEMO_MODE === 'true';
const stripe = isDemoMode ? null : new Stripe(process.env.STRIPE_SECRET_KEY || '');

/**
 * Hold payment in escrow until job completion
 * In production, this would use Stripe's payment intents or holds
 */
export const createEscrowPayment = async (invoiceId, paymentToken) => {
  try {
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.payment_status !== 'pending') {
      throw new Error('Invoice is not in pending status');
    }

    // Create payment intent with capture_method: 'manual' for escrow
    let paymentIntent;
    if (isDemoMode) {
      // Demo mode: simulate payment intent
      paymentIntent = {
        id: `pi_demo_${Date.now()}`,
        client_secret: `pi_demo_${Date.now()}_secret`,
        status: 'requires_capture',
      };
    } else {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(invoice.amount_total * 100), // Convert to cents
        currency: 'cad',
        payment_method: paymentToken,
        capture_method: 'manual', // Hold funds
        description: `Lawnr job payment - Invoice ${invoice.id}`,
        metadata: {
          invoice_id: invoice.id,
          job_id: invoice.job_id,
          homeowner_id: invoice.homeowner_id,
          contractor_id: invoice.contractor_id,
        },
      });
    }

    // Update invoice with payment intent ID
    await Invoice.update(invoice.id, {
      payment_status: 'paid', // Mark as paid but held
      payment_method: 'card',
      // Store payment_intent_id in a separate field or metadata
    });

    return {
      invoice: await Invoice.findById(invoice.id),
      paymentIntent: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        status: paymentIntent.status,
      },
    };
  } catch (error) {
    console.error('Error creating escrow payment:', error);
    throw error;
  }
};

/**
 * Release payment from escrow after job completion and dispute window
 */
export const releaseEscrowPayment = async (invoiceId, disputeWindowHours = 48) => {
  try {
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const job = await Job.findById(invoice.job_id);

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status !== 'completed') {
      throw new Error('Job must be completed before releasing payment');
    }

    // Check if dispute window has passed
    if (job.actual_end) {
      const completionTime = new Date(job.actual_end);
      const now = new Date();
      const hoursSinceCompletion = (now - completionTime) / (1000 * 60 * 60);

      if (hoursSinceCompletion < disputeWindowHours) {
        throw new Error(
          `Dispute window (${disputeWindowHours}h) has not passed. Payment will be released automatically.`
        );
      }
    }

    // In production, capture the payment intent here
    // await stripe.paymentIntents.capture(paymentIntentId);

    // Update invoice
    await Invoice.update(invoice.id, {
      paid_at: true, // Mark as fully paid and released
    });

    // Trigger contractor payout
    // await processContractorPayout(invoice.contractor_id, invoice.contractor_payout);

    return await Invoice.findById(invoice.id);
  } catch (error) {
    console.error('Error releasing escrow payment:', error);
    throw error;
  }
};

/**
 * Process refund
 */
export const processRefund = async (invoiceId, amount, reason) => {
  try {
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.payment_status !== 'paid') {
      throw new Error('Invoice is not paid');
    }

    const refundAmount = amount || invoice.amount_total;

    // In production, process refund through Stripe
    // const refund = await stripe.refunds.create({
    //   payment_intent: paymentIntentId,
    //   amount: Math.round(refundAmount * 100),
    //   reason: reason || 'requested_by_customer',
    // });

    // Update invoice
    await Invoice.update(invoice.id, {
      payment_status: 'refunded',
    });

    return {
      invoice: await Invoice.findById(invoice.id),
      refundAmount,
    };
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
};

/**
 * Process contractor payout (minus commission)
 */
export const processContractorPayout = async (contractorId, amount) => {
  try {
    // In production, use Stripe Connect or transfers
    // For now, just log the payout

    console.log(`Processing payout to contractor ${contractorId}: $${amount}`);

    // TODO: Implement actual payout logic
    // await stripe.transfers.create({
    //   amount: Math.round(amount * 100),
    //   currency: 'cad',
    //   destination: contractorStripeAccountId,
    // });

    return { success: true, amount };
  } catch (error) {
    console.error('Error processing contractor payout:', error);
    throw error;
  }
};

