import express from "express";
import {
  getAnalytics,
  getContractorDetail,
  getContractorDocuments,
  getContractors,
  getDashboard,
  getJobs,
  getSettings,
  getTransactions,
  updateSettings,
  verifyContractor,
} from "../controllers/admin.controller.js";
import {
  getDispute,
  getDisputes,
  resolveDispute,
} from "../controllers/dispute.controller.js";
import { authenticate, authorize } from "../utils/auth.js";

const router = express.Router();

// All admin routes require admin role
router.use(authenticate);
router.use(authorize("admin"));

router.get("/dashboard", getDashboard);
router.get("/analytics", getAnalytics);
router.get("/contractors", getContractors);
router.get("/contractors/:id", getContractorDetail);
router.post("/contractors/:id/verify", verifyContractor);
router.get("/contractors/:id/documents", getContractorDocuments);
router.get("/jobs", getJobs);
router.get("/transactions", getTransactions);
router.get("/disputes", getDisputes);
router.get("/disputes/:id", getDispute);
router.post("/disputes/:id/resolve", resolveDispute);
router.get("/settings", getSettings);
router.put("/settings", updateSettings);

export default router;
