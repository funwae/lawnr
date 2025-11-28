import express from "express";
import { authenticate, authorize } from "../utils/auth.js";
import {
  getFAQs,
  getCategories,
  getFAQ,
  createFAQ,
  updateFAQ,
  deleteFAQ,
} from "../controllers/faq.controller.js";

const router = express.Router();

// Public routes
router.get("/", getFAQs);
router.get("/categories", getCategories);
router.get("/:id", getFAQ);

// Admin-only routes
router.use(authenticate);
router.use(authorize("admin"));

router.post("/", createFAQ);
router.put("/:id", updateFAQ);
router.delete("/:id", deleteFAQ);

export default router;

