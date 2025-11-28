import pool from '../../config/database.js';

class PropertyMedia {
  static async create(mediaData) {
    const { property_id, media_type, media_url } = mediaData;

    const query = `
      INSERT INTO property_media (property_id, media_type, media_url)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await pool.query(query, [property_id, media_type, media_url]);
    return result.rows[0];
  }

  static async findByProperty(property_id) {
    const query = 'SELECT * FROM property_media WHERE property_id = $1 ORDER BY uploaded_at DESC';
    const result = await pool.query(query, [property_id]);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM property_media WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM property_media WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

export default PropertyMedia;

