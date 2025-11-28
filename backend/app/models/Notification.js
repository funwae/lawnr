import pool from '../../config/database.js';

class Notification {
  static async create(notificationData) {
    const {
      user_id,
      job_id,
      type,
      payload,
      scheduled_for,
    } = notificationData;

    const query = `
      INSERT INTO notifications (user_id, job_id, type, payload, status, scheduled_for)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const status = scheduled_for && new Date(scheduled_for) > new Date()
      ? 'pending'
      : 'pending';

    const result = await pool.query(query, [
      user_id,
      job_id,
      type,
      payload ? JSON.stringify(payload) : null,
      status,
      scheduled_for || new Date(),
    ]);

    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM notifications WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByUser(user_id, { limit = 50, offset = 0, unreadOnly = false } = {}) {
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [user_id];
    let paramCount = 2;

    if (unreadOnly) {
      query += ` AND status != 'read'`;
    }

    query += ' ORDER BY created_at DESC LIMIT $' + paramCount + ' OFFSET $' + (paramCount + 1);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getUnreadCount(user_id) {
    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND status != 'read'
    `;
    const result = await pool.query(query, [user_id]);
    return parseInt(result.rows[0].count);
  }

  static async markAsRead(id, user_id) {
    const query = `
      UPDATE notifications
      SET status = 'read', updated_at = now()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [id, user_id]);
    return result.rows[0];
  }

  static async markAllAsRead(user_id) {
    const query = `
      UPDATE notifications
      SET status = 'read', updated_at = now()
      WHERE user_id = $1 AND status != 'read'
      RETURNING id
    `;
    const result = await pool.query(query, [user_id]);
    return result.rows;
  }

  static async findPending() {
    const query = `
      SELECT * FROM notifications
      WHERE status = 'pending'
      AND (scheduled_for IS NULL OR scheduled_for <= now())
      ORDER BY scheduled_for ASC
      LIMIT 100
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE notifications
      SET status = $1, updated_at = now()
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM notifications WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

export default Notification;

