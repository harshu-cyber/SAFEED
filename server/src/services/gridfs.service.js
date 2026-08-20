// ============================================================
// SafeED-UP — GridFS Storage Service
// Handles binary PDF/Image file storage directly in MongoDB Atlas
// ============================================================
const mongoose = require('mongoose');
const { Readable } = require('stream');

class GridFSService {
  /**
   * Get or initialize GridFSBucket instance
   */
  getBucket() {
    if (!mongoose.connection.db) {
      throw new Error('Database connection is not established.');
    }
    return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'documents',
    });
  }

  /**
   * Upload binary file buffer to GridFS
   * @param {Buffer} buffer - File buffer
   * @param {string} filename - Original file name
   * @param {string} mimeType - File MIME type
   * @returns {Promise<Object>} GridFS File Object containing _id
   */
  uploadStream(buffer, filename, mimeType) {
    return new Promise((resolve, reject) => {
      const bucket = this.getBucket();
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);

      const uploadStream = bucket.openUploadStream(filename, {
        contentType: mimeType,
        metadata: {
          uploadedAt: new Date(),
          mimeType,
        },
      });

      readableStream
        .pipe(uploadStream)
        .on('error', (err) => reject(err))
        .on('finish', (file) => resolve(file));
    });
  }

  /**
   * Open download stream for GridFS file by ObjectId string
   * @param {string} fileId - GridFS file _id
   * @returns {GridFSBucketReadStream} Read stream
   */
  openDownloadStream(fileId) {
    const bucket = this.getBucket();
    const objectId = new mongoose.Types.ObjectId(fileId);
    return bucket.openDownloadStream(objectId);
  }

  /**
   * Find GridFS file metadata by ObjectId string
   * @param {string} fileId - GridFS file _id
   */
  async findFileById(fileId) {
    const bucket = this.getBucket();
    const objectId = new mongoose.Types.ObjectId(fileId);
    const files = await bucket.find({ _id: objectId }).toArray();
    return files.length > 0 ? files[0] : null;
  }

  /**
   * Delete GridFS file by ObjectId string
   * @param {string} fileId - GridFS file _id
   */
  async deleteFile(fileId) {
    const bucket = this.getBucket();
    const objectId = new mongoose.Types.ObjectId(fileId);
    await bucket.delete(objectId);
  }
}

module.exports = new GridFSService();
