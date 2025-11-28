import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { pipeline } from 'stream';
import sharp from 'sharp';
import { exec } from 'child_process';
import { promisify as promisifyNode } from 'util';

const execAsync = promisifyNode(exec);

const streamPipeline = promisify(pipeline);

// Configure AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'lawnr-media';

// Configure multer for file uploads
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF) and videos (MP4, MOV, AVI) are allowed.'));
    }
  },
});

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - File name
 * @param {string} folder - S3 folder path (e.g., 'properties', 'jobs', 'contractors')
 * @param {string} mimeType - MIME type
 * @returns {Promise<string>} - S3 URL
 */
export const uploadToS3 = async (fileBuffer, fileName, folder, mimeType) => {
  const fileExtension = path.extname(fileName);
  const uniqueFileName = `${uuidv4()}${fileExtension}`;
  const key = `${folder}/${uniqueFileName}`;

  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
    ACL: 'public-read', // Make files publicly accessible
  };

  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    // Construct public URL
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload file to storage');
  }
};

/**
 * Optimize image before upload
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {number} maxWidth - Maximum width
 * @param {number} quality - JPEG quality (1-100)
 * @returns {Promise<Buffer>} - Optimized image buffer
 */
export const optimizeImage = async (imageBuffer, maxWidth = 1920, quality = 85) => {
  try {
    const optimized = await sharp(imageBuffer)
      .resize(maxWidth, null, {
        withoutEnlargement: true,
        fit: 'inside',
      })
      .jpeg({ quality })
      .toBuffer();
    return optimized;
  } catch (error) {
    console.error('Error optimizing image:', error);
    // Return original if optimization fails
    return imageBuffer;
  }
};

/**
 * Generate thumbnail for image
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {number} size - Thumbnail size (square)
 * @returns {Promise<Buffer>} - Thumbnail buffer
 */
export const generateThumbnail = async (imageBuffer, size = 300) => {
  try {
    const thumbnail = await sharp(imageBuffer)
      .resize(size, size, {
        fit: 'cover',
      })
      .jpeg({ quality: 80 })
      .toBuffer();
    return thumbnail;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw error;
  }
};

/**
 * Upload image with optimization and thumbnail
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {string} fileName - Original file name
 * @param {string} folder - S3 folder path
 * @returns {Promise<{url: string, thumbnailUrl: string}>}
 */
export const uploadImageWithThumbnail = async (imageBuffer, fileName, folder) => {
  // Optimize main image
  const optimizedImage = await optimizeImage(imageBuffer);
  const imageUrl = await uploadToS3(optimizedImage, fileName, folder, 'image/jpeg');

  // Generate and upload thumbnail
  const thumbnail = await generateThumbnail(imageBuffer);
  const thumbnailFileName = `thumb_${path.basename(fileName, path.extname(fileName))}.jpg`;
  const thumbnailUrl = await uploadToS3(thumbnail, thumbnailFileName, `${folder}/thumbnails`, 'image/jpeg');

  return {
    url: imageUrl,
    thumbnailUrl: thumbnailUrl,
  };
};

/**
 * Delete file from S3
 * @param {string} url - S3 URL
 * @returns {Promise<void>}
 */
export const deleteFromS3 = async (url) => {
  try {
    // Extract key from URL
    const key = url.split(`/${BUCKET_NAME}/`)[1];
    if (!key) {
      throw new Error('Invalid S3 URL');
    }

    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error('Failed to delete file from storage');
  }
};

/**
 * Get file type from buffer
 * @param {Buffer} buffer - File buffer
 * @returns {Promise<string>} - File type ('photo' or 'video')
 */
export const getFileType = async (buffer) => {
  // Check file signature (magic numbers)
  const signature = buffer.toString('hex', 0, 4);

  // Image signatures
  if (signature.startsWith('ffd8')) return 'photo'; // JPEG
  if (signature.startsWith('8950')) return 'photo'; // PNG
  if (signature.startsWith('4749')) return 'photo'; // GIF

  // Video signatures
  if (signature.startsWith('0000') || buffer.toString('hex', 4, 8) === '66747970') return 'video'; // MP4
  if (signature.startsWith('464c56')) return 'video'; // FLV

  // Default to photo if uncertain
  return 'photo';
};

/**
 * Compress video using ffmpeg
 * @param {Buffer} videoBuffer - Original video buffer
 * @param {string} inputPath - Temporary input file path
 * @param {string} outputPath - Temporary output file path
 * @returns {Promise<Buffer>} - Compressed video buffer
 */
export const compressVideo = async (videoBuffer, inputPath, outputPath) => {
  try {
    // Write input file
    await fs.promises.writeFile(inputPath, videoBuffer);

    // Compress video using ffmpeg
    // -crf 28: Quality setting (lower = better quality, higher = smaller file)
    // -preset medium: Encoding speed vs compression
    // -vf scale: Scale to max 1080p
    const ffmpegCommand = `ffmpeg -i "${inputPath}" -c:v libx264 -crf 28 -preset medium -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" -c:a aac -b:a 128k -movflags +faststart "${outputPath}" -y`;

    await execAsync(ffmpegCommand);

    // Read compressed file
    const compressedBuffer = await fs.promises.readFile(outputPath);

    // Clean up temp files
    await fs.promises.unlink(inputPath).catch(() => {});
    await fs.promises.unlink(outputPath).catch(() => {});

    return compressedBuffer;
  } catch (error) {
    console.error('Error compressing video:', error);
    // Clean up temp files on error
    await fs.promises.unlink(inputPath).catch(() => {});
    await fs.promises.unlink(outputPath).catch(() => {});
    // Return original if compression fails
    return videoBuffer;
  }
};

/**
 * Generate video thumbnail using ffmpeg
 * @param {string} videoPath - Path to video file
 * @param {string} thumbnailPath - Output thumbnail path
 * @returns {Promise<Buffer>} - Thumbnail buffer
 */
export const generateVideoThumbnail = async (videoPath, thumbnailPath) => {
  try {
    // Extract frame at 1 second
    const ffmpegCommand = `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 -vf "scale=320:-1" "${thumbnailPath}" -y`;
    await execAsync(ffmpegCommand);

    const thumbnailBuffer = await fs.promises.readFile(thumbnailPath);
    await fs.promises.unlink(thumbnailPath).catch(() => {});

    return thumbnailBuffer;
  } catch (error) {
    console.error('Error generating video thumbnail:', error);
    throw error;
  }
};

