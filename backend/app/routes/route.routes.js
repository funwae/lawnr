import express from "express";
import {
  getContractorJobRoute,
  optimizeJobRoute,
} from "../controllers/route.controller.js";
import { authenticate, authorize } from "../utils/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Optimize route (contractors only)
router.post("/optimize", authorize("contractor", "admin"), optimizeJobRoute);

// Get contractor's job route
router.get("/jobs", authorize("contractor", "admin"), getContractorJobRoute);

export default router;
