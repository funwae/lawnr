import PremiumListing from '../models/PremiumListing.js';
import ContractorProfile from '../models/ContractorProfile.js';
import pool from '../../config/database.js';
import Stripe from 'stripe';

const isDemoMode = process.env.DEMO_MODE === 'true';
const stripe = isDemoMode ? null : new Stripe(process.env.STRIPE_SECRET_KEY || '');

// Pricing configuration
const PRICING = {
  boosted: {
    weekly: 29.99,
    monthly: 99.99,
  },
  featured: {
    weekly: 79.99,
    monthly: 249.99,
  }
};

/**
 * Calculate price for premium listing
 */
export const calculatePrice = (listingType, duration) => {
  const prices = PRICING[listingType];
  if (!prices) {
    throw new Error('Invalid listing type');
  }

  const price = prices[duration];
  if (!price) {
    throw new Error('Invalid duration');
  }

  return price;
};

/**
 * Create premium listing subscription
 */
export const createPremiumListing = async (contractorId, listingType, duration) => {
  try {
    const price = calculatePrice(listingType, duration);

    const startDate = new Date();
    const endDate = new Date();

    if (duration === 'weekly') {
      endDate.setDate(endDate.getDate() + 7);
    } else if (duration === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(price * 100), // Convert to cents
      currency: 'cad',
      description: `Lawnr ${listingType} listing - ${duration}`,
      metadata: {
        contractor_id: contractorId,
        listing_type: listingType,
        duration: duration
      }
    });

    // Create subscription record
    const subscription = await PremiumListing.create({
      contractor_id: contractorId,
      listing_type: listingType,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      amount_paid: price,
      payment_status: 'pending',
      stripe_payment_intent_id: paymentIntent.id
    });

    return {
      subscription,
      paymentIntent: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret
      }
    };
  } catch (error) {
    console.error('Error creating premium listing:', error);
    throw error;
  }
};

/**
 * Confirm premium listing payment
 */
export const confirmPremiumPayment = async (subscriptionId, paymentIntentId) => {
  try {
    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment not completed');
    }

    // Update subscription
    const subscription = await PremiumListing.update(subscriptionId, {
      payment_status: 'paid'
    });

    // Update contractor profile (trigger will handle this automatically)
    // The database trigger will update the premium_listing field

    return subscription;
  } catch (error) {
    console.error('Error confirming premium payment:', error);
    throw error;
  }
};

/**
 * Get active premium listings for search boost
 */
export const getActivePremiumListings = async (filters = {}) => {
  try {
    let query = `
      SELECT pls.*, cp.*, u.full_name
      FROM premium_listing_subscriptions pls
      JOIN contractor_profiles cp ON pls.contractor_id = cp.user_id
      JOIN users u ON cp.user_id = u.id
      WHERE pls.end_date >= CURRENT_DATE
      AND pls.payment_status = 'paid'
    `;
    const params = [];
    let paramCount = 1;

    if (filters.listingType) {
      query += ` AND pls.listing_type = $${paramCount}`;
      params.push(filters.listingType);
      paramCount++;
    }

    query += ' ORDER BY pls.listing_type DESC, cp.rating_avg DESC NULLS LAST';

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error getting active premium listings:', error);
    throw error;
  }
};

