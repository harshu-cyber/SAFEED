// ============================================================
// SafeED-UP — Multer File Upload Configuration
// ============================================================
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { ALLOWED_FILE_TYPES, ALLOWED_FILE_EXTENSIONS } = require('../constants/statusTypes');
const env = require('./env');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!file || !file.originalname) {
    return cb(null, false);
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const isExtAllowed = ALLOWED_FILE_EXTENSIONS.includes(ext);

  const mime = (file.mimetype || '').toLowerCase();
  const isMimeAllowed =
    ALLOWED_FILE_TYPES.includes(mime) ||
    mime.includes('pdf') ||
    mime.includes('image') ||
    mime.includes('octet-stream');

  if (isExtAllowed || isMimeAllowed) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type or extension. Only PDF, PNG, JPEG, and JPG are permitted.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: (env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024,
  },
});

module.exports = upload;
