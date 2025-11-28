import Quote from '../models/Quote.js';
import ServiceRequest from '../models/ServiceRequest.js';
import pool from '../../config/database.js';

/**
 * Check and expire quotes that have passed their valid_until date
 */
export const expireQuotes = async () => {
  try {
    const query = `
      UPDATE quotes
      SET status = 'expired', updated_at = now()
      WHERE status = 'pending'
      AND valid_until < now()
      RETURNING id, service_request_id
    `;

    const result = await pool.query(query);
    const expiredQuotes = result.rows;

    // Update service request status if all quotes expired
    for (const quote of expiredQuotes) {
      const remainingQuotes = await pool.query(
        `SELECT COUNT(*) as count
         FROM quotes
         WHERE service_request_id = $1 AND status = 'pending'`,
        [quote.service_request_id]
      );

      if (parseInt(remainingQuotes.rows[0].count) === 0) {
        // No pending quotes left, reset request to pending
        await ServiceRequest.update(quote.service_request_id, {
          status: 'pending',
        });
      }
    }

    return expiredQuotes.length;
  } catch (error) {
    console.error('Error expiring quotes:', error);
    throw error;
  }
};

/**
 * Check if a quote is still valid
 */
export const isQuoteValid = async (quoteId) => {
  const quote = await Quote.findById(quoteId);

  if (!quote) {
    return false;
  }

  if (quote.status !== 'pending') {
    return false;
  }

  if (new Date(quote.valid_until) < new Date()) {
    // Auto-expire if past valid_until
    await Quote.update(quoteId, { status: 'expired' });
    return false;
  }

  return true;
};

/**
 * Allow contractor to re-quote if original quote expired
 */
export const createReQuote = async (expiredQuoteId, newPrice, breakdown) => {
  const oldQuote = await Quote.findById(expiredQuoteId);

  if (!oldQuote) {
    throw new Error('Original quote not found');
  }

  if (oldQuote.status !== 'expired') {
    throw new Error('Can only re-quote expired quotes');
  }

  // Check if request is still open
  const request = await ServiceRequest.findById(oldQuote.service_request_id);
  if (request.status !== 'pending' && request.status !== 'quoted') {
    throw new Error('Service request is no longer available');
  }

  // Create new quote with 48-hour expiration
  const validUntil = new Date();
  validUntil.setHours(validUntil.getHours() + 48);

  const newQuote = await Quote.create({
    service_request_id: oldQuote.service_request_id,
    contractor_id: oldQuote.contractor_id,
    quoted_price: newPrice,
    breakdown: breakdown,
    valid_until: validUntil,
  });

  // Update request status
  await ServiceRequest.update(oldQuote.service_request_id, {
    status: 'quoted',
  });

  return newQuote;
};

