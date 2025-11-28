import cron from 'node-cron';
import { expireQuotes } from '../app/services/quote.service.js';
import { processPendingNotifications } from '../app/services/notification.service.js';
import { releaseEscrowPayment } from '../app/services/payment.service.js';
import { processDueSubscriptions } from '../app/services/subscription.service.js';
import pool from '../config/database.js';

/**
 * Expire quotes every hour
 */
cron.schedule('0 * * * *', async () => {
  try {
    console.log('Running quote expiration check...');
    const count = await expireQuotes();
    if (count > 0) {
      console.log(`Expired ${count} quotes`);
    }
  } catch (error) {
    console.error('Error in quote expiration cron:', error);
  }
});

/**
 * Process pending notifications every minute
 */
cron.schedule('* * * * *', async () => {
  try {
    await processPendingNotifications();
  } catch (error) {
    console.error('Error processing notifications:', error);
  }
});

/**
 * Release escrow payments after dispute window (every 6 hours)
 */
cron.schedule('0 */6 * * *', async () => {
  try {
    console.log('Checking for escrow payments to release...');

    // Find completed jobs with paid invoices that are past dispute window
    const query = `
      SELECT i.id, i.job_id, j.actual_end
      FROM invoices i
      JOIN jobs j ON i.job_id = j.id
      WHERE j.status = 'completed'
      AND i.payment_status = 'paid'
      AND j.actual_end IS NOT NULL
      AND j.actual_end < now() - interval '48 hours'
      AND i.paid_at IS NULL
    `;

    const result = await pool.query(query);

    for (const row of result.rows) {
      try {
        await releaseEscrowPayment(row.id, 48);
        console.log(`Released escrow payment for invoice ${row.id}`);
      } catch (error) {
        console.error(`Error releasing escrow for invoice ${row.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in escrow release cron:', error);
  }
});

/**
 * Process due subscriptions daily at 6 AM
 */
cron.schedule('0 6 * * *', async () => {
  try {
    console.log('Processing due subscriptions...');
    const results = await processDueSubscriptions();
    console.log(`Processed ${results.processed} subscriptions`);
    if (results.errors.length > 0) {
      console.error('Errors:', results.errors);
    }
  } catch (error) {
    console.error('Error processing subscriptions:', error);
  }
});

console.log('Cron jobs started:');
console.log('- Quote expiration: Every hour');
console.log('- Notification processing: Every minute');
console.log('- Escrow release: Every 6 hours');
console.log('- Subscription processing: Daily at 6 AM');

// Keep process alive
setInterval(() => {}, 1000);

