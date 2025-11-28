import pool from '../../config/database.js';

class Subscription {
  static async create(subscriptionData) {
    const {
      homeowner_id,
      property_id,
      contractor_id,
      service_types,
      frequency,
      frequency_value,
      next_service_date,
      preferred_time_from,
      preferred_time_to,
      quoted_price,
      auto_accept_quote,
      notes
    } = subscriptionData;

    const query = `
      INSERT INTO subscriptions (
        homeowner_id, property_id, contractor_id, service_types, frequency,
        frequency_value, next_service_date, preferred_time_from, preferred_time_to,
        quoted_price, auto_accept_quote, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const result = await pool.query(query, [
      homeowner_id, property_id, contractor_id, service_types, frequency,
      frequency_value, next_service_date, preferred_time_from, preferred_time_to,
      quoted_price, auto_accept_quote, notes
    ]);

    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM subscriptions WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByHomeowner(homeownerId) {
    const query = `
      SELECT s.*, p.address_line1, p.city, p.province,
             u.full_name as contractor_name, cp.business_name
      FROM subscriptions s
      JOIN properties p ON s.property_id = p.id
      LEFT JOIN users u ON s.contractor_id = u.id
      LEFT JOIN contractor_profiles cp ON u.id = cp.user_id
      WHERE s.homeowner_id = $1
      ORDER BY s.next_service_date ASC
    `;
    const result = await pool.query(query, [homeownerId]);
    return result.rows;
  }

  static async findByContractor(contractorId) {
    const query = `
      SELECT s.*, p.address_line1, p.city, p.province,
             u.full_name as homeowner_name
      FROM subscriptions s
      JOIN properties p ON s.property_id = p.id
      JOIN users u ON s.homeowner_id = u.id
      WHERE s.contractor_id = $1 AND s.status = 'active'
      ORDER BY s.next_service_date ASC
    `;
    const result = await pool.query(query, [contractorId]);
    return result.rows;
  }

  static async findActiveForDate(date) {
    const query = `
      SELECT * FROM subscriptions
      WHERE status = 'active'
      AND next_service_date <= $1
      ORDER BY next_service_date ASC
    `;
    const result = await pool.query(query, [date]);
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
      UPDATE subscriptions
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async cancel(id, cancelledAt = new Date()) {
    return await this.update(id, {
      status: 'cancelled',
      cancelled_at: cancelledAt
    });
  }

  static async pause(id) {
    return await this.update(id, { status: 'paused' });
  }

  static async resume(id) {
    return await this.update(id, { status: 'active' });
  }
}

export default Subscription;

