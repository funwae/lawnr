import pool from '../../config/database.js';

class Property {
  static async create(propertyData) {
    const {
      owner_id,
      address_line1,
      address_line2,
      city,
      province,
      postal_code,
      country,
      geo_location,
      yard_size_estimate,
      yard_notes
    } = propertyData;

    // Format geo_location as PostGIS POINT
    const geoPoint = geo_location
      ? `POINT(${geo_location.lon} ${geo_location.lat})`
      : null;

    const query = `
      INSERT INTO properties (
        owner_id, address_line1, address_line2, city, province,
        postal_code, country, geo_location, yard_size_estimate, yard_notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::geography, $9, $10)
      RETURNING *
    `;

    const result = await pool.query(query, [
      owner_id, address_line1, address_line2, city, province,
      postal_code, country, geoPoint, yard_size_estimate, yard_notes
    ]);

    return result.rows[0];
  }

  static async findByOwner(owner_id) {
    const query = 'SELECT * FROM properties WHERE owner_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [owner_id]);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM properties WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined && key !== 'geo_location') {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    // Handle geo_location separately
    if (updates.geo_location) {
      const geoPoint = `POINT(${updates.geo_location.lon} ${updates.geo_location.lat})`;
      fields.push(`geo_location = $${paramCount}::geography`);
      values.push(geoPoint);
      paramCount++;
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = now()`);
    values.push(id);

    const query = `
      UPDATE properties
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM properties WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

export default Property;

