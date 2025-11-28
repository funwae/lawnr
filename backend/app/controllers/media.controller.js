import pool from '../../config/database.js';
import {
  upload,
  uploadToS3,
  uploadImageWithThumbnail,
  getFileType,
  deleteFromS3,
  compressVideo,
  generateVideoThumbnail,
} from '../services/media.service.js';
import { tmpdir } from 'os';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const uploadPropertyMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const { property_id } = req.params;
    const file = req.file;

    // Verify property ownership
    const propertyCheck = await pool.query(
      'SELECT owner_id FROM properties WHERE id = $1',
      [property_id]
    );

    if (propertyCheck.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Property not found' } });
    }

    if (propertyCheck.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    // Determine file type
    const mediaType = await getFileType(file.buffer);

    let mediaUrl;
    let thumbnailUrl = null;

    if (mediaType === 'photo') {
      // Upload image with thumbnail
      const result = await uploadImageWithThumbnail(
        file.buffer,
        file.originalname,
        `properties/${property_id}`
      );
      mediaUrl = result.url;
      thumbnailUrl = result.thumbnailUrl;
    } else {
      // Compress and upload video
      const tempDir = tmpdir();
      const inputPath = path.join(tempDir, `${uuidv4()}-input${path.extname(file.originalname)}`);
      const outputPath = path.join(tempDir, `${uuidv4()}-compressed.mp4`);

      try {
        const compressedBuffer = await compressVideo(file.buffer, inputPath, outputPath);
        mediaUrl = await uploadToS3(
          compressedBuffer,
          file.originalname,
          `properties/${property_id}`,
          'video/mp4'
        );
      } catch (error) {
        // Fallback to original if compression fails
        mediaUrl = await uploadToS3(
          file.buffer,
          file.originalname,
          `properties/${property_id}`,
          file.mimetype
        );
      }
    }

    // Save to database
    const result = await pool.query(
      `INSERT INTO property_media (property_id, media_type, media_url)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [property_id, mediaType, mediaUrl]
    );

    res.status(201).json({
      media: {
        ...result.rows[0],
        thumbnail_url: thumbnailUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadJobMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const { job_id } = req.params;
    const { type } = req.body; // 'before' or 'after'

    if (!type || !['before', 'after'].includes(type)) {
      return res.status(400).json({
        error: { message: 'Type must be "before" or "after"' },
      });
    }

    const file = req.file;

    // Verify job access
    const jobCheck = await pool.query(
      'SELECT contractor_id, property_id FROM jobs WHERE id = $1',
      [job_id]
    );

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Job not found' } });
    }

    const job = jobCheck.rows[0];

    // Only contractor can upload job media
    if (job.contractor_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    // Determine file type
    const mediaType = await getFileType(file.buffer);

    let mediaUrl;
    let thumbnailUrl = null;

    if (mediaType === 'photo') {
      const result = await uploadImageWithThumbnail(
        file.buffer,
        file.originalname,
        `jobs/${job_id}/${type}`
      );
      mediaUrl = result.url;
      thumbnailUrl = result.thumbnailUrl;
    } else {
      mediaUrl = await uploadToS3(
        file.buffer,
        file.originalname,
        `jobs/${job_id}/${type}`,
        file.mimetype
      );
    }

    // Update job media in database
    const currentJob = await pool.query(
      'SELECT before_media, after_media FROM jobs WHERE id = $1',
      [job_id]
    );

    const currentMedia = currentJob.rows[0][`${type}_media`] || [];
    const updatedMedia = [...currentMedia, mediaUrl];

    await pool.query(
      `UPDATE jobs SET ${type}_media = $1, updated_at = now() WHERE id = $2`,
      [JSON.stringify(updatedMedia), job_id]
    );

    res.status(201).json({
      media: {
        url: mediaUrl,
        thumbnail_url: thumbnailUrl,
        type: mediaType,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadContractorPortfolio = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const file = req.file;

    // Get contractor profile
    const profileCheck = await pool.query(
      'SELECT id FROM contractor_profiles WHERE user_id = $1',
      [req.user.id]
    );

    if (profileCheck.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Contractor profile not found' },
      });
    }

    const profileId = profileCheck.rows[0].id;

    // Upload image with thumbnail
    const result = await uploadImageWithThumbnail(
      file.buffer,
      file.originalname,
      `contractors/${profileId}/portfolio`
    );

    // Update contractor profile portfolio (stored as JSONB or separate table)
    // For now, we'll just return the URL - portfolio can be managed separately
    res.status(201).json({
      media: {
        url: result.url,
        thumbnail_url: result.thumbnailUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadRequestMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const { service_request_id } = req.body;
    const file = req.file;

    // Verify request ownership
    const requestCheck = await pool.query(
      'SELECT homeowner_id FROM service_requests WHERE id = $1',
      [service_request_id]
    );

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Service request not found' } });
    }

    if (requestCheck.rows[0].homeowner_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    // Determine file type
    const mediaType = await getFileType(file.buffer);
    const isVideo = mediaType === 'video';

    let mediaUrl;
    let thumbnailUrl = null;

    if (isVideo) {
      // Upload video
      mediaUrl = await uploadToS3(
        file.buffer,
        file.originalname,
        `requests/${service_request_id}/videos`,
        file.mimetype
      );
      // Generate thumbnail for video
      thumbnailUrl = await uploadImageWithThumbnail(
        file.buffer,
        `${file.originalname}-thumb`,
        `requests/${service_request_id}/thumbnails`
      ).then(r => r.thumbnailUrl).catch(() => null);
    } else {
      // Upload image with thumbnail
      const result = await uploadImageWithThumbnail(
        file.buffer,
        file.originalname,
        `requests/${service_request_id}/photos`
      );
      mediaUrl = result.url;
      thumbnailUrl = result.thumbnailUrl;
    }

    // Save to database
    const result = await pool.query(
      `INSERT INTO request_media (
        service_request_id, media_url, media_type, thumbnail_url, file_size, mime_type
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [service_request_id, mediaUrl, mediaType, thumbnailUrl, file.size, file.mimetype]
    );

    res.status(201).json({ media: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const deleteMedia = async (req, res, next) => {
  try {
    const { media_id } = req.params;
    const { type } = req.query; // 'property', 'request'

    let media;
    let ownershipCheck;

    if (type === 'request') {
      // Get request media
      const mediaCheck = await pool.query(
        'SELECT rm.*, sr.homeowner_id FROM request_media rm JOIN service_requests sr ON rm.service_request_id = sr.id WHERE rm.id = $1',
        [media_id]
      );

      if (mediaCheck.rows.length === 0) {
        return res.status(404).json({ error: { message: 'Media not found' } });
      }

      media = mediaCheck.rows[0];
      ownershipCheck = media.homeowner_id === req.user.id;
    } else {
      // Get property media
      const mediaCheck = await pool.query(
        'SELECT * FROM property_media WHERE id = $1',
        [media_id]
      );

      if (mediaCheck.rows.length === 0) {
        return res.status(404).json({ error: { message: 'Media not found' } });
      }

      media = mediaCheck.rows[0];

      // Verify ownership through property
      const propertyCheck = await pool.query(
        'SELECT owner_id FROM properties WHERE id = $1',
        [media.property_id]
      );

      ownershipCheck = propertyCheck.rows[0]?.owner_id === req.user.id;
    }

    if (!ownershipCheck) {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    // Delete from S3
    await deleteFromS3(media.media_url);
    if (media.thumbnail_url) {
      await deleteFromS3(media.thumbnail_url);
    }

    // Delete from database
    if (type === 'request') {
      await pool.query('DELETE FROM request_media WHERE id = $1', [media_id]);
    } else {
      await pool.query('DELETE FROM property_media WHERE id = $1', [media_id]);
    }

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Multer middleware export
export { upload };

