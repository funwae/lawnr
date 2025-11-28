import FAQ from '../models/FAQ.js';

/**
 * Get all FAQs (public endpoint)
 * GET /api/faqs?category=xxx&search=xxx
 */
export const getFAQs = async (req, res, next) => {
  try {
    const filters = {
      category: req.query.category,
      search: req.query.search,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const faqs = await FAQ.findAll(filters);
    res.json({ faqs });
  } catch (error) {
    next(error);
  }
};

/**
 * Get FAQ categories
 * GET /api/faqs/categories
 */
export const getCategories = async (req, res, next) => {
  try {
    const categories = await FAQ.getCategories();
    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

/**
 * Get FAQ by ID
 * GET /api/faqs/:id
 */
export const getFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) {
      return res.status(404).json({
        error: { message: 'FAQ not found' }
      });
    }
    res.json({ faq });
  } catch (error) {
    next(error);
  }
};

/**
 * Create FAQ (admin only)
 * POST /api/faqs
 */
export const createFAQ = async (req, res, next) => {
  try {
    const { category, question, answer, order } = req.body;

    if (!category || !question || !answer) {
      return res.status(400).json({
        error: { message: 'category, question, and answer are required' }
      });
    }

    const faq = await FAQ.create({ category, question, answer, order });
    res.status(201).json({ faq });
  } catch (error) {
    next(error);
  }
};

/**
 * Update FAQ (admin only)
 * PUT /api/faqs/:id
 */
export const updateFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.update(req.params.id, req.body);
    if (!faq) {
      return res.status(404).json({
        error: { message: 'FAQ not found' }
      });
    }
    res.json({ faq });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete FAQ (admin only)
 * DELETE /api/faqs/:id
 */
export const deleteFAQ = async (req, res, next) => {
  try {
    const faq = await FAQ.delete(req.params.id);
    if (!faq) {
      return res.status(404).json({
        error: { message: 'FAQ not found' }
      });
    }
    res.json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    next(error);
  }
};

