import Job from '../models/Job.js';
import Invoice from '../models/Invoice.js';
import pool from '../../config/database.js';
import { notifyJobStatusChange } from './notification.service.js';

/**
 * Check for scheduling conflicts
 * Returns true if there's a conflict, false otherwise
 */
export const checkSchedulingConflict = async (
  contractorId,
  scheduledDate,
  scheduledTimeFrom,
  scheduledTimeTo
) => {
  try {
    let query = `
      SELECT id FROM jobs
      WHERE contractor_id = $1
      AND scheduled_date = $2
      AND status NOT IN ('completed', 'cancelled')
    `;
    const params = [contractorId, scheduledDate];
    let paramCount = 3;

    // If time ranges are provided, check for overlap
    if (scheduledTimeFrom && scheduledTimeTo) {
      query += ` AND (
        (scheduled_time_from <= $${paramCount} AND scheduled_time_to >= $${paramCount}) OR
        (scheduled_time_from <= $${paramCount + 1} AND scheduled_time_to >= $${paramCount + 1}) OR
        (scheduled_time_from >= $${paramCount} AND scheduled_time_to <= $${paramCount + 1})
      )`;
      params.push(scheduledTimeFrom, scheduledTimeTo);
    }

    const result = await pool.query(query, params);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking scheduling conflict:', error);
    throw error;
  }
};

/**
 * Cancel a job with policy enforcement
 */
export const cancelJob = async (jobId, userId, userRole, reason) => {
  try {
    const job = await Job.findById(jobId);

    if (!job) {
      throw new Error('Job not found');
    }

    // Check authorization
    const property = await pool.query(
      'SELECT owner_id FROM properties WHERE id = $1',
      [job.property_id]
    );

    const isHomeowner = property.rows[0]?.owner_id === userId;
    const isContractor = job.contractor_id === userId;

    if (!isHomeowner && !isContractor && userRole !== 'admin') {
      throw new Error('Unauthorized to cancel this job');
    }

    // Check cancellation policy
    const scheduledDateTime = new Date(`${job.scheduled_date}T${job.scheduled_time_from || '09:00:00'}`);
    const now = new Date();
    const hoursUntilJob = (scheduledDateTime - now) / (1000 * 60 * 60);

    let cancellationFee = 0;
    let refundAmount = 0;

    // Policy: Free cancellation if > 24 hours before, 10% fee if < 24 hours
    const invoice = await Invoice.findByJobId(jobId);

    if (invoice && invoice.payment_status === 'paid') {
      if (hoursUntilJob < 24) {
        // Less than 24 hours - 10% cancellation fee
        cancellationFee = invoice.amount_total * 0.1;
        refundAmount = invoice.amount_total - cancellationFee;
      } else {
        // More than 24 hours - full refund
        refundAmount = invoice.amount_total;
      }
    }

    // Update job status
    await Job.update(jobId, {
      status: 'cancelled',
    });

    // Handle refund if payment was made
    if (invoice && invoice.payment_status === 'paid' && refundAmount > 0) {
      // Update invoice
      await Invoice.update(invoice.id, {
        payment_status: 'refunded',
      });

      // TODO: Process actual refund through Stripe
      // await processRefund(invoice.id, refundAmount);
    }

    // Notify both parties
    if (isHomeowner) {
      await notifyJobStatusChange(job.contractor_id, jobId, 'cancelled', {
        cancelled_by: 'homeowner',
        reason,
      });
    } else {
      await notifyJobStatusChange(property.rows[0].owner_id, jobId, 'cancelled', {
        cancelled_by: 'contractor',
        reason,
      });
    }

    return {
      job: await Job.findById(jobId),
      cancellationFee,
      refundAmount,
    };
  } catch (error) {
    console.error('Error cancelling job:', error);
    throw error;
  }
};

/**
 * Create job with conflict checking
 */
export const createJobWithConflictCheck = async (jobData) => {
  const conflict = await checkSchedulingConflict(
    jobData.contractor_id,
    jobData.scheduled_date,
    jobData.scheduled_time_from,
    jobData.scheduled_time_to
  );

  if (conflict) {
    throw new Error('Scheduling conflict: Contractor already has a job at this time');
  }

  return await Job.create(jobData);
};

