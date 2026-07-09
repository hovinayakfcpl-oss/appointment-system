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
// ✅ FIX 1: resource_type 'auto' for better compatibility
// ✅ FIX 2: access_mode: 'public' to fix 401 download error
// ✅ FIX 3: Store full URL for direct download
// ✅ FIX 4: Added .pdf extension to URL helpers
// ============================================
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'appointment_documents',
    resource_type: 'auto',
    format: 'pdf',
    access_mode: 'public', // ✅ MUST HAVE - Makes files publicly downloadable
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
// ✅ FIXED: HELPER: Get full Cloudinary URL with .pdf extension
// ============================================
const getCloudinaryFullUrl = (publicId) => {
  if (!publicId) return '';
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
    return publicId;
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  // ✅ Added .pdf extension
  return `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}.pdf`;
};

// ============================================
// ✅ FIXED: HELPER: Get download URL with attachment flag and .pdf extension
// ============================================
const getCloudinaryDownloadUrl = (publicId) => {
  if (!publicId) return '';
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
    return publicId;
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  // ✅ Added .pdf extension
  return `https://res.cloudinary.com/${cloudName}/raw/upload/fl_attachment/${publicId}.pdf`;
};

// ============================================
// HELPER: Get public URL for file
// ============================================
const getFileUrl = (publicId) => {
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: 'auto',
    format: 'pdf'
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
    format: 'pdf',
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
// ✅ NEW: HELPER: Check if file exists on Cloudinary
// ============================================
const fileExistsOnCloudinary = async (publicId) => {
  if (!publicId) return false;
  try {
    const url = getCloudinaryFullUrl(publicId);
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('❌ File check error:', error);
    return false;
  }
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
module.exports.fileExistsOnCloudinary = fileExistsOnCloudinary;