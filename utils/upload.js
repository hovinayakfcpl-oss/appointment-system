const multer = require('multer');
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
// MULTER - Memory Storage (No local files)
// ============================================
const storage = multer.memoryStorage();

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
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// ============================================
// ✅ CLOUDINARY UPLOAD FUNCTION - FORCES IMAGE TYPE
// ============================================
const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'appointment_documents',
      resource_type: 'image', // ✅ FORCED IMAGE
      format: 'pdf',
      access_mode: 'public',
      use_filename: true,
      unique_filename: true,
      public_id: options.publicId || undefined
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('✅ Cloudinary upload success:', result.public_id);
          resolve(result);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// ============================================
// ✅ HELPER: Upload single file and return details
// ============================================
const uploadFile = async (file) => {
  if (!file) return { publicId: '', url: '', name: '' };
  
  try {
    const result = await uploadToCloudinary(file.buffer, {
      folder: 'appointment_documents',
      publicId: Date.now() + '-' + Math.round(Math.random() * 1E9)
    });
    
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const url = `https://res.cloudinary.com/${cloudName}/image/upload/${result.public_id}.pdf`;
    
    return {
      publicId: result.public_id,
      url: url,
      name: file.originalname || ''
    };
  } catch (error) {
    console.error('❌ Upload error:', error);
    return { publicId: '', url: '', name: '' };
  }
};

// ============================================
// ✅ HELPER: Upload multiple files
// ============================================
const uploadMultipleFiles = async (files) => {
  const results = {};
  const fileMap = {
    poFile: 'poFile',
    invoiceFile: 'invoiceFile',
    ewayBillFile: 'ewayBillFile',
    podFile: 'podFile'
  };
  
  for (const [key, fieldName] of Object.entries(fileMap)) {
    if (files[fieldName] && files[fieldName][0]) {
      results[fieldName] = await uploadFile(files[fieldName][0]);
    } else {
      results[fieldName] = { publicId: '', url: '', name: '' };
    }
  }
  
  return results;
};

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
// EXPORT
// ============================================
module.exports = upload;
module.exports.handleMulterError = handleMulterError;
module.exports.uploadToCloudinary = uploadToCloudinary;
module.exports.uploadFile = uploadFile;
module.exports.uploadMultipleFiles = uploadMultipleFiles;