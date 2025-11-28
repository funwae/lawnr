import Expense from "../models/Expense.js";
import Invoice from "../models/Invoice.js";
import {
  calculateContractorAnalytics,
  getMonthlySummary,
  getRevenueTrends,
  getTopClients,
  getWeeklySummary,
} from "../services/analytics.service.js";
import { arrayToCSV, generateCSVFilename } from "../utils/csv_export.js";

export const getAnalytics = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        error: { message: "start_date and end_date are required" },
      });
    }

    const analytics = await calculateContractorAnalytics(
      req.user.id,
      start_date,
      end_date
    );

    res.json({ analytics });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyAnalytics = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    const analytics = await getMonthlySummary(req.user.id, year, month);
    res.json({ analytics });
  } catch (error) {
    next(error);
  }
};

export const getWeeklyAnalytics = async (req, res, next) => {
  try {
    const startDate = req.query.start_date
      ? new Date(req.query.start_date)
      : new Date();

    const analytics = await getWeeklySummary(req.user.id, startDate);
    res.json({ analytics });
  } catch (error) {
    next(error);
  }
};

export const getTopClientsList = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const clients = await getTopClients(req.user.id, limit);
    res.json({ clients });
  } catch (error) {
    next(error);
  }
};

export const getRevenueTrendsData = async (req, res, next) => {
  try {
    const period = req.query.period || "monthly";
    const months = parseInt(req.query.months) || 6;

    const trends = await getRevenueTrends(req.user.id, period, months);
    res.json({ trends });
  } catch (error) {
    next(error);
  }
};

export const exportRevenueCSV = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        error: { message: "start_date and end_date are required" },
      });
    }

    const invoices = await Invoice.findByUser(req.user.id, "contractor");

    // Filter by date range and payment status
    const filteredInvoices = invoices.filter((invoice) => {
      const invoiceDate = invoice.paid_at || invoice.issued_at;
      return (
        invoiceDate >= start_date &&
        invoiceDate <= end_date &&
        invoice.payment_status === "paid"
      );
    });

    const csvData = filteredInvoices.map((invoice) => ({
      date: invoice.paid_at || invoice.issued_at,
      job_id: invoice.job_id,
      amount: invoice.amount_total,
      commission: invoice.platform_commission,
      payout: invoice.contractor_payout,
      payment_method: invoice.payment_method,
    }));

    const csv = arrayToCSV(csvData, [
      "date",
      "job_id",
      "amount",
      "commission",
      "payout",
      "payment_method",
    ]);

    const filename = generateCSVFilename("revenue");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

export const exportExpensesCSV = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        error: { message: "start_date and end_date are required" },
      });
    }

    const expenses = await Expense.findByContractor(req.user.id, {
      startDate: start_date,
      endDate: end_date,
    });

    const csvData = expenses.map((expense) => ({
      date: expense.expense_date || expense.created_at,
      description: expense.description,
      amount: expense.amount,
      category: expense.expense_type || expense.category || "",
      job_id: expense.job_id || "",
    }));

    const csv = arrayToCSV(csvData, [
      "date",
      "description",
      "amount",
      "category",
      "job_id",
    ]);

    const filename = generateCSVFilename("expenses");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};
