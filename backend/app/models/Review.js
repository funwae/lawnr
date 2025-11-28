import pool from '../../config/database.js';

class Review {
  static async create(reviewData) {
    const { job_id, homeowner_id, contractor_id, rating, review_text } = reviewData;

    const query = `
      INSERT INTO reviews (job_id, homeowner_id, contractor_id, rating, review_text)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [
      job_id, homeowner_id, contractor_id, rating, review_text
    ]);

    // Update contractor rating average
    await this.updateContractorRating(contractor_id);

    return result.rows[0];
  }

  static async findByContractor(contractor_id) {
    const query = `
      SELECT r.*, u.full_name as reviewer_name, j.id as job_id
      FROM reviews r
      JOIN users u ON r.homeowner_id = u.id
      JOIN jobs j ON r.job_id = j.id
      WHERE r.contractor_id = $1
      ORDER BY r.created_at DESC
    `;
    const result = await pool.query(query, [contractor_id]);
    return result.rows;
  }

  static async findByJobId(job_id) {
    const query = 'SELECT * FROM reviews WHERE job_id = $1';
    const result = await pool.query(query, [job_id]);
    return result.rows[0];
  }

  static async updateContractorRating(contractor_id) {
    // Calculate average rating and count
    const query = `
      SELECT AVG(rating) as avg_rating, COUNT(*) as rating_count
      FROM reviews
      WHERE contractor_id = $1
    `;
    const result = await pool.query(query, [contractor_id]);
    const { avg_rating, rating_count } = result.rows[0];

    // Update contractor profile
    const updateQuery = `
      UPDATE contractor_profiles
      SET rating_avg = $1, rating_count = $2, updated_at = now()
      WHERE user_id = $3
    `;
    await pool.query(updateQuery, [
      parseFloat(avg_rating) || null,
      parseInt(rating_count) || 0,
      contractor_id
    ]);
  }
}

export default Review;

