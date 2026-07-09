const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// ============================================
// CLOUDINARY CONFIG
// ============================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('✅ Cloudinary Config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'Not Set',
  api_key: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Not Set'
});

// ============================================
// STORAGE - Cloudinary (AUTO TYPE FOR PDF)
// ============================================
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'appointment_documents',
    resource_type: 'auto',
    format: 'pdf',
    access_mode: 'public',
    public_id: (req, file) => {
      const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
      console.log('📄 Cloudinary Public ID:', uniqueName);
      return uniqueName;
    }
  }
});

// ============================================
// FILE FILTER - Only allow PDFs
// ============================================
const fileFilter = (req, file, cb) => {
  console.log('📄 File received:', file.originalname);
  console.log('📄 File mimetype:', file.mimetype);
  
  if (file.mimetype === 'application/pdf' || file.mimetype === 'application/x-pdf') {
    console.log('✅ PDF file accepted:', file.originalname);
    cb(null, true);
  } else {
    console.log('❌ File rejected - Not a PDF:', file.originalname);
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

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
// ERROR HANDLING MIDDLEWARE
// ============================================
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      console.log('❌ File too large! Max size: 5MB');
      return res.status(400).json({ 
        success: false,
        error: 'File too large! Max size is 5MB.' 
      });
    }
    console.log('❌ Multer Error:', err.message);
    return res.status(400).json({ 
      success: false,
      error: err.message 
    });
  } else if (err) {
    console.log('❌ Unknown Error:', err.message);
    return res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
  next();
};

// ============================================
// ✅ SIMPLIFIED HELPER: Get full Cloudinary URL
// ============================================
const getCloudinaryFullUrl = (publicId) => {
  if (!publicId) return '';
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
    return publicId;
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}.pdf`;
};

// ============================================
// ✅ SIMPLIFIED HELPER: Get download URL with attachment flag
// ============================================
const getCloudinaryDownloadUrl = (publicId) => {
  if (!publicId) return '';
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
    return publicId;
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/raw/upload/fl_attachment/${publicId}.pdf`;
};

// ============================================
// ✅ HELPER: Get file URL (for EJS templates)
// ============================================
const getFileUrl = (publicId) => {
  if (!publicId) return '';
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
    return publicId;
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}.pdf`;
};

// ============================================
// ✅ HELPER: Get download URL (for EJS templates)
// ============================================
const getDownloadUrl = (publicId) => {
  if (!publicId) return '';
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
    return publicId;
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/raw/upload/fl_attachment/${publicId}.pdf`;
};

// ============================================
// ✅ NEW: Get file details from uploaded file
// ============================================
const getFileDetails = (file) => {
  if (!file) return { publicId: '', url: '', name: '' };
  const publicId = file.filename || file.path || '';
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const url = `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}.pdf`;
  return {
    publicId: publicId,
    url: url,
    name: file.originalname || ''
  };
};

// ============================================
// EXPORT
// ============================================
module.exports = upload;
module.exports.handleMulterError = handleMulterError;
module.exports.getFileUrl = getFileUrl;
module.exports.getDownloadUrl = getDownloadUrl;
module.exports.getCloudinaryFullUrl = getCloudinaryFullUrl;
module.exports.getCloudinaryDownloadUrl = getCloudinaryDownloadUrl;
module.exports.getFileDetails = getFileDetails;