import pool from '../../config/database.js';

class Referral {
  static async create(referralData) {
    const {
      referrer_id,
      referral_code
    } = referralData;

    const query = `
      INSERT INTO referrals (referrer_id, referral_code)
      VALUES ($1, $2)
      RETURNING *
    `;

    const result = await pool.query(query, [referrer_id, referral_code]);
    return result.rows[0];
  }

  static async findByCode(code) {
    const query = 'SELECT * FROM referrals WHERE referral_code = $1';
    const result = await pool.query(query, [code]);
    return result.rows[0];
  }

  static async findByReferrer(referrerId) {
    const query = `
      SELECT r.*, u.full_name as referred_name, u.email as referred_email
      FROM referrals r
      LEFT JOIN users u ON r.referred_id = u.id
      WHERE r.referrer_id = $1
      ORDER BY r.created_at DESC
    `;
    const result = await pool.query(query, [referrerId]);
    return result.rows;
  }

  static async complete(code, referredId) {
    const query = `
      UPDATE referrals
      SET referred_id = $1,
          status = 'completed',
          completed_at = now()
      WHERE referral_code = $2
      AND status = 'pending'
      RETURNING *
    `;
    const result = await pool.query(query, [referredId, code]);
    return result.rows[0];
  }

  static async reward(id, rewardType, rewardAmount) {
    return await pool.query(
      `UPDATE referrals
       SET status = 'rewarded',
           reward_type = $1,
           reward_amount = $2,
           rewarded_at = now()
       WHERE id = $3
       RETURNING *`,
      [rewardType, rewardAmount, id]
    ).then(r => r.rows[0]);
  }

  static generateCode(userId) {
    // Generate unique referral code: first 3 letters of user ID + random 5 chars
    const prefix = userId.substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${prefix}${random}`;
  }
}

export default Referral;

