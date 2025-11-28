import express from 'express';
import { authenticate } from '../utils/auth.js';
import {
  getPreferences,
  updatePreferences
} from '../controllers/notification_preference.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getPreferences);
router.put('/', updatePreferences);

export default router;

