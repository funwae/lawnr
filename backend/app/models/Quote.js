import pool from '../../config/database.js';

class Quote {
  static async create(quoteData) {
    const {
      service_request_id,
      contractor_id,
      quoted_price,
      breakdown,
      valid_until
    } = quoteData;

    const query = `
      INSERT INTO quotes (
        service_request_id, contractor_id, quoted_price, breakdown, valid_until
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [
      service_request_id, contractor_id, quoted_price, breakdown, valid_until
    ]);

    return result.rows[0];
  }

  static async findByRequestId(service_request_id) {
    const query = `
      SELECT q.*, u.full_name as contractor_name, cp.business_name
      FROM quotes q
      JOIN users u ON q.contractor_id = u.id
      LEFT JOIN contractor_profiles cp ON u.id = cp.user_id
      WHERE q.service_request_id = $1 AND q.status = 'pending'
      ORDER BY q.created_at DESC
    `;
    const result = await pool.query(query, [service_request_id]);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM quotes WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
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
      UPDATE quotes
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

export default Quote;
