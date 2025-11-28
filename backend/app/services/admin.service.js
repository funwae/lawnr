import pool from '../../config/database.js';
import Job from '../models/Job.js';
import Invoice from '../models/Invoice.js';
import User from '../models/User.js';
import ContractorProfile from '../models/ContractorProfile.js';
import ServiceRequest from '../models/ServiceRequest.js';

/**
 * Get platform-wide analytics
 */
export const getPlatformAnalytics = async (startDate, endDate) => {
  try {
    // Active users
    const activeUsers = await pool.query(
      `SELECT
        COUNT(DISTINCT CASE WHEN role = 'homeowner' THEN id END) as active_homeowners,
        COUNT(DISTINCT CASE WHEN role = 'contractor' THEN id END) as active_contractors,
        COUNT(DISTINCT id) as total_active_users
      FROM users
      WHERE created_at BETWEEN $1 AND $2`,
      [startDate, endDate]
    );

    // Job volume
    const jobVolume = await pool.query(
      `SELECT
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_jobs,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_jobs,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completion_rate
      FROM jobs
      WHERE created_at BETWEEN $1 AND $2`,
      [startDate, endDate]
    );

    // Revenue tracking
    const revenue = await pool.query(
      `SELECT
        SUM(amount_total) as total_revenue,
        SUM(platform_commission) as total_commission,
        SUM(contractor_payout) as total_payouts,
        COUNT(*) as total_transactions
      FROM invoices
      WHERE created_at BETWEEN $1 AND $2
      AND payment_status = 'paid'`,
      [startDate, endDate]
    );

    // Popular services
    const popularServices = await pool.query(
      `SELECT
        unnest(requested_services) as service_type,
        COUNT(*) as request_count
      FROM service_requests
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY service_type
      ORDER BY request_count DESC
      LIMIT 10`,
      [startDate, endDate]
    );

    // Average order value
    const avgOrderValue = await pool.query(
      `SELECT
        AVG(amount_total) as avg_order_value,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount_total) as median_order_value
      FROM invoices
      WHERE created_at BETWEEN $1 AND $2
      AND payment_status = 'paid'`,
      [startDate, endDate]
    );

    // Contractor earnings
    const contractorEarnings = await pool.query(
      `SELECT
        contractor_id,
        SUM(contractor_payout) as total_earnings,
        COUNT(*) as job_count
      FROM invoices
      WHERE created_at BETWEEN $1 AND $2
      AND payment_status = 'paid'
      GROUP BY contractor_id
      ORDER BY total_earnings DESC
      LIMIT 10`,
      [startDate, endDate]
    );

    // Repeat rate
    const repeatRate = await pool.query(
      `SELECT
        COUNT(DISTINCT p.owner_id) as total_customers,
        COUNT(DISTINCT CASE WHEN customer_jobs.job_count > 1 THEN p.owner_id END) as repeat_customers
      FROM properties p
      LEFT JOIN (
        SELECT property_id, COUNT(*) as job_count
        FROM jobs
        WHERE created_at BETWEEN $1 AND $2
        AND status = 'completed'
        GROUP BY property_id
      ) customer_jobs ON p.id = customer_jobs.property_id`,
      [startDate, endDate]
    );

    return {
      users: activeUsers.rows[0],
      jobs: jobVolume.rows[0],
      revenue: revenue.rows[0],
      popular_services: popularServices.rows,
      order_value: avgOrderValue.rows[0],
      top_contractors: contractorEarnings.rows,
      repeat_rate: repeatRate.rows[0]
    };
  } catch (error) {
    console.error('Error getting platform analytics:', error);
    throw error;
  }
};

/**
 * Get contractor list with filters
 */
export const getContractorList = async (filters = {}) => {
  try {
    let query = `
      SELECT
        cp.*,
        u.full_name,
        u.email,
        u.created_at as user_created_at,
        COUNT(DISTINCT j.id) as total_jobs,
        COUNT(DISTINCT CASE WHEN j.status = 'completed' THEN j.id END) as completed_jobs,
        SUM(CASE WHEN i.payment_status = 'paid' THEN i.contractor_payout ELSE 0 END) as total_earnings
      FROM contractor_profiles cp
      JOIN users u ON cp.user_id = u.id
      LEFT JOIN jobs j ON cp.user_id = j.contractor_id
      LEFT JOIN invoices i ON j.id = i.job_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.is_verified !== undefined) {
      query += ` AND cp.is_verified = $${paramCount}`;
      params.push(filters.is_verified);
      paramCount++;
    }

    if (filters.premium_listing) {
      query += ` AND cp.premium_listing = $${paramCount}`;
      params.push(filters.premium_listing);
      paramCount++;
    }

    if (filters.min_rating) {
      query += ` AND cp.rating_avg >= $${paramCount}`;
      params.push(parseFloat(filters.min_rating));
      paramCount++;
    }

    query += `
      GROUP BY cp.id, u.id
      ORDER BY cp.created_at DESC
    `;

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error getting contractor list:', error);
    throw error;
  }
};

/**
 * Suspend or remove contractor
 */
export const suspendContractor = async (contractorId, reason, suspendedBy) => {
  try {
    // Update user status (we'd need to add a status field to users table)
    // For now, we can add a suspended flag to contractor profile
    await ContractorProfile.updateByUserId(contractorId, {
      // Add suspended_at timestamp or similar
    });

    // Log the suspension
    await pool.query(
      `INSERT INTO admin_actions (admin_id, action_type, target_id, details)
       VALUES ($1, 'suspend_contractor', $2, $3)`,
      [suspendedBy, contractorId, JSON.stringify({ reason })]
    );

    return { success: true };
  } catch (error) {
    console.error('Error suspending contractor:', error);
    throw error;
  }
};

