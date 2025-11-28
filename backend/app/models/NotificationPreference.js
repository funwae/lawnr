import pool from '../../config/database.js';

class NotificationPreference {
  static async createOrUpdate(userId, preferences) {
    // Check if exists
    const existing = await pool.query(
      'SELECT id FROM notification_preferences WHERE user_id = $1',
      [userId]
    );

    if (existing.rows.length > 0) {
      // Update
      const fields = [];
      const values = [];
      let paramCount = 1;

      Object.keys(preferences).forEach((key) => {
        if (preferences[key] !== undefined) {
          fields.push(`${key} = $${paramCount}`);
          values.push(preferences[key]);
          paramCount++;
        }
      });

      if (fields.length === 0) {
        return this.findByUserId(userId);
      }

      fields.push(`updated_at = now()`);
      values.push(userId);

      const query = `
        UPDATE notification_preferences
        SET ${fields.join(', ')}
        WHERE user_id = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return result.rows[0];
    } else {
      // Create
      const {
        push_enabled,
        email_enabled,
        sms_enabled,
        email_address,
        phone_number,
        job_reminders,
        quote_notifications,
        payment_notifications,
        marketing_emails
      } = preferences;

      const query = `
        INSERT INTO notification_preferences (
          user_id, push_enabled, email_enabled, sms_enabled,
          email_address, phone_number, job_reminders, quote_notifications,
          payment_notifications, marketing_emails
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const result = await pool.query(query, [
        userId,
        push_enabled ?? true,
        email_enabled ?? true,
        sms_enabled ?? false,
        email_address,
        phone_number,
        job_reminders ?? true,
        quote_notifications ?? true,
        payment_notifications ?? true,
        marketing_emails ?? false
      ]);

      return result.rows[0];
    }
  }

  static async findByUserId(userId) {
    const query = 'SELECT * FROM notification_preferences WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }
}

export default NotificationPreference;

