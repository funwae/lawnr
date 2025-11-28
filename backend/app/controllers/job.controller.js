import Job from '../models/Job.js';
import Invoice from '../models/Invoice.js';
import Quote from '../models/Quote.js';
import { notifyJobStatusChange, createJobReminders } from '../services/notification.service.js';
import { cancelJob } from '../services/job.service.js';
import { createEscrowPayment, releaseEscrowPayment } from '../services/payment.service.js';
import pool from '../../config/database.js';

export const getJobs = async (req, res, next) => {
  try {
    let jobs;
    if (req.user.role === 'contractor') {
      jobs = await Job.findByContractor(req.user.id);
    } else {
      jobs = await Job.findByHomeowner(req.user.id);
    }

    res.json({ jobs });
  } catch (error) {
    next(error);
  }
};

export const getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: { message: 'Job not found' } });
    }

    res.json({ job });
  } catch (error) {
    next(error);
  }
};

export const updateJobStatus = async (req, res, next) => {
  try {
    const { status, after_media, cost_log } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: { message: 'Job not found' } });
    }

    const updates = { status };

    if (status === 'on_way') {
      // Notify homeowner
      const property = await pool.query(
        'SELECT owner_id FROM properties WHERE id = $1',
        [job.property_id]
      );

      if (property.rows.length > 0) {
        await notifyJobStatusChange(
          property.rows[0].owner_id,
          job.id,
          'on_way'
        );
      }
    } else if (status === 'started') {
      updates.actual_start = true;
    } else if (status === 'completed') {
      updates.actual_end = true;
      if (after_media) updates.after_media = after_media;
      if (cost_log) updates.cost_log = cost_log;

      // Create invoice
      const quote = await Quote.findById(job.quote_id);
      const platformCommission = quote.quoted_price * 0.15; // 15% commission
      const contractorPayout = quote.quoted_price - platformCommission;

      const property = await pool.query(
        'SELECT owner_id FROM properties WHERE id = $1',
        [job.property_id]
      );

      const invoice = await Invoice.create({
        job_id: job.id,
        homeowner_id: property.rows[0].owner_id,
        contractor_id: job.contractor_id,
        amount_total: quote.quoted_price,
        platform_commission: platformCommission,
        contractor_payout: contractorPayout,
        payment_method: 'card'
      });

      // Notify homeowner
      await notifyJobStatusChange(
        property.rows[0].owner_id,
        job.id,
        'completed'
      );

      // Payment will be held in escrow until dispute window passes
    }

    const updated = await Job.update(req.params.id, updates);
    res.json({ job: updated });
  } catch (error) {
    next(error);
  }
};

export const createJob = async (req, res, next) => {
  try {
    const {
      quote_id,
      contractor_id,
      property_id,
      scheduled_date,
      scheduled_time_from,
      scheduled_time_to
    } = req.body;

    const { createJobWithConflictCheck } = await import('../services/job.service.js');

    const job = await createJobWithConflictCheck({
      quote_id,
      contractor_id,
      property_id,
      scheduled_date,
      scheduled_time_from,
      scheduled_time_to
    });

    // Create job reminders
    await createJobReminders(
      job.id,
      scheduled_date,
      scheduled_time_from
    );

    res.status(201).json({ job });
  } catch (error) {
    if (error.message.includes('conflict')) {
      return res.status(409).json({ error: { message: error.message } });
    }
    next(error);
  }
};

export const cancelJobEndpoint = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const result = await cancelJob(
      req.params.id,
      req.user.id,
      req.user.role,
      reason
    );

    res.json(result);
  } catch (error) {
    if (error.message === 'Unauthorized to cancel this job') {
      return res.status(403).json({ error: { message: error.message } });
    }
    next(error);
  }
};
