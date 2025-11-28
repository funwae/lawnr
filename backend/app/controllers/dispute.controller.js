import Dispute from '../models/Dispute.js';
import DisputeEvidence from '../models/DisputeEvidence.js';
import Job from '../models/Job.js';
import pool from '../../config/database.js';

export const createDispute = async (req, res, next) => {
  try {
    const { job_id, dispute_type, description } = req.body;

    // Verify user has access to this job
    const job = await Job.findById(job_id);
    if (!job) {
      return res.status(404).json({ error: { message: 'Job not found' } });
    }

    // Check if user is homeowner or contractor for this job
    const property = await pool.query(
      'SELECT owner_id FROM properties WHERE id = $1',
      [job.property_id]
    );

    const isHomeowner = property.rows[0]?.owner_id === req.user.id;
    const isContractor = job.contractor_id === req.user.id;

    if (!isHomeowner && !isContractor) {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    const dispute = await Dispute.create({
      job_id,
      raised_by: req.user.id,
      dispute_type,
      description
    });

    res.status(201).json({ dispute });
  } catch (error) {
    next(error);
  }
};

export const getDisputes = async (req, res, next) => {
  try {
    let disputes;

    if (req.user.role === 'admin') {
      // Admin can see all disputes
      disputes = await Dispute.findAll({
        status: req.query.status,
        dispute_type: req.query.dispute_type,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined
      });
    } else {
      // Users can only see disputes they're involved in
      const jobs = await pool.query(
        `SELECT j.id FROM jobs j
         LEFT JOIN properties p ON j.property_id = p.id
         WHERE j.contractor_id = $1 OR p.owner_id = $1`,
        [req.user.id]
      );

      const jobIds = jobs.rows.map(j => j.id);
      if (jobIds.length === 0) {
        disputes = [];
      } else {
        disputes = await pool.query(
          'SELECT * FROM disputes WHERE job_id = ANY($1) ORDER BY created_at DESC',
          [jobIds]
        );
        disputes = disputes.rows;
      }
    }

    // Attach evidence
    for (const dispute of disputes) {
      dispute.evidence = await DisputeEvidence.findByDispute(dispute.id);
    }

    res.json({ disputes });
  } catch (error) {
    next(error);
  }
};

export const getDispute = async (req, res, next) => {
  try {
    const dispute = await Dispute.findById(req.params.id);

    if (!dispute) {
      return res.status(404).json({ error: { message: 'Dispute not found' } });
    }

    // Verify access
    if (req.user.role !== 'admin') {
      const job = await Job.findById(dispute.job_id);
      const property = await pool.query(
        'SELECT owner_id FROM properties WHERE id = $1',
        [job.property_id]
      );

      const isHomeowner = property.rows[0]?.owner_id === req.user.id;
      const isContractor = job.contractor_id === req.user.id;

      if (!isHomeowner && !isContractor && dispute.raised_by !== req.user.id) {
        return res.status(403).json({ error: { message: 'Forbidden' } });
      }
    }

    dispute.evidence = await DisputeEvidence.findByDispute(dispute.id);

    res.json({ dispute });
  } catch (error) {
    next(error);
  }
};

export const addEvidence = async (req, res, next) => {
  try {
    const { media_url, evidence_type, description } = req.body;
    const dispute = await Dispute.findById(req.params.id);

    if (!dispute) {
      return res.status(404).json({ error: { message: 'Dispute not found' } });
    }

    // Verify access
    if (dispute.raised_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    const evidence = await DisputeEvidence.create({
      dispute_id: dispute.id,
      evidence_type,
      media_url,
      description,
      uploaded_by: req.user.id
    });

    res.status(201).json({ evidence });
  } catch (error) {
    next(error);
  }
};

export const resolveDispute = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Only admins can resolve disputes' } });
    }

    const { resolution } = req.body;
    const dispute = await Dispute.resolve(req.params.id, req.user.id, resolution);

    res.json({ dispute });
  } catch (error) {
    next(error);
  }
};

