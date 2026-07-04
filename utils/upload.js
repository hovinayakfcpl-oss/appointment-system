const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================
// UPLOAD DIRECTORY SETUP
// ============================================
const uploadDir = path.join(__dirname, '../uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Uploads directory created at:', uploadDir);
}

// ============================================
// FILE FILTER - Only allow PDFs
// ============================================
const fileFilter = (req, file, cb) => {
  // Check if file is PDF
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

// ============================================
// STORAGE CONFIGURATION
// ============================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename: timestamp-random-originalname
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

// ============================================
// MULTER UPLOAD CONFIGURATION
// ============================================
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit per file
  }
});

// ============================================
// EXPORT
// ============================================
module.exports = upload;