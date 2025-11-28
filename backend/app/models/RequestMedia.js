import pool from '../../config/database.js';

class RequestMedia {
  static async create(mediaData) {
    const {
      service_request_id,
      media_url,
      media_type,
      thumbnail_url,
      file_size,
      mime_type
    } = mediaData;

    const query = `
      INSERT INTO request_media (
        service_request_id, media_url, media_type, thumbnail_url, file_size, mime_type
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      service_request_id, media_url, media_type, thumbnail_url, file_size, mime_type
    ]);

    return result.rows[0];
  }

  static async findByRequestId(service_request_id) {
    const query = 'SELECT * FROM request_media WHERE service_request_id = $1 ORDER BY created_at';
    const result = await pool.query(query, [service_request_id]);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM request_media WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM request_media WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async deleteByRequestId(service_request_id) {
    const query = 'DELETE FROM request_media WHERE service_request_id = $1 RETURNING *';
    const result = await pool.query(query, [service_request_id]);
    return result.rows;
  }
}

export default RequestMedia;

