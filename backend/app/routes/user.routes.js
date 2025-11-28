import express from 'express';
import { authenticate } from '../utils/auth.js';
import { getMe, updateMe } from '../controllers/user.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/me', getMe);
router.put('/me', updateMe);

export default router;

