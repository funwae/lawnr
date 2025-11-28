import pool from '../../config/database.js';

class FAQ {
  static async create(faqData) {
    const {
      category,
      question,
      answer,
      order = 0
    } = faqData;

    const query = `
      INSERT INTO faqs (category, question, answer, "order")
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [category, question, answer, order]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM faqs WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM faqs WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.category) {
      query += ` AND category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    if (filters.search) {
      query += ` AND (question ILIKE $${paramCount} OR answer ILIKE $${paramCount})`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
      paramCount += 2;
    }

    query += ' ORDER BY "order" ASC, created_at ASC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findByCategory(category) {
    const query = `
      SELECT * FROM faqs
      WHERE category = $1
      ORDER BY "order" ASC, created_at ASC
    `;
    const result = await pool.query(query, [category]);
    return result.rows;
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        const dbKey = key === 'order' ? '"order"' : key;
        fields.push(`${dbKey} = $${paramCount}`);
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
      UPDATE faqs
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM faqs WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getCategories() {
    const query = 'SELECT DISTINCT category FROM faqs ORDER BY category';
    const result = await pool.query(query);
    return result.rows.map(row => row.category);
  }
}

export default FAQ;

