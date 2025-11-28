import Subscription from '../models/Subscription.js';
import SubscriptionService from '../models/SubscriptionService.js';
import {
  processDueSubscriptions,
  skipService,
  rescheduleService,
  calculateNextServiceDate
} from '../services/subscription.service.js';

export const createSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.create({
      ...req.body,
      homeowner_id: req.user.id
    });

    res.status(201).json({ subscription });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptions = async (req, res, next) => {
  try {
    let subscriptions;

    if (req.user.role === 'contractor') {
      subscriptions = await Subscription.findByContractor(req.user.id);
    } else {
      subscriptions = await Subscription.findByHomeowner(req.user.id);
    }

    // Attach service history
    for (const sub of subscriptions) {
      sub.services = await SubscriptionService.findBySubscription(sub.id);
    }

    res.json({ subscriptions });
  } catch (error) {
    next(error);
  }
};

export const getSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ error: { message: 'Subscription not found' } });
    }

    // Verify ownership
    if (subscription.homeowner_id !== req.user.id &&
        subscription.contractor_id !== req.user.id &&
        req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    subscription.services = await SubscriptionService.findBySubscription(subscription.id);

    res.json({ subscription });
  } catch (error) {
    next(error);
  }
};

export const updateSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ error: { message: 'Subscription not found' } });
    }

    if (subscription.homeowner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    const updated = await Subscription.update(req.params.id, req.body);
    res.json({ subscription: updated });
  } catch (error) {
    next(error);
  }
};

export const pauseSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ error: { message: 'Subscription not found' } });
    }

    if (subscription.homeowner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    const updated = await Subscription.pause(req.params.id);
    res.json({ subscription: updated });
  } catch (error) {
    next(error);
  }
};

export const resumeSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ error: { message: 'Subscription not found' } });
    }

    if (subscription.homeowner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    const updated = await Subscription.resume(req.params.id);
    res.json({ subscription: updated });
  } catch (error) {
    next(error);
  }
};

export const cancelSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ error: { message: 'Subscription not found' } });
    }

    if (subscription.homeowner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    const updated = await Subscription.cancel(req.params.id);
    res.json({ subscription: updated });
  } catch (error) {
    next(error);
  }
};

export const skipSubscriptionService = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const service = await skipService(req.params.serviceId, reason);
    res.json({ service });
  } catch (error) {
    next(error);
  }
};

export const rescheduleSubscriptionService = async (req, res, next) => {
  try {
    const { new_date } = req.body;
    const service = await rescheduleService(req.params.serviceId, new_date);
    res.json({ service });
  } catch (error) {
    next(error);
  }
};

export const processSubscriptions = async (req, res, next) => {
  try {
    // Admin only endpoint to manually trigger processing
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    const results = await processDueSubscriptions();
    res.json(results);
  } catch (error) {
    next(error);
  }
};

