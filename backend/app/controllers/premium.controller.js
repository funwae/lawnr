import PremiumListing from '../models/PremiumListing.js';
import {
  createPremiumListing,
  confirmPremiumPayment,
  calculatePrice,
  getActivePremiumListings
} from '../services/premium.service.js';

export const purchasePremiumListing = async (req, res, next) => {
  try {
    const { listing_type, duration } = req.body;

    if (!['boosted', 'featured'].includes(listing_type)) {
      return res.status(400).json({
        error: { message: 'Invalid listing type' }
      });
    }

    if (!['weekly', 'monthly'].includes(duration)) {
      return res.status(400).json({
        error: { message: 'Invalid duration' }
      });
    }

    const result = await createPremiumListing(
      req.user.id,
      listing_type,
      duration
    );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const confirmPayment = async (req, res, next) => {
  try {
    const { subscription_id, payment_intent_id } = req.body;

    const subscription = await confirmPremiumPayment(
      subscription_id,
      payment_intent_id
    );

    res.json({ subscription });
  } catch (error) {
    next(error);
  }
};

export const getMyPremiumListings = async (req, res, next) => {
  try {
    const listings = await PremiumListing.findByContractor(req.user.id);
    res.json({ listings });
  } catch (error) {
    next(error);
  }
};

export const getActiveListings = async (req, res, next) => {
  try {
    const listings = await PremiumListing.findActiveByContractor(req.user.id);
    res.json({ listings });
  } catch (error) {
    next(error);
  }
};

export const getPricing = async (req, res, next) => {
  try {
    const pricing = {
      boosted: {
        weekly: 29.99,
        monthly: 99.99,
      },
      featured: {
        weekly: 79.99,
        monthly: 249.99,
      }
    };

    res.json({ pricing });
  } catch (error) {
    next(error);
  }
};

