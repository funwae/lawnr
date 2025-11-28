import pool from '../../config/database.js';

class SubscriptionService {
  static async create(serviceData) {
    const {
      subscription_id,
      service_request_id,
      job_id,
      scheduled_date,
      status
    } = serviceData;

    const query = `
      INSERT INTO subscription_services (
        subscription_id, service_request_id, job_id, scheduled_date, status
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [
      subscription_id, service_request_id, job_id, scheduled_date, status || 'pending'
    ]);

    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM subscription_services WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findBySubscription(subscriptionId) {
    const query = `
      SELECT * FROM subscription_services
      WHERE subscription_id = $1
      ORDER BY scheduled_date DESC
    `;
    const result = await pool.query(query, [subscriptionId]);
    return result.rows;
  }

  static async findByDateRange(startDate, endDate) {
    const query = `
      SELECT ss.*, s.homeowner_id, s.property_id, s.contractor_id, s.service_types
      FROM subscription_services ss
      JOIN subscriptions s ON ss.subscription_id = s.id
      WHERE ss.scheduled_date BETWEEN $1 AND $2
      AND ss.status = 'pending'
      ORDER BY ss.scheduled_date ASC
    `;
    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = now()`);
    values.push(id);

    const query = `
      UPDATE subscription_services
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async skip(id, reason) {
    return await this.update(id, {
      status: 'skipped',
      skipped_at: new Date(),
      skipped_reason: reason
    });
  }
}

export default SubscriptionService;

