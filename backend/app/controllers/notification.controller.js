import Notification from '../models/Notification.js';
import { createAndSendNotification } from '../services/notification.service.js';
import pool from '../../config/database.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, unread_only } = req.query;

    const notifications = await Notification.findByUser(req.user.id, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unread_only === 'true',
    });

    res.json({ notifications });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.markAsRead(
      req.params.id,
      req.user.id
    );

    if (!notification) {
      return res.status(404).json({ error: { message: 'Notification not found' } });
    }

    res.json({ notification });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.markAllAsRead(req.user.id);
    res.json({
      message: 'All notifications marked as read',
      count: result.length
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    // Verify ownership
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: { message: 'Notification not found' } });
    }

    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    await Notification.delete(req.params.id);
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const registerFCMToken = async (req, res, next) => {
  try {
    const { fcm_token } = req.body;

    if (!fcm_token) {
      return res.status(400).json({ error: { message: 'FCM token is required' } });
    }

    // Update user's FCM token
    const query = 'UPDATE users SET fcm_token = $1 WHERE id = $2 RETURNING id';
    const result = await pool.query(query, [fcm_token, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    res.json({ message: 'FCM token registered successfully' });
  } catch (error) {
    next(error);
  }
};

