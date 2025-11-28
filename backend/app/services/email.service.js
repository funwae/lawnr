import nodemailer from 'nodemailer';

// Configure email transporter (using Gmail as example, can be configured for other providers)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Send email notification
 */
export const sendEmail = async (to, subject, html, text = null) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send job reminder email
 */
export const sendJobReminderEmail = async (userEmail, userName, jobDetails) => {
  const subject = `Reminder: Job Scheduled for ${jobDetails.scheduled_date}`;
  const html = `
    <h2>Job Reminder</h2>
    <p>Hi ${userName},</p>
    <p>This is a reminder that you have a job scheduled:</p>
    <ul>
      <li><strong>Date:</strong> ${jobDetails.scheduled_date}</li>
      <li><strong>Time:</strong> ${jobDetails.scheduled_time_from || 'TBD'}</li>
      <li><strong>Address:</strong> ${jobDetails.address}</li>
    </ul>
    <p>Please be ready for the contractor's arrival.</p>
    <p>Best regards,<br>The Lawnr Team</p>
  `;

  return await sendEmail(userEmail, subject, html);
};

/**
 * Send quote received email
 */
export const sendQuoteReceivedEmail = async (userEmail, userName, quoteDetails) => {
  const subject = `New Quote Received - $${quoteDetails.quoted_price}`;
  const html = `
    <h2>New Quote Received</h2>
    <p>Hi ${userName},</p>
    <p>You have received a new quote from ${quoteDetails.contractor_name}:</p>
    <ul>
      <li><strong>Price:</strong> $${quoteDetails.quoted_price}</li>
      <li><strong>Services:</strong> ${quoteDetails.services?.join(', ') || 'N/A'}</li>
    </ul>
    <p>Log in to review and accept the quote.</p>
    <p>Best regards,<br>The Lawnr Team</p>
  `;

  return await sendEmail(userEmail, subject, html);
};

/**
 * Send payment confirmation email
 */
export const sendPaymentConfirmationEmail = async (userEmail, userName, paymentDetails) => {
  const subject = `Payment Confirmed - $${paymentDetails.amount}`;
  const html = `
    <h2>Payment Confirmed</h2>
    <p>Hi ${userName},</p>
    <p>Your payment has been confirmed:</p>
    <ul>
      <li><strong>Amount:</strong> $${paymentDetails.amount}</li>
      <li><strong>Job:</strong> ${paymentDetails.job_id}</li>
      <li><strong>Transaction ID:</strong> ${paymentDetails.transaction_id}</li>
    </ul>
    <p>Thank you for using Lawnr!</p>
    <p>Best regards,<br>The Lawnr Team</p>
  `;

  return await sendEmail(userEmail, subject, html);
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (userEmail, userName, userRole, referralCode = null) => {
  const subject = `Welcome to Lawnr!`;
  const html = `
    <h2>Welcome to Lawnr, ${userName}!</h2>
    <p>We're excited to have you on board.</p>
    ${referralCode ? `
      <p>Share your referral code <strong>${referralCode}</strong> with friends and earn rewards!</p>
    ` : ''}
    <p>Get started by ${userRole === 'homeowner' ? 'adding a property and requesting a service' : 'completing your contractor profile'}.</p>
    <p>Best regards,<br>The Lawnr Team</p>
  `;

  return await sendEmail(userEmail, subject, html);
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (userEmail, userName, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'https://app.lawnr.com'}/reset-password?token=${resetToken}`;
  const subject = 'Reset Your Lawnr Password';
  const html = `
    <h2>Password Reset Request</h2>
    <p>Hi ${userName},</p>
    <p>You requested to reset your password. Click the link below to reset it:</p>
    <p><a href="${resetUrl}" style="background-color: #00FF00; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
    <p>Or copy and paste this link into your browser:</p>
    <p>${resetUrl}</p>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
    <p>Best regards,<br>The Lawnr Team</p>
  `;

  return await sendEmail(userEmail, subject, html);
};

