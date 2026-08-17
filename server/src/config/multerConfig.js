// ============================================================
// SafeED-UP — Multer File Upload Configuration
// ============================================================
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { ALLOWED_FILE_TYPES, ALLOWED_FILE_EXTENSIONS } = require('../constants/statusTypes');
const env = require('./env');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../', env.UPLOAD_DIR, 'documents'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  const isMimeAllowed = ALLOWED_FILE_TYPES.includes(file.mimetype);
  const isExtAllowed = ALLOWED_FILE_EXTENSIONS.includes(ext);

  if (isMimeAllowed && isExtAllowed) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type or extension. Only PDF, PNG, JPEG, and JPG are permitted.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
});

module.exports = upload;
