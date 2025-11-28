import pool from '../../config/database.js';

class Dispute {
  static async create(disputeData) {
    const {
      job_id,
      raised_by,
      dispute_type,
      description
    } = disputeData;

    const query = `
      INSERT INTO disputes (
        job_id, raised_by, dispute_type, description
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [
      job_id, raised_by, dispute_type, description
    ]);

    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT d.*,
             j.id as job_id, j.status as job_status,
             u1.full_name as raised_by_name,
             u2.full_name as resolved_by_name
      FROM disputes d
      JOIN jobs j ON d.job_id = j.id
      JOIN users u1 ON d.raised_by = u1.id
      LEFT JOIN users u2 ON d.resolved_by = u2.id
      WHERE d.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT d.*,
             j.id as job_id, j.status as job_status,
             u1.full_name as raised_by_name,
             u2.full_name as resolved_by_name
      FROM disputes d
      JOIN jobs j ON d.job_id = j.id
      JOIN users u1 ON d.raised_by = u1.id
      LEFT JOIN users u2 ON d.resolved_by = u2.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND d.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.dispute_type) {
      query += ` AND d.dispute_type = $${paramCount}`;
      params.push(filters.dispute_type);
      paramCount++;
    }

    if (filters.raised_by) {
      query += ` AND d.raised_by = $${paramCount}`;
      params.push(filters.raised_by);
      paramCount++;
    }

    query += ' ORDER BY d.created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findByJob(jobId) {
    const query = 'SELECT * FROM disputes WHERE job_id = $1 ORDER BY created_at DESC';
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
      UPDATE disputes
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async resolve(id, resolvedBy, resolution) {
    return await this.update(id, {
      status: 'resolved',
      resolved_by: resolvedBy,
      resolved_at: new Date(),
      resolution: resolution
    });
  }
}

export default Dispute;

