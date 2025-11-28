import express from "express";
import {
  getTicketMessages,
  sendMessage,
} from "../controllers/message.controller.js";
import { authenticate } from "../utils/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get("/ticket/:ticketId", getTicketMessages);
router.post("/", sendMessage);

export default router;
