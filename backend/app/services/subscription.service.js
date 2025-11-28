import Subscription from '../models/Subscription.js';
import SubscriptionService from '../models/SubscriptionService.js';
import ServiceRequest from '../models/ServiceRequest.js';
import Quote from '../models/Quote.js';
import Job from '../models/Job.js';
import { createJobWithConflictCheck } from './job.service.js';
import { notifyQuoteReceived } from './notification.service.js';
import pool from '../../config/database.js';

/**
 * Calculate next service date based on frequency
 */
export const calculateNextServiceDate = (currentDate, frequency, frequencyValue = null) => {
  const next = new Date(currentDate);

  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'custom':
      if (frequencyValue) {
        next.setDate(next.getDate() + (frequencyValue * 7));
      } else {
        next.setDate(next.getDate() + 7);
      }
      break;
    default:
      next.setDate(next.getDate() + 7);
  }

  return next.toISOString().split('T')[0];
};

/**
 * Generate service request from subscription
 */
export const generateServiceRequest = async (subscription) => {
  try {
    // Create service request
    const request = await ServiceRequest.create({
      property_id: subscription.property_id,
      homeowner_id: subscription.homeowner_id,
      requested_services: subscription.service_types,
      schedule_preference: 'scheduled',
      preferred_date: subscription.next_service_date,
      preferred_time_from: subscription.preferred_time_from,
      preferred_time_to: subscription.preferred_time_to,
      notes: subscription.notes,
      status: 'pending'
    });

    // Create subscription service record
    const subscriptionService = await SubscriptionService.create({
      subscription_id: subscription.id,
      service_request_id: request.id,
      scheduled_date: subscription.next_service_date,
      status: 'pending'
    });

    // If contractor is assigned and auto-accept is enabled
    if (subscription.contractor_id && subscription.auto_accept_quote && subscription.quoted_price) {
      // Create quote automatically
      const validUntil = new Date();
      validUntil.setHours(validUntil.getHours() + 48);

      const quote = await Quote.create({
        service_request_id: request.id,
        contractor_id: subscription.contractor_id,
        quoted_price: subscription.quoted_price,
        valid_until: validUntil,
        status: 'pending'
      });

      // Auto-accept quote if enabled
      await acceptQuoteForSubscription(request.id, quote.id, subscription.homeowner_id);
    } else if (subscription.contractor_id) {
      // Notify contractor if assigned
      const validUntil = new Date();
      validUntil.setHours(validUntil.getHours() + 48);

      const quote = await Quote.create({
        service_request_id: request.id,
        contractor_id: subscription.contractor_id,
        quoted_price: subscription.quoted_price || 0,
        valid_until: validUntil,
        status: 'pending'
      });

      await notifyQuoteReceived(
        subscription.homeowner_id,
        quote.id,
        'Your regular contractor',
        quote.quoted_price
      );
    }

    // Update subscription next service date
    const nextDate = calculateNextServiceDate(
      subscription.next_service_date,
      subscription.frequency,
      subscription.frequency_value
    );

    await Subscription.update(subscription.id, {
      next_service_date: nextDate
    });

    return { request, subscriptionService };
  } catch (error) {
    console.error('Error generating service request:', error);
    throw error;
  }
};

/**
 * Auto-accept quote for subscription
 */
const acceptQuoteForSubscription = async (requestId, quoteId, homeownerId) => {
  const quote = await Quote.findById(quoteId);
  const request = await ServiceRequest.findById(requestId);

  if (!quote || !request) {
    throw new Error('Quote or request not found');
  }

  // Update quote status
  await Quote.update(quoteId, { status: 'accepted' });
  await ServiceRequest.update(requestId, { status: 'accepted' });

  // Create job
  const job = await createJobWithConflictCheck({
    quote_id: quoteId,
    contractor_id: quote.contractor_id,
    property_id: request.property_id,
    scheduled_date: request.preferred_date || new Date(),
    scheduled_time_from: request.preferred_time_from,
    scheduled_time_to: request.preferred_time_to
  });

  // Update subscription service with job ID
  const subscriptionService = await pool.query(
    'SELECT id FROM subscription_services WHERE service_request_id = $1',
    [requestId]
  );

  if (subscriptionService.rows.length > 0) {
    await SubscriptionService.update(subscriptionService.rows[0].id, {
      job_id: job.id
    });
  }

  return job;
};

/**
 * Process subscriptions due for service
 * Called by cron job
 */
export const processDueSubscriptions = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const subscriptions = await Subscription.findActiveForDate(today);

    const results = {
      processed: 0,
      errors: []
    };

    for (const subscription of subscriptions) {
      try {
        // Check if service request already exists for this date
        const existing = await pool.query(
          `SELECT ss.id FROM subscription_services ss
           JOIN service_requests sr ON ss.service_request_id = sr.id
           WHERE ss.subscription_id = $1
           AND ss.scheduled_date = $2
           AND ss.status = 'pending'`,
          [subscription.id, subscription.next_service_date]
        );

        if (existing.rows.length > 0) {
          // Already generated, skip
          continue;
        }

        await generateServiceRequest(subscription);
        results.processed++;
      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error);
        results.errors.push({ subscriptionId: subscription.id, error: error.message });
      }
    }

    return results;
  } catch (error) {
    console.error('Error processing due subscriptions:', error);
    throw error;
  }
};

/**
 * Skip a scheduled service
 */
export const skipService = async (subscriptionServiceId, reason) => {
  const service = await SubscriptionService.findById(subscriptionServiceId);

  if (!service) {
    throw new Error('Subscription service not found');
  }

  await SubscriptionService.skip(subscriptionServiceId, reason);

  // Update subscription next service date
  const subscription = await Subscription.findById(service.subscription_id);
  const nextDate = calculateNextServiceDate(
    service.scheduled_date,
    subscription.frequency,
    subscription.frequency_value
  );

  await Subscription.update(subscription.id, {
    next_service_date: nextDate
  });

  return await SubscriptionService.findById(subscriptionServiceId);
};

/**
 * Reschedule a service
 */
export const rescheduleService = async (subscriptionServiceId, newDate) => {
  const service = await SubscriptionService.findById(subscriptionServiceId);

  if (!service) {
    throw new Error('Subscription service not found');
  }

  await SubscriptionService.update(subscriptionServiceId, {
    scheduled_date: newDate
  });

  // Update associated service request if exists
  if (service.service_request_id) {
    await ServiceRequest.update(service.service_request_id, {
      preferred_date: newDate
    });
  }

  return await SubscriptionService.findById(subscriptionServiceId);
};

