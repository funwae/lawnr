import pool from '../../config/database.js';
import Expense from '../models/Expense.js';
import Invoice from '../models/Invoice.js';
import Job from '../models/Job.js';

/**
 * Calculate analytics for a contractor for a given period
 */
export const calculateContractorAnalytics = async (contractorId, startDate, endDate) => {
  try {
    // Get all jobs in period
    const jobs = await pool.query(
      `SELECT j.*, i.amount_total, i.platform_commission, i.contractor_payout
       FROM jobs j
       LEFT JOIN invoices i ON j.id = i.job_id
       WHERE j.contractor_id = $1
       AND j.created_at BETWEEN $2 AND $3
       ORDER BY j.created_at DESC`,
      [contractorId, startDate, endDate]
    );

    // Get all expenses in period
    const expenses = await Expense.findByContractor(contractorId, {
      startDate,
      endDate
    });

    // Calculate totals
    let totalRevenue = 0;
    let totalExpenses = 0;
    let jobsCompleted = 0;
    let jobsCancelled = 0;
    const jobValues = [];

    for (const job of jobs.rows) {
      if (job.status === 'completed' && job.contractor_payout) {
        totalRevenue += parseFloat(job.contractor_payout || 0);
        jobsCompleted++;
        jobValues.push(parseFloat(job.contractor_payout || 0));
      } else if (job.status === 'cancelled') {
        jobsCancelled++;
      }
    }

    for (const expense of expenses) {
      totalExpenses += parseFloat(expense.amount || 0);
    }

    const totalProfit = totalRevenue - totalExpenses;
    const averageJobValue = jobValues.length > 0
      ? jobValues.reduce((a, b) => a + b, 0) / jobValues.length
      : 0;

    // Calculate repeat customers
    const repeatCustomers = await pool.query(
      `SELECT COUNT(DISTINCT p.owner_id) as count
       FROM jobs j
       JOIN properties p ON j.property_id = p.id
       WHERE j.contractor_id = $1
       AND j.status = 'completed'
       AND j.created_at BETWEEN $2 AND $3
       AND p.owner_id IN (
         SELECT DISTINCT p2.owner_id
         FROM jobs j2
         JOIN properties p2 ON j2.property_id = p2.id
         WHERE j2.contractor_id = $1
         AND j2.status = 'completed'
         GROUP BY p2.owner_id
         HAVING COUNT(*) > 1
       )`,
      [contractorId, startDate, endDate]
    );

    // Expense breakdown by type
    const expenseBreakdown = await Expense.getTotalByContractor(contractorId, startDate, endDate);

    return {
      period: {
        start: startDate,
        end: endDate
      },
      revenue: {
        total: totalRevenue,
        average_per_job: averageJobValue
      },
      expenses: {
        total: totalExpenses,
        breakdown: expenseBreakdown
      },
      profit: {
        total: totalProfit,
        margin_percent: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
      },
      jobs: {
        completed: jobsCompleted,
        cancelled: jobsCancelled,
        total: jobs.rows.length
      },
      customers: {
        repeat: parseInt(repeatCustomers.rows[0]?.count || 0)
      }
    };
  } catch (error) {
    console.error('Error calculating analytics:', error);
    throw error;
  }
};

/**
 * Get monthly summary for contractor
 */
export const getMonthlySummary = async (contractorId, year, month) => {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  return await calculateContractorAnalytics(contractorId, startDate, endDate);
};

/**
 * Get weekly summary for contractor
 */
export const getWeeklySummary = async (contractorId, startDate) => {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  return await calculateContractorAnalytics(
    contractorId,
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  );
};

/**
 * Get top clients
 */
export const getTopClients = async (contractorId, limit = 10) => {
  const query = `
    SELECT
      u.id,
      u.full_name,
      p.address_line1,
      p.city,
      COUNT(j.id) as job_count,
      SUM(i.contractor_payout) as total_spent
    FROM jobs j
    JOIN properties p ON j.property_id = p.id
    JOIN users u ON p.owner_id = u.id
    LEFT JOIN invoices i ON j.id = i.job_id
    WHERE j.contractor_id = $1
    AND j.status = 'completed'
    GROUP BY u.id, u.full_name, p.address_line1, p.city
    ORDER BY total_spent DESC NULLS LAST
    LIMIT $2
  `;

  const result = await pool.query(query, [contractorId, limit]);
  return result.rows;
};

/**
 * Get revenue trends (daily/weekly/monthly)
 */
export const getRevenueTrends = async (contractorId, period = 'monthly', months = 6) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  let groupBy;
  switch (period) {
    case 'daily':
      groupBy = "DATE_TRUNC('day', j.created_at)";
      break;
    case 'weekly':
      groupBy = "DATE_TRUNC('week', j.created_at)";
      break;
    case 'monthly':
      groupBy = "DATE_TRUNC('month', j.created_at)";
      break;
    default:
      groupBy = "DATE_TRUNC('month', j.created_at)";
  }

  const query = `
    SELECT
      ${groupBy} as period,
      SUM(i.contractor_payout) as revenue,
      COUNT(j.id) as job_count
    FROM jobs j
    LEFT JOIN invoices i ON j.id = i.job_id
    WHERE j.contractor_id = $1
    AND j.status = 'completed'
    AND j.created_at >= $2
    GROUP BY ${groupBy}
    ORDER BY period ASC
  `;

  const result = await pool.query(query, [contractorId, startDate]);
  return result.rows;
};

