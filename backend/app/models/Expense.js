import pool from '../../config/database.js';

class Expense {
  static async create(expenseData) {
    const {
      contractor_id,
      job_id,
      expense_type,
      description,
      amount,
      expense_date,
      receipt_url
    } = expenseData;

    const query = `
      INSERT INTO expenses (
        contractor_id, job_id, expense_type, description, amount, expense_date, receipt_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await pool.query(query, [
      contractor_id, job_id, expense_type, description, amount, expense_date || new Date(), receipt_url
    ]);

    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM expenses WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByContractor(contractorId, filters = {}) {
    let query = 'SELECT * FROM expenses WHERE contractor_id = $1';
    const params = [contractorId];
    let paramCount = 2;

    if (filters.startDate) {
      query += ` AND expense_date >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      query += ` AND expense_date <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    if (filters.expenseType) {
      query += ` AND expense_type = $${paramCount}`;
      params.push(filters.expenseType);
      paramCount++;
    }

    if (filters.jobId) {
      query += ` AND job_id = $${paramCount}`;
      params.push(filters.jobId);
      paramCount++;
    }

    query += ' ORDER BY expense_date DESC, created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findByJob(jobId) {
    const query = 'SELECT * FROM expenses WHERE job_id = $1 ORDER BY expense_date DESC';
    const result = await pool.query(query, [jobId]);
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
      UPDATE expenses
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM expenses WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getTotalByContractor(contractorId, startDate, endDate) {
    const query = `
      SELECT
        SUM(amount) as total,
        expense_type,
        COUNT(*) as count
      FROM expenses
      WHERE contractor_id = $1
      AND expense_date BETWEEN $2 AND $3
      GROUP BY expense_type
    `;
    const result = await pool.query(query, [contractorId, startDate, endDate]);
    return result.rows;
  }
}

export default Expense;

