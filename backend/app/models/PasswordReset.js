import pool from '../../config/database.js';
import { randomBytes } from 'crypto';

class PasswordReset {
  static async create(userId) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

    const query = `
      INSERT INTO password_resets (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await pool.query(query, [userId, token, expiresAt]);
    return result.rows[0];
  }

  static async findByToken(token) {
    const query = `
      SELECT pr.*, u.email, u.id as user_id
      FROM password_resets pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.token = $1 AND pr.used_at IS NULL AND pr.expires_at > now()
    `;
    const result = await pool.query(query, [token]);
    return result.rows[0];
  }

  static async markAsUsed(token) {
    const query = `
      UPDATE password_resets
      SET used_at = now()
      WHERE token = $1
      RETURNING *
    `;
    const result = await pool.query(query, [token]);
    return result.rows[0];
  }

  static async invalidateUserTokens(userId) {
    const query = `
      UPDATE password_resets
      SET used_at = now()
      WHERE user_id = $1 AND used_at IS NULL
    `;
    await pool.query(query, [userId]);
  }
}

export default PasswordReset;

