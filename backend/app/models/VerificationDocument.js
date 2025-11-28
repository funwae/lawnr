import pool from '../../config/database.js';

class VerificationDocument {
  static async create(documentData) {
    const {
      contractor_id,
      document_type,
      document_url,
      expires_at
    } = documentData;

    const query = `
      INSERT INTO verification_documents (
        contractor_id, document_type, document_url, expires_at
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [
      contractor_id, document_type, document_url, expires_at
    ]);

    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM verification_documents WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByContractor(contractorId) {
    const query = `
      SELECT * FROM verification_documents
      WHERE contractor_id = $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [contractorId]);
    return result.rows;
  }

  static async findPending() {
    const query = `
      SELECT vd.*, u.full_name as contractor_name, cp.business_name
      FROM verification_documents vd
      JOIN users u ON vd.contractor_id = u.id
      LEFT JOIN contractor_profiles cp ON u.id = cp.user_id
      WHERE vd.status = 'pending'
      ORDER BY vd.created_at ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findExpiringSoon(days = 30) {
    const query = `
      SELECT vd.*, u.full_name as contractor_name, cp.business_name
      FROM verification_documents vd
      JOIN users u ON vd.contractor_id = u.id
      LEFT JOIN contractor_profiles cp ON u.id = cp.user_id
      WHERE vd.status = 'approved'
      AND vd.expires_at BETWEEN CURRENT_DATE AND CURRENT_DATE + interval '${days} days'
      ORDER BY vd.expires_at ASC
    `;
    const result = await pool.query(query);
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
      UPDATE verification_documents
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async approve(id, reviewedBy, reviewNotes) {
    return await this.update(id, {
      status: 'approved',
      reviewed_by: reviewedBy,
      reviewed_at: new Date(),
      review_notes: reviewNotes
    });
  }

  static async reject(id, reviewedBy, reviewNotes) {
    return await this.update(id, {
      status: 'rejected',
      reviewed_by: reviewedBy,
      reviewed_at: new Date(),
      review_notes: reviewNotes
    });
  }
}

export default VerificationDocument;

