// Twilio SMS service
// Note: Requires twilio package and credentials

/**
 * Send SMS notification
 */
export const sendSMS = async (phoneNumber, message) => {
  try {
    // Uncomment when Twilio is configured
    /*
    const twilio = require('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    return { success: true, messageId: result.sid };
    */

    // Placeholder for now
    console.log(`SMS to ${phoneNumber}: ${message}`);
    return { success: true, messageId: 'placeholder' };
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};

/**
 * Send job reminder SMS
 */
export const sendJobReminderSMS = async (phoneNumber, jobDetails) => {
  const message = `Lawnr Reminder: Job scheduled for ${jobDetails.scheduled_date} at ${jobDetails.scheduled_time_from || 'TBD'}. Address: ${jobDetails.address}`;
  return await sendSMS(phoneNumber, message);
};

/**
 * Send quote received SMS
 */
export const sendQuoteReceivedSMS = async (phoneNumber, quoteDetails) => {
  const message = `New quote received: $${quoteDetails.quoted_price} from ${quoteDetails.contractor_name}. Log in to review.`;
  return await sendSMS(phoneNumber, message);
};

/**
 * Send payment confirmation SMS
 */
export const sendPaymentConfirmationSMS = async (phoneNumber, paymentDetails) => {
  const message = `Payment confirmed: $${paymentDetails.amount} for job ${paymentDetails.job_id}. Thank you!`;
  return await sendSMS(phoneNumber, message);
};

