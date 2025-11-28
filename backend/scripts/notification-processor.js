import cron from 'node-cron';
import { processPendingNotifications } from '../app/services/notification.service.js';

/**
 * Process pending notifications every minute
 */
cron.schedule('* * * * *', async () => {
  try {
    console.log('Processing pending notifications...');
    const count = await processPendingNotifications();
    if (count > 0) {
      console.log(`Processed ${count} notifications`);
    }
  } catch (error) {
    console.error('Error processing notifications:', error);
  }
});

console.log('Notification processor started. Processing every minute.');

// Keep process alive
setInterval(() => {}, 1000);

