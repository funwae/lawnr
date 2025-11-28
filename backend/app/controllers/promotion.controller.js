import PromotionCode from '../models/PromotionCode.js';

export const createPromotionCode = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    const promotion = await PromotionCode.create({
      ...req.body,
      code: req.body.code.toUpperCase(),
      created_by: req.user.id
    });

    res.status(201).json({ promotion });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: { message: 'Promotion code already exists' } });
    }
    next(error);
  }
};

export const validatePromotionCode = async (req, res, next) => {
  try {
    const { code, order_value, service_types } = req.body;

    const validation = await PromotionCode.validateCode(
      code,
      req.user.id,
      order_value || 0,
      service_types || []
    );

    if (!validation.valid) {
      return res.status(400).json({ error: { message: validation.error } });
    }

    res.json({
      valid: true,
      discount_amount: validation.discount_amount,
      promotion: validation.promotion
    });
  } catch (error) {
    next(error);
  }
};

export const getPromotionCodes = async (req, res, next) => {
  try {
    const filters = {
      is_active: req.query.active !== 'false',
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const codes = await PromotionCode.findAll(filters);
    res.json({ codes });
  } catch (error) {
    next(error);
  }
};

