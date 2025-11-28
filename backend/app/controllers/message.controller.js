import pool from "../../config/database.js";
import Dispute from "../models/Dispute.js";
import Message from "../models/Message.js";

/**
 * Get messages for a support ticket
 * GET /api/messages/ticket/:ticketId
 */
export const getTicketMessages = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    // Verify user has access to this ticket
    const dispute = await Dispute.findById(ticketId);
    if (!dispute) {
      return res.status(404).json({
        error: { message: "Ticket not found" },
      });
    }

    // Check access (user must be involved in the dispute or admin)
    if (req.user.role !== "admin") {
      const job = await pool.query("SELECT * FROM jobs WHERE id = $1", [
        dispute.job_id,
      ]);
      const property = await pool.query(
        "SELECT owner_id FROM properties WHERE id = $1",
        [job.rows[0]?.property_id]
      );

      const isHomeowner = property.rows[0]?.owner_id === req.user.id;
      const isContractor = job.rows[0]?.contractor_id === req.user.id;

      if (!isHomeowner && !isContractor && dispute.raised_by !== req.user.id) {
        return res.status(403).json({
          error: { message: "Forbidden" },
        });
      }
    }

    const messages = await Message.findByTicket(ticketId);

    // Mark messages as read
    await Message.markTicketMessagesAsRead(ticketId, req.user.id);

    res.json({ messages });
  } catch (error) {
    next(error);
  }
};

/**
 * Send a message in a support ticket
 * POST /api/messages
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { ticket_id, message_text, media_url, message_type } = req.body;

    if (!ticket_id || !message_text) {
      return res.status(400).json({
        error: { message: "ticket_id and message_text are required" },
      });
    }

    // Verify user has access to this ticket
    const dispute = await Dispute.findById(ticket_id);
    if (!dispute) {
      return res.status(404).json({
        error: { message: "Ticket not found" },
      });
    }

    // Check access
    if (req.user.role !== "admin") {
      const job = await pool.query("SELECT * FROM jobs WHERE id = $1", [
        dispute.job_id,
      ]);
      const property = await pool.query(
        "SELECT owner_id FROM properties WHERE id = $1",
        [job.rows[0]?.property_id]
      );

      const isHomeowner = property.rows[0]?.owner_id === req.user.id;
      const isContractor = job.rows[0]?.contractor_id === req.user.id;

      if (!isHomeowner && !isContractor && dispute.raised_by !== req.user.id) {
        return res.status(403).json({
          error: { message: "Forbidden" },
        });
      }
    }

    const message = await Message.create({
      ticket_id,
      user_id: req.user.id,
      message_text,
      media_url,
      message_type: message_type || "text",
    });

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
};
