import admin from 'firebase-admin';
import Notification from '../models/Notification.js';
import NotificationPreference from '../models/NotificationPreference.js';
import { sendEmail } from './email.service.js';
import { sendSMS } from './sms.service.js';
import pool from '../../config/database.js';

// Initialize Firebase Admin (if not already initialized)
let firebaseApp;
if (!admin.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;

    if (serviceAccount) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      console.warn('Firebase not configured. Notifications will be stored but not sent.');
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

/**
 * Get FCM token for a user
 */
const getUserFCMToken = async (user_id) => {
  const query = 'SELECT fcm_token FROM users WHERE id = $1';
  const result = await pool.query(query, [user_id]);
  return result.rows[0]?.fcm_token;
};

/**
 * Send push notification via FCM
 */
export const sendPushNotification = async (user_id, title, body, data = {}) => {
  try {
    const fcmToken = await getUserFCMToken(user_id);

    if (!fcmToken) {
      console.log(`No FCM token for user ${user_id}`);
      return false;
    }

    if (!firebaseApp) {
      console.log('Firebase not configured, skipping push notification');
      return false;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      token: fcmToken,
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
};

/**
 * Send notification through all enabled channels
 */
export const sendMultiChannelNotification = async (userId, title, body, data = {}) => {
  try {
    const prefs = await NotificationPreference.findByUserId(userId);
    const user = await pool.query('SELECT email, phone_number, full_name FROM users WHERE id = $1', [userId]);

    if (!user.rows[0]) {
      return { success: false, error: 'User not found' };
    }

    const userData = user.rows[0];
    const results = {};

    // Push notification
    if (!prefs || prefs.push_enabled !== false) {
      try {
        const pushResult = await sendPushNotification(userId, title, body, data);
        results.push = pushResult;
      } catch (e) {
        console.error('Push notification error:', e);
      }
    }

    // Email notification
    if (prefs && prefs.email_enabled && userData.email) {
      try {
        const emailResult = await sendEmail(
          userData.email,
          title,
          `<h2>${title}</h2><p>${body}</p>`
        );
        results.email = emailResult;
      } catch (e) {
        console.error('Email notification error:', e);
      }
    }

    // SMS notification
    if (prefs && prefs.sms_enabled && userData.phone_number) {
      try {
        const smsResult = await sendSMS(userData.phone_number, `${title}: ${body}`);
        results.sms = smsResult;
      } catch (e) {
        console.error('SMS notification error:', e);
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error('Error sending multi-channel notification:', error);
    throw error;
  }
};

/**
 * Create and send notification
 */
export const createAndSendNotification = async (notificationData) => {
  try {
    // Create notification record
    const notification = await Notification.create(notificationData);

    // Send push notification if scheduled for now or past
    const scheduledFor = notification.scheduled_for
      ? new Date(notification.scheduled_for)
      : new Date();

    if (scheduledFor <= new Date()) {
      const title = getNotificationTitle(notification.type, notification.payload);
      const body = getNotificationBody(notification.type, notification.payload);

      // Send through all enabled channels
      await sendMultiChannelNotification(
        notification.user_id,
        title,
        body,
        {
          notification_id: notification.id,
          type: notification.type,
          job_id: notification.job_id || '',
        }
      );

      await Notification.updateStatus(notification.id, 'sent');
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Get notification title based on type
 */
const getNotificationTitle = (type, payload) => {
  const titles = {
    reminder_24h: 'Job Reminder',
    reminder_1h: 'Job Starting Soon',
    on_my_way: 'Contractor On The Way',
    arrival_eta: 'Arrival Update',
    job_complete: 'Job Completed',
    payment_due: 'Payment Due',
    payment_received: 'Payment Received',
    quote_received: 'New Quote Received',
    quote_accepted: 'Quote Accepted',
    job_scheduled: 'Job Scheduled',
    message: 'New Message',
  };
  return titles[type] || 'Lawnr Notification';
};

/**
 * Get notification body based on type
 */
const getNotificationBody = (type, payload) => {
  const bodies = {
    reminder_24h: `You have a job scheduled for tomorrow.`,
    reminder_1h: `Your job is starting in 1 hour.`,
    on_my_way: `Your contractor is on the way to your property.`,
    arrival_eta: payload?.eta
      ? `Your contractor will arrive in ${payload.eta} minutes.`
      : `Your contractor is arriving soon.`,
    job_complete: `Your job has been completed. Please review and pay.`,
    payment_due: `Payment is due for your completed job.`,
    payment_received: `Payment of $${payload?.amount || 'N/A'} has been received.`,
    quote_received: `You received a new quote for $${payload?.price || 'N/A'}.`,
    quote_accepted: `Your quote has been accepted!`,
    job_scheduled: `A new job has been scheduled for you.`,
    message: payload?.message || 'You have a new message.',
  };
  return bodies[type] || 'You have a new notification.';
};

/**
 * Schedule notification for future delivery
 */
export const scheduleNotification = async (notificationData) => {
  return await Notification.create(notificationData);
};

/**
 * Process pending notifications (to be called by cron job)
 */
export const processPendingNotifications = async () => {
  try {
    const pending = await Notification.findPending();

    for (const notification of pending) {
      const title = getNotificationTitle(notification.type, notification.payload);
      const body = getNotificationBody(notification.type, notification.payload);

      const sent = await sendPushNotification(
        notification.user_id,
        title,
        body,
        {
          notification_id: notification.id,
          type: notification.type,
          job_id: notification.job_id || '',
        }
      );

      if (sent) {
        await Notification.updateStatus(notification.id, 'sent');
      } else {
        // Keep as pending to retry later
        console.log(`Failed to send notification ${notification.id}, will retry`);
      }
    }

    return pending.length;
  } catch (error) {
    console.error('Error processing pending notifications:', error);
    throw error;
  }
};

/**
 * Create job reminder notifications
 */
export const createJobReminders = async (job_id, scheduled_date, scheduled_time) => {
  try {
    // Get job details
    const jobQuery = await pool.query(
      `SELECT j.*, p.owner_id as homeowner_id, j.contractor_id
       FROM jobs j
       JOIN properties p ON j.property_id = p.id
       WHERE j.id = $1`,
      [job_id]
    );

    if (jobQuery.rows.length === 0) {
      throw new Error('Job not found');
    }

    const job = jobQuery.rows[0];
    const scheduledDateTime = new Date(`${scheduled_date}T${scheduled_time || '09:00:00'}`);

    // 24-hour reminder
    const reminder24h = new Date(scheduledDateTime);
    reminder24h.setHours(reminder24h.getHours() - 24);

    // 1-hour reminder
    const reminder1h = new Date(scheduledDateTime);
    reminder1h.setHours(reminder1h.getHours() - 1);

    // Create notifications for homeowner
    await scheduleNotification({
      user_id: job.homeowner_id,
      job_id: job_id,
      type: 'reminder_24h',
      scheduled_for: reminder24h,
    });

    await scheduleNotification({
      user_id: job.homeowner_id,
      job_id: job_id,
      type: 'reminder_1h',
      scheduled_for: reminder1h,
    });

    // Create notifications for contractor
    await scheduleNotification({
      user_id: job.contractor_id,
      job_id: job_id,
      type: 'reminder_24h',
      scheduled_for: reminder24h,
    });

    await scheduleNotification({
      user_id: job.contractor_id,
      job_id: job_id,
      type: 'reminder_1h',
      scheduled_for: reminder1h,
    });

    return true;
  } catch (error) {
    console.error('Error creating job reminders:', error);
    throw error;
  }
};

/**
 * Notify about quote received
 */
export const notifyQuoteReceived = async (homeowner_id, quote_id, contractor_name, price) => {
  return await createAndSendNotification({
    user_id: homeowner_id,
    type: 'quote_received',
    payload: {
      quote_id,
      contractor_name,
      price,
    },
  });
};

/**
 * Notify about quote accepted
 */
export const notifyQuoteAccepted = async (contractor_id, job_id) => {
  return await createAndSendNotification({
    user_id: contractor_id,
    job_id: job_id,
    type: 'quote_accepted',
  });
};

/**
 * Notify about job status change
 */
export const notifyJobStatusChange = async (user_id, job_id, status, payload = {}) => {
  let type;
  switch (status) {
    case 'on_way':
      type = 'on_my_way';
      break;
    case 'started':
      type = 'job_scheduled';
      break;
    case 'completed':
      type = 'job_complete';
      break;
    default:
      return null;
  }

  return await createAndSendNotification({
    user_id,
    job_id,
    type,
    payload,
  });
};

/**
 * Notify about payment
 */
export const notifyPayment = async (user_id, type, amount) => {
  const notificationType = type === 'received' ? 'payment_received' : 'payment_due';

  return await createAndSendNotification({
    user_id,
    type: notificationType,
    payload: { amount },
  });
};

