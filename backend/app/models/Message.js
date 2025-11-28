import pool from "../../config/database.js";

class Message {
  static async create(messageData) {
    const {
      ticket_id,
      user_id,
      message_text,
      media_url,
      message_type = "text",
    } = messageData;

    const query = `
      INSERT INTO messages (
        ticket_id, user_id, message_text, media_url, message_type
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [
      ticket_id,
      user_id,
      message_text,
      media_url,
      message_type,
    ]);

    return result.rows[0];
  }

  static async findById(id) {
    const query = "SELECT * FROM messages WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByTicket(ticketId) {
    const query = `
      SELECT m.*, u.full_name, u.role
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.ticket_id = $1
      ORDER BY m.created_at ASC
    `;
    const result = await pool.query(query, [ticketId]);
    return result.rows;
  }

  static async markAsRead(messageId, userId) {
    const query = `
      UPDATE messages
      SET read_at = now()
      WHERE id = $1 AND user_id != $2
    `;
    await pool.query(query, [messageId, userId]);
  }

  static async markTicketMessagesAsRead(ticketId, userId) {
    const query = `
      UPDATE messages
      SET read_at = now()
      WHERE ticket_id = $1 AND user_id != $2 AND read_at IS NULL
    `;
    await pool.query(query, [ticketId, userId]);
  }
}

export default Message;
