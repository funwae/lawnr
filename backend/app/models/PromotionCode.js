import pool from '../../config/database.js';

class PromotionCode {
  static async create(codeData) {
    const {
      code,
      description,
      discount_type,
      discount_value,
      max_uses,
      min_order_value,
      valid_from,
      valid_until,
      applicable_to,
      applicable_service_types,
      created_by
    } = codeData;

    const query = `
      INSERT INTO promotion_codes (
        code, description, discount_type, discount_value, max_uses,
        min_order_value, valid_from, valid_until, applicable_to,
        applicable_service_types, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await pool.query(query, [
      code, description, discount_type, discount_value, max_uses,
      min_order_value, valid_from, valid_until, applicable_to,
      applicable_service_types, created_by
    ]);

    return result.rows[0];
  }

  static async findByCode(code) {
    const query = `
      SELECT * FROM promotion_codes
      WHERE code = $1
      AND is_active = TRUE
    `;
    const result = await pool.query(query, [code.toUpperCase()]);
    return result.rows[0];
  }

  static async validateCode(code, userId, orderValue, serviceTypes = []) {
    const promo = await this.findByCode(code);

    if (!promo) {
      return { valid: false, error: 'Promotion code not found' };
    }

    // Check dates
    const now = new Date();
    if (new Date(promo.valid_from) > now || new Date(promo.valid_until) < now) {
      return { valid: false, error: 'Promotion code has expired' };
    }

    // Check max uses
    if (promo.max_uses && promo.used_count >= promo.max_uses) {
      return { valid: false, error: 'Promotion code has reached maximum uses' };
    }

    // Check min order value
    if (promo.min_order_value && orderValue < promo.min_order_value) {
      return { valid: false, error: `Minimum order value of $${promo.min_order_value} required` };
    }

    // Check if user already used this code
    const previousUse = await pool.query(
      'SELECT id FROM promotion_code_usage WHERE promotion_code_id = $1 AND user_id = $2',
      [promo.id, userId]
    );
    if (previousUse.rows.length > 0) {
      return { valid: false, error: 'You have already used this promotion code' };
    }

    // Check applicable to
    if (promo.applicable_to && promo.applicable_to !== 'all') {
      // Would need to check user role or service types
    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.discount_type === 'percentage') {
      discountAmount = (orderValue * promo.discount_value) / 100;
    } else {
      discountAmount = Math.min(promo.discount_value, orderValue);
    }

    return {
      valid: true,
      promotion: promo,
      discount_amount: discountAmount
    };
  }

  static async applyCode(codeId, userId, invoiceId, discountAmount) {
    // Record usage
    await pool.query(
      `INSERT INTO promotion_code_usage (
        promotion_code_id, user_id, invoice_id, discount_amount
      )
      VALUES ($1, $2, $3, $4)`,
      [codeId, userId, invoiceId, discountAmount]
    );

    // Increment used count
    await pool.query(
      'UPDATE promotion_codes SET used_count = used_count + 1 WHERE id = $1',
      [codeId]
    );
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM promotion_codes WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.is_active !== undefined) {
      query += ` AND is_active = $${paramCount}`;
      params.push(filters.is_active);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }
}

export default PromotionCode;

