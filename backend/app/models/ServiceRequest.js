import pool from '../../config/database.js';

class ServiceRequest {
  static async create(requestData) {
    const {
      property_id,
      homeowner_id,
      requested_services,
      schedule_preference,
      preferred_date,
      preferred_time_from,
      preferred_time_to,
      notes
    } = requestData;

    const query = `
      INSERT INTO service_requests (
        property_id, homeowner_id, requested_services, schedule_preference,
        preferred_date, preferred_time_from, preferred_time_to, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(query, [
      property_id, homeowner_id, requested_services, schedule_preference,
      preferred_date, preferred_time_from, preferred_time_to, notes
    ]);

    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM service_requests WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByHomeowner(homeowner_id) {
    const query = 'SELECT * FROM service_requests WHERE homeowner_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [homeowner_id]);
    return result.rows;
  }

  static async findAvailable(contractorFilters) {
    // Find requests matching contractor's service area and service types
    // This is a simplified version - in production, would use PostGIS spatial queries
    const { service_types, lat, lon, radius_km } = contractorFilters;

    let query = `
      SELECT sr.*, p.geo_location
      FROM service_requests sr
      JOIN properties p ON sr.property_id = p.id
      WHERE sr.status = 'pending'
    `;
    const params = [];
    let paramCount = 1;

    if (service_types && service_types.length > 0) {
      query += ` AND sr.requested_services && $${paramCount}::text[]`;
      params.push(service_types);
      paramCount++;
    }

    query += ' ORDER BY sr.created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
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
      UPDATE service_requests
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

export default ServiceRequest;

