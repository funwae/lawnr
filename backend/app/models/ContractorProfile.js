import pool from '../../config/database.js';

class ContractorProfile {
  static async create(profileData) {
    const {
      user_id,
      business_name,
      business_logo_url,
      description,
      service_area,
      service_types,
      base_rate_per_hour,
      per_service_rate,
      availability
    } = profileData;

    // Format service_area as PostGIS geography if provided
    let serviceAreaGeom = null;
    if (service_area && service_area.center && service_area.radius_km) {
      // Create a circle using ST_Buffer
      const { lat, lon } = service_area.center;
      const radiusMeters = service_area.radius_km * 1000;
      serviceAreaGeom = `ST_Buffer(ST_MakePoint(${lon}, ${lat})::geography, ${radiusMeters})`;
    }

    const query = `
      INSERT INTO contractor_profiles (
        user_id, business_name, business_logo_url, description,
        service_area_geom, service_types, base_rate_per_hour,
        per_service_rate, availability
      )
      VALUES ($1, $2, $3, $4, ${serviceAreaGeom ? serviceAreaGeom + '::geography' : 'NULL'}, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(query, [
      user_id, business_name, business_logo_url, description,
      service_types, base_rate_per_hour, per_service_rate, availability
    ]);

    return result.rows[0];
  }

  static async findByUserId(user_id) {
    const query = 'SELECT * FROM contractor_profiles WHERE user_id = $1';
    const result = await pool.query(query, [user_id]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM contractor_profiles WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async search(filters) {
    const { service_types, lat, lon, radius_km, min_rating, premium_only } = filters;
    let query = 'SELECT * FROM contractor_profiles WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (service_types && service_types.length > 0) {
      query += ` AND service_types && $${paramCount}::text[]`;
      params.push(service_types);
      paramCount++;
    }

    if (lat && lon && radius_km) {
      query += ` AND ST_DWithin(
        service_area_geom,
        ST_MakePoint($${paramCount}, $${paramCount + 1})::geography,
        $${paramCount + 2} * 1000
      )`;
      params.push(lon, lat, radius_km);
      paramCount += 3;
    }

    if (min_rating) {
      query += ` AND rating_avg >= $${paramCount}`;
      params.push(min_rating);
      paramCount++;
    }

    if (premium_only) {
      query += ` AND premium_listing != 'none'`;
    }

    query += ' ORDER BY premium_listing DESC, rating_avg DESC NULLS LAST';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined && key !== 'service_area') {
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
      UPDATE contractor_profiles
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateByUserId(userId, updates) {
    const profile = await this.findByUserId(userId);
    if (!profile) {
      return null;
    }
    return await this.update(profile.id, updates);
  }
}

export default ContractorProfile;

