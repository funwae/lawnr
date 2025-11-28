import pool from '../../config/database.js';

class PremiumListing {
  static async create(listingData) {
    const {
      contractor_id,
      listing_type,
      start_date,
      end_date,
      amount_paid,
      payment_status,
      stripe_payment_intent_id
    } = listingData;

    const query = `
      INSERT INTO premium_listing_subscriptions (
        contractor_id, listing_type, start_date, end_date,
        amount_paid, payment_status, stripe_payment_intent_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      contractor_id, listing_type, start_date, end_date,
      amount_paid, payment_status || 'pending', stripe_payment_intent_id
    ]);

    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM premium_listing_subscriptions WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByContractor(contractorId) {
    const query = `
      SELECT * FROM premium_listing_subscriptions
      WHERE contractor_id = $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [contractorId]);
    return result.rows;
  }

  static async findActiveByContractor(contractorId) {
    const query = `
      SELECT * FROM premium_listing_subscriptions
      WHERE contractor_id = $1
      AND end_date >= CURRENT_DATE
      AND payment_status = 'paid'
      ORDER BY end_date DESC
    `;
    const result = await pool.query(query, [contractorId]);
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
      UPDATE premium_listing_subscriptions
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findExpiringSoon(days = 7) {
    const query = `
      SELECT * FROM premium_listing_subscriptions
      WHERE end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + interval '${days} days'
      AND payment_status = 'paid'
      ORDER BY end_date ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

export default PremiumListing;

