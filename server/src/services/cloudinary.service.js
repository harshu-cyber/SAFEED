// ============================================================
// SafeED-UP — Cloudinary Storage Service
// Direct binary stream upload to Cloudinary CDN
// ============================================================
const cloudinary = require('cloudinary').v2;
const env = require('../config/env');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || env.CLOUDINARY_CLOUD_NAME || 'y2ddgstl',
  api_key: process.env.CLOUDINARY_API_KEY || env.CLOUDINARY_API_KEY || '165947677171223',
  api_secret: process.env.CLOUDINARY_API_SECRET || env.CLOUDINARY_API_SECRET || 'r3gLKOHVARO5epP1aFpdQeqZamc',
  secure: true,
});

class CloudinaryService {
  /**
   * Upload raw buffer to Cloudinary CDN
   * @param {Buffer} buffer
   * @param {string} originalName
   * @param {string} folder
   */
  async uploadFileBuffer(buffer, originalName, folder = 'safeed_documents', mimeType = 'application/pdf') {
    return new Promise((resolve, reject) => {
      const cleanFileName = originalName
        ? originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')
        : `doc_${Date.now()}`;

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: `${cleanFileName}_${Date.now()}`,
          resource_type: 'auto',
          type: 'upload',
          access_mode: 'public',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(new Error(`Cloudinary upload failed: ${error.message}`));
          }
          return resolve({
            url: result.secure_url,
            publicId: result.public_id,
            bytes: result.bytes,
            format: result.format,
            resourceType: result.resource_type,
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Delete file from Cloudinary CDN
   */
  async deleteFile(publicId, resourceType = 'raw') {
    try {
      if (!publicId) return;
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (err) {
      console.warn('Cloudinary delete warning:', err.message);
    }
  }
}

module.exports = new CloudinaryService();
