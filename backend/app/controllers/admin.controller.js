import pool from "../../config/database.js";
import ContractorProfile from "../models/ContractorProfile.js";
import Dispute from "../models/Dispute.js";
import Job from "../models/Job.js";
import VerificationDocument from "../models/VerificationDocument.js";
import {
  getContractorList,
  getPlatformAnalytics,
} from "../services/admin.service.js";

export const getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth(), 0);

    const analytics = await getPlatformAnalytics(
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0]
    );

    // Get pending items
    const pendingVerifications = await VerificationDocument.findPending();
    const openDisputes = await Dispute.findAll({ status: "open" });

    res.json({
      analytics,
      pending: {
        verifications: pendingVerifications.length,
        disputes: openDisputes.length,
      },
      recent: {
        verifications: pendingVerifications.slice(0, 5),
        disputes: openDisputes.slice(0, 5),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getContractors = async (req, res, next) => {
  try {
    const filters = {
      is_verified:
        req.query.is_verified === "true"
          ? true
          : req.query.is_verified === "false"
          ? false
          : undefined,
      premium_listing: req.query.premium_listing,
      min_rating: req.query.min_rating,
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
    };

    const contractors = await getContractorList(filters);
    res.json({ contractors });
  } catch (error) {
    next(error);
  }
};

export const getContractorDetail = async (req, res, next) => {
  try {
    const profile = await ContractorProfile.findByUserId(req.params.id);

    if (!profile) {
      return res
        .status(404)
        .json({ error: { message: "Contractor not found" } });
    }

    // Get additional data
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [
      req.params.id,
    ]);
    const jobs = await Job.findByContractor(req.params.id);
    const documents = await VerificationDocument.findByContractor(
      req.params.id
    );

    res.json({
      contractor: {
        ...profile,
        user: user.rows[0],
        jobs: jobs.length,
        documents: documents.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getContractorDocuments = async (req, res, next) => {
  try {
    const documents = await VerificationDocument.findByContractor(
      req.params.id
    );
    res.json({ documents });
  } catch (error) {
    next(error);
  }
};

export const verifyContractor = async (req, res, next) => {
  try {
    const { document_id, status, review_notes } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: { message: "Invalid status" } });
    }

    const document = await VerificationDocument.findById(document_id);
    if (!document) {
      return res.status(404).json({ error: { message: "Document not found" } });
    }

    if (status === "approved") {
      await VerificationDocument.approve(
        document_id,
        req.user.id,
        review_notes
      );

      // Check if all required documents are approved, then verify contractor
      const allDocuments = await VerificationDocument.findByContractor(
        document.contractor_id
      );
      const requiredTypes = ["license", "insurance"];
      const approvedTypes = allDocuments
        .filter((d) => d.status === "approved")
        .map((d) => d.document_type);

      const hasAllRequired = requiredTypes.every((type) =>
        approvedTypes.includes(type)
      );

      if (hasAllRequired) {
        await ContractorProfile.updateByUserId(document.contractor_id, {
          is_verified: true,
        });
      }
    } else {
      await VerificationDocument.reject(document_id, req.user.id, review_notes);
    }

    const updated = await VerificationDocument.findById(document_id);
    res.json({ document: updated });
  } catch (error) {
    next(error);
  }
};

export const getJobs = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      contractor_id: req.query.contractor_id,
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
    };

    let query = "SELECT * FROM jobs WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.contractor_id) {
      query += ` AND contractor_id = $${paramCount}`;
      params.push(filters.contractor_id);
      paramCount++;
    }

    query += " ORDER BY created_at DESC";

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    res.json({ jobs: result.rows });
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const filters = {
      payment_status: req.query.payment_status,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
    };

    let query = "SELECT * FROM invoices WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (filters.payment_status) {
      query += ` AND payment_status = $${paramCount}`;
      params.push(filters.payment_status);
      paramCount++;
    }

    if (filters.start_date) {
      query += ` AND created_at >= $${paramCount}`;
      params.push(filters.start_date);
      paramCount++;
    }

    if (filters.end_date) {
      query += ` AND created_at <= $${paramCount}`;
      params.push(filters.end_date);
      paramCount++;
    }

    query += " ORDER BY created_at DESC";

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    res.json({ transactions: result.rows });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const startDate =
      req.query.start_date ||
      new Date(new Date().setMonth(new Date().getMonth() - 1))
        .toISOString()
        .split("T")[0];
    const endDate =
      req.query.end_date || new Date().toISOString().split("T")[0];

    const analytics = await getPlatformAnalytics(startDate, endDate);
    res.json({ analytics });
  } catch (error) {
    next(error);
  }
};

export const getSettings = async (req, res, next) => {
  try {
    const PlatformSettings = (await import("../models/PlatformSettings.js"))
      .default;
    const settings = await PlatformSettings.get();
    res.json({ settings });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const PlatformSettings = (await import("../models/PlatformSettings.js"))
      .default;
    const settings = await PlatformSettings.update(req.body.settings);
    res.json({ settings });
  } catch (error) {
    next(error);
  }
};
