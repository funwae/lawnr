import pool from '../../config/database.js';

class PlatformSettings {
  static async get() {
    const query = 'SELECT * FROM platform_settings ORDER BY key';
    const result = await pool.query(query);

    // Convert rows to key-value object
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = {
        value: row.value,
        type: row.type,
        description: row.description
      };
    });

    return settings;
  }

  static async set(key, value, type = 'string', description = '') {
    const query = `
      INSERT INTO platform_settings (key, value, type, description)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (key)
      DO UPDATE SET value = $2, updated_at = now()
      RETURNING *
    `;
    const result = await pool.query(query, [key, value, type, description]);
    return result.rows[0];
  }

  static async update(settings) {
    const updates = [];
    for (const [key, data] of Object.entries(settings)) {
      await this.set(key, data.value, data.type, data.description);
    }
    return this.get();
  }
}

export default PlatformSettings;

