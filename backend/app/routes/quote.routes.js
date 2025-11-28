import express from 'express';
import { authenticate, authorize } from '../utils/auth.js';
import { createReQuote } from '../services/quote.service.js';

const router = express.Router();

router.use(authenticate);

// Re-quote endpoint for contractors
router.post('/:quoteId/re-quote', authorize('contractor', 'admin'), async (req, res, next) => {
  try {
    const { quoted_price, breakdown } = req.body;

    const newQuote = await createReQuote(
      req.params.quoteId,
      quoted_price,
      breakdown
    );

    res.status(201).json({ quote: newQuote });
  } catch (error) {
    next(error);
  }
});

export default router;

