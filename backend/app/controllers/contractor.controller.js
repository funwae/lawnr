import ContractorProfile from '../models/ContractorProfile.js';
import { uploadToS3, deleteFromS3 } from '../services/media.service.js';
import pool from '../../config/database.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

export const createContractorProfile = async (req, res, next) => {
  try {
    const profile = await ContractorProfile.create({
      ...req.body,
      user_id: req.user.id
    });

    res.status(201).json({ profile });
  } catch (error) {
    next(error);
  }
};

export const updateContractorProfile = async (req, res, next) => {
  try {
    const profile = await ContractorProfile.findByUserId(req.user.id);

    if (!profile) {
      return res.status(404).json({ error: { message: 'Profile not found' } });
    }

    const updated = await ContractorProfile.update(profile.id, req.body);
    res.json({ profile: updated });
  } catch (error) {
    next(error);
  }
};

export const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const profile = await ContractorProfile.findByUserId(req.user.id);

    if (!profile) {
      return res.status(404).json({ error: { message: 'Profile not found' } });
    }

    // Delete old logo if exists
    if (profile.business_logo_url) {
      try {
        await deleteFromS3(profile.business_logo_url);
      } catch (e) {
        console.error('Error deleting old logo:', e);
      }
    }

    // Upload new logo
    const logoUrl = await uploadToS3(
      req.file.buffer,
      `contractors/${req.user.id}/logo/${Date.now()}-${req.file.originalname}`,
      req.file.mimetype
    );

    // Update profile
    const updated = await ContractorProfile.update(profile.id, {
      business_logo_url: logoUrl
    });

    res.json({ profile: updated });
  } catch (error) {
    next(error);
  }
};

export const uploadPortfolioImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const profile = await ContractorProfile.findByUserId(req.user.id);

    if (!profile) {
      return res.status(404).json({ error: { message: 'Profile not found' } });
    }

    // Upload portfolio image
    const imageUrl = await uploadToS3(
      req.file.buffer,
      `contractors/${req.user.id}/portfolio/${Date.now()}-${req.file.originalname}`,
      req.file.mimetype
    );

    // Get current portfolio (stored as JSONB array or separate table)
    // For now, we'll return the URL and let frontend manage the array
    res.json({
      image_url: imageUrl,
      message: 'Portfolio image uploaded. Add to portfolio array in profile update.'
    });
  } catch (error) {
    next(error);
  }
};

export const getContractorProfile = async (req, res, next) => {
  try {
    const profile = await ContractorProfile.findByUserId(req.params.id || req.user.id);

    if (!profile) {
      return res.status(404).json({ error: { message: 'Profile not found' } });
    }

    // Get user info
    const user = await pool.query(
      'SELECT id, full_name, email FROM users WHERE id = $1',
      [profile.user_id]
    );

    res.json({
      profile: {
        ...profile,
        user: user.rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
};

export const searchContractors = async (req, res, next) => {
  try {
    const {
      service_types,
      lat,
      lon,
      radius_km = 20,
      min_rating,
      max_price
    } = req.query;

    // Build query
    let query = `
      SELECT
        cp.*,
        u.full_name,
        u.email,
        ST_Distance(
          cp.service_area_geom,
          ST_MakePoint($1, $2)::geography
        ) / 1000 as distance_km
      FROM contractor_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.service_area_geom IS NOT NULL
    `;
    const params = [lon || 0, lat || 0];
    let paramCount = 3;

    if (service_types) {
      const types = Array.isArray(service_types) ? service_types : [service_types];
      query += ` AND cp.service_types && $${paramCount}::text[]`;
      params.push(types);
      paramCount++;
    }

    if (min_rating) {
      query += ` AND cp.rating_avg >= $${paramCount}`;
      params.push(parseFloat(min_rating));
      paramCount++;
    }

    query += `
      AND ST_DWithin(
        cp.service_area_geom,
        ST_MakePoint($1, $2)::geography,
        $${paramCount} * 1000
      )
      ORDER BY distance_km ASC, cp.rating_avg DESC NULLS LAST
      LIMIT 50
    `;
    params.push(parseFloat(radius_km));

    const result = await pool.query(query, params);
    res.json({ contractors: result.rows });
  } catch (error) {
    next(error);
  }
};

export { upload };
