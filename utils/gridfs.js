const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path');

// ✅ GridFS Storage
const storage = new GridFsStorage({
  url: process.env.MONGODB_URI,
  file: (req, file) => {
    return {
      filename: Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname),
      bucketName: 'appointment_files' // ✅ Collection name
    };
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, error: err.message });
  } else if (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
  next();
};

module.exports = upload;
module.exports.handleMulterError = handleMulterError;