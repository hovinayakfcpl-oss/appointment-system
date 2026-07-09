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
// ✅ FIX 1: Changed resource_type from 'image' to 'auto' for better compatibility
// ✅ FIX 2: Added access_mode: 'public' to fix 401 download error
// ✅ FIX 3: Store full URL for direct download
// ============================================
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'appointment_documents',
    resource_type: 'auto', // ✅ CHANGED: 'image' → 'auto' for better compatibility
    format: 'pdf',
    access_mode: 'public', // ✅ FIX: Makes files publicly downloadable
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
  
  // Allow PDF files
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
// HELPER: Get full Cloudinary URL for file
// ✅ NEW: Returns complete URL for direct access
// ============================================
const getCloudinaryFullUrl = (publicId) => {
  if (!publicId) return '';
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
    return publicId;
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}`;
};

// ============================================
// HELPER: Get download URL with attachment flag
// ✅ NEW: Returns URL with fl_attachment for force download
// ============================================
const getCloudinaryDownloadUrl = (publicId) => {
  if (!publicId) return '';
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
    return publicId;
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/raw/upload/fl_attachment/${publicId}`;
};

// ============================================
// HELPER: Get public URL for file
// ============================================
const getFileUrl = (publicId) => {
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: 'auto'
  });
};

// ============================================
// HELPER: Get signed URL for secure download
// ============================================
const getSignedUrl = (publicId, expiresInSeconds = 60) => {
  return cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    resource_type: 'auto',
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds
  });
};

// ============================================
// HELPER: Get PDF download URL with proper headers
// ============================================
const getPdfUrl = (publicId, options = {}) => {
  const { download = false, filename = null } = options;
  
  const url = cloudinary.url(publicId, {
    secure: true,
    resource_type: 'auto',
    format: 'pdf',
    flags: download ? 'attachment' : undefined,
    filename_override: filename || `${publicId}.pdf`
  });
  
  return url;
};

// ============================================
// EXPORT
// ============================================
module.exports = upload;
module.exports.handleMulterError = handleMulterError;
module.exports.getFileUrl = getFileUrl;
module.exports.getSignedUrl = getSignedUrl;
module.exports.getPdfUrl = getPdfUrl;
module.exports.getCloudinaryFullUrl = getCloudinaryFullUrl;
module.exports.getCloudinaryDownloadUrl = getCloudinaryDownloadUrl;