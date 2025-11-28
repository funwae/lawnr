import pool from '../../config/database.js';

class Invoice {
  static async create(invoiceData) {
    const {
      job_id,
      homeowner_id,
      contractor_id,
      amount_total,
      platform_commission,
      contractor_payout,
      payment_method
    } = invoiceData;

    const query = `
      INSERT INTO invoices (
        job_id, homeowner_id, contractor_id, amount_total,
        platform_commission, contractor_payout, payment_method
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      job_id, homeowner_id, contractor_id, amount_total,
      platform_commission, contractor_payout, payment_method
    ]);

    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM invoices WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByJobId(job_id) {
    const query = 'SELECT * FROM invoices WHERE job_id = $1';
    const result = await pool.query(query, [job_id]);
    return result.rows[0];
  }

  static async findByUser(user_id, role) {
    const column = role === 'homeowner' ? 'homeowner_id' : 'contractor_id';
    const query = `SELECT * FROM invoices WHERE ${column} = $1 ORDER BY issued_at DESC`;
    const result = await pool.query(query, [user_id]);
    return result.rows;
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        if (key === 'paid_at') {
          fields.push(`${key} = now()`);
        } else {
          fields.push(`${key} = $${paramCount}`);
          values.push(updates[key]);
          paramCount++;
        }
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = now()`);
    values.push(id);

    const query = `
      UPDATE invoices
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

export default Invoice;

