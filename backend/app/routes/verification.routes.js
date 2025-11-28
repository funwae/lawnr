import express from 'express';
import { authenticate, authorize } from '../utils/auth.js';
import VerificationDocument from '../models/VerificationDocument.js';
import { uploadToS3 } from '../services/media.service.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

// Contractor uploads document
router.post('/upload', authorize('contractor', 'admin'), upload.single('document'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const { document_type, expires_at } = req.body;

    // Upload document
    const documentUrl = await uploadToS3(
      req.file.buffer,
      `verifications/${req.user.id}/${document_type}/${Date.now()}-${req.file.originalname}`,
      req.file.mimetype
    );

    const document = await VerificationDocument.create({
      contractor_id: req.user.id,
      document_type,
      document_url: documentUrl,
      expires_at: expires_at || null
    });

    res.status(201).json({ document });
  } catch (error) {
    next(error);
  }
});

// Get contractor's documents
router.get('/my-documents', authorize('contractor', 'admin'), async (req, res, next) => {
  try {
    const documents = await VerificationDocument.findByContractor(req.user.id);
    res.json({ documents });
  } catch (error) {
    next(error);
  }
});

// Admin gets pending documents
router.get('/pending', authorize('admin'), async (req, res, next) => {
  try {
    const documents = await VerificationDocument.findPending();
    res.json({ documents });
  } catch (error) {
    next(error);
  }
});

// Admin gets expiring documents
router.get('/expiring', authorize('admin'), async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const documents = await VerificationDocument.findExpiringSoon(days);
    res.json({ documents });
  } catch (error) {
    next(error);
  }
});

export default router;

