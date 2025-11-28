import NotificationPreference from '../models/NotificationPreference.js';

export const getPreferences = async (req, res, next) => {
  try {
    const prefs = await NotificationPreference.findByUserId(req.user.id);

    if (!prefs) {
      // Return defaults
      return res.json({
        preferences: {
          push_enabled: true,
          email_enabled: true,
          sms_enabled: false,
          job_reminders: true,
          quote_notifications: true,
          payment_notifications: true,
          marketing_emails: false
        }
      });
    }

    res.json({ preferences: prefs });
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (req, res, next) => {
  try {
    const preferences = await NotificationPreference.createOrUpdate(
      req.user.id,
      req.body
    );

    res.json({ preferences });
  } catch (error) {
    next(error);
  }
};

