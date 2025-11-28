import pool from "../../config/database.js";

class Job {
  static async create(jobData) {
    const {
      quote_id,
      contractor_id,
      property_id,
      scheduled_date,
      scheduled_time_from,
      scheduled_time_to,
    } = jobData;

    const query = `
      INSERT INTO jobs (
        quote_id, contractor_id, property_id, scheduled_date,
        scheduled_time_from, scheduled_time_to
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      quote_id,
      contractor_id,
      property_id,
      scheduled_date,
      scheduled_time_from,
      scheduled_time_to,
    ]);

    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT j.*,
        p.address_line1, p.city, p.province, p.postal_code,
        u.full_name as contractor_name, u.email as contractor_email
      FROM jobs j
      JOIN properties p ON j.property_id = p.id
      JOIN users u ON j.contractor_id = u.id
      WHERE j.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByContractor(contractor_id, filters = {}) {
    let query = `
      SELECT j.*, p.address_line1, p.city, p.province, p.latitude, p.longitude
      FROM jobs j
      JOIN properties p ON j.property_id = p.id
      WHERE j.contractor_id = $1
    `;
    const params = [contractor_id];
    let paramCount = 2;

    if (filters.status) {
      query += ` AND j.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    query += ` ORDER BY j.scheduled_date DESC, j.created_at DESC`;
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findByHomeowner(homeowner_id) {
    const query = `
      SELECT j.*, p.address_line1, p.city, p.province,
        u.full_name as contractor_name
      FROM jobs j
      JOIN properties p ON j.property_id = p.id
      JOIN users u ON j.contractor_id = u.id
      WHERE p.owner_id = $1
      ORDER BY j.scheduled_date DESC, j.created_at DESC
    `;
    const result = await pool.query(query, [homeowner_id]);
    return result.rows;
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        if (key === "actual_start" || key === "actual_end") {
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
      UPDATE jobs
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

export default Job;
