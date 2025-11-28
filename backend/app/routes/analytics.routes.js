import express from "express";
import {
  exportExpensesCSV,
  exportRevenueCSV,
  getAnalytics,
  getMonthlyAnalytics,
  getRevenueTrendsData,
  getTopClientsList,
  getWeeklyAnalytics,
} from "../controllers/analytics.controller.js";
import { authenticate, authorize } from "../utils/auth.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize("contractor", "admin"));

router.get("/", getAnalytics);
router.get("/monthly", getMonthlyAnalytics);
router.get("/weekly", getWeeklyAnalytics);
router.get("/top-clients", getTopClientsList);
router.get("/revenue-trends", getRevenueTrendsData);
router.get("/export/revenue", exportRevenueCSV);
router.get("/export/expenses", exportExpensesCSV);

export default router;
