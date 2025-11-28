import express from 'express';
import { authenticate, authorize } from '../utils/auth.js';
import {
  createProperty,
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty,
  getPropertyMedia
} from '../controllers/property.controller.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize('homeowner', 'admin'));

router.post('/', createProperty);
router.get('/', getProperties);
router.get('/:id', getProperty);
router.get('/:id/media', getPropertyMedia);
router.put('/:id', updateProperty);
router.delete('/:id', deleteProperty);

export default router;

