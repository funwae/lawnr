import pool from '../../config/database.js';

class DisputeEvidence {
  static async create(evidenceData) {
    const {
      dispute_id,
      evidence_type,
      media_url,
      description,
      uploaded_by
    } = evidenceData;

    const query = `
      INSERT INTO dispute_evidence (
        dispute_id, evidence_type, media_url, description, uploaded_by
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [
      dispute_id, evidence_type, media_url, description, uploaded_by
    ]);

    return result.rows[0];
  }

  static async findByDispute(disputeId) {
    const query = `
      SELECT de.*, u.full_name as uploaded_by_name
      FROM dispute_evidence de
      JOIN users u ON de.uploaded_by = u.id
      WHERE de.dispute_id = $1
      ORDER BY de.created_at ASC
    `;
    const result = await pool.query(query, [disputeId]);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM dispute_evidence WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM dispute_evidence WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

export default DisputeEvidence;

