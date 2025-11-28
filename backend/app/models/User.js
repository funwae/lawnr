import pool from '../../config/database.js';

class User {
  static async create(userData) {
    const { role, email, password_hash, full_name, phone_number } = userData;

    const query = `
      INSERT INTO users (role, email, password_hash, full_name, phone_number)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, role, email, full_name, phone_number, created_at, updated_at
    `;

    const result = await pool.query(query, [role, email, password_hash, full_name, phone_number]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, role, email, full_name, phone_number, created_at, updated_at FROM users WHERE id = $1';
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
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, role, email, full_name, phone_number, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

export default User;

