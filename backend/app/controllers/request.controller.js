import ServiceRequest from '../models/ServiceRequest.js';
import Quote from '../models/Quote.js';
import Job from '../models/Job.js';
import RequestMedia from '../models/RequestMedia.js';
import { notifyQuoteReceived, notifyQuoteAccepted } from '../services/notification.service.js';
import { createJobWithConflictCheck } from '../services/job.service.js';
import { isQuoteValid } from '../services/quote.service.js';
import pool from '../../config/database.js';

export const createRequest = async (req, res, next) => {
  try {
    const request = await ServiceRequest.create({
      ...req.body,
      homeowner_id: req.user.id
    });

    res.status(201).json({ request });
  } catch (error) {
    next(error);
  }
};

export const getRequests = async (req, res, next) => {
  try {
    const requests = await ServiceRequest.findByHomeowner(req.user.id);

    // Attach media to each request
    for (const request of requests) {
      request.media = await RequestMedia.findByRequestId(request.id);
    }

    res.json({ requests });
  } catch (error) {
    next(error);
  }
};

export const getRequest = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ error: { message: 'Request not found' } });
    }

    // Attach media
    request.media = await RequestMedia.findByRequestId(request.id);

    // Attach quotes if homeowner or admin
    const quotes = await Quote.findByRequestId(request.id);

    res.json({ request, quotes });
  } catch (error) {
    next(error);
  }
};

export const getAvailableRequests = async (req, res, next) => {
  try {
    // Get contractor's service area and types from profile
    // For now, simplified - would need to fetch contractor profile
    const filters = {
      service_types: req.query.service_types ? req.query.service_types.split(',') : [],
      lat: parseFloat(req.query.lat),
      lon: parseFloat(req.query.lon),
      radius_km: parseFloat(req.query.radius_km) || 20
    };

    const requests = await ServiceRequest.findAvailable(filters);

    // Attach media to each request
    for (const request of requests) {
      request.media = await RequestMedia.findByRequestId(request.id);
    }

    res.json({ requests });
  } catch (error) {
    next(error);
  }
};

export const submitQuote = async (req, res, next) => {
  try {
    const { quoted_price, breakdown } = req.body;
    const service_request_id = req.params.id;

    // Set quote expiration to 48 hours from now
    const valid_until = new Date();
    valid_until.setHours(valid_until.getHours() + 48);

    const quote = await Quote.create({
      service_request_id,
      contractor_id: req.user.id,
      quoted_price,
      breakdown,
      valid_until
    });

    // Update request status
    await ServiceRequest.update(service_request_id, { status: 'quoted' });

    // Get homeowner info and contractor name
    const request = await ServiceRequest.findById(service_request_id);
    const contractor = await pool.query(
      'SELECT u.full_name, cp.business_name FROM users u LEFT JOIN contractor_profiles cp ON u.id = cp.user_id WHERE u.id = $1',
      [req.user.id]
    );

    // Notify homeowner
    await notifyQuoteReceived(
      request.homeowner_id,
      quote.id,
      contractor.rows[0]?.business_name || contractor.rows[0]?.full_name,
      quoted_price
    );

    res.status(201).json({ quote });
  } catch (error) {
    next(error);
  }
};

export const acceptQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findById(req.params.quoteId);

    if (!quote) {
      return res.status(404).json({ error: { message: 'Quote not found' } });
    }

    // Check if quote is still valid
    const isValid = await isQuoteValid(quote.id);
    if (!isValid) {
      return res.status(400).json({
        error: { message: 'Quote has expired. Please request a new quote.' }
      });
    }

    if (quote.status !== 'pending') {
      return res.status(400).json({ error: { message: 'Quote is not available for acceptance' } });
    }

    const request = await ServiceRequest.findById(quote.service_request_id);

    if (request.homeowner_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    // Update quote status
    await Quote.update(quote.id, { status: 'accepted' });

    // Update request status
    await ServiceRequest.update(request.id, { status: 'accepted' });

    // Create job with conflict checking
    const job = await createJobWithConflictCheck({
      quote_id: quote.id,
      contractor_id: quote.contractor_id,
      property_id: request.property_id,
      scheduled_date: request.preferred_date || new Date(),
      scheduled_time_from: request.preferred_time_from,
      scheduled_time_to: request.preferred_time_to
    });

    // Create job reminders
    const { createJobReminders } = await import('../services/notification.service.js');
    await createJobReminders(
      job.id,
      request.preferred_date || new Date(),
      request.preferred_time_from
    );

    // Notify contractor
    await notifyQuoteAccepted(quote.contractor_id, job.id);

    res.status(201).json({ job, quote });
  } catch (error) {
    next(error);
  }
};

