const multer = require('multer');
const mongoose = require('mongoose');

// ✅ MongoDB Schema for Files
const FileSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  data: Buffer,
  contentType: String,
  size: Number,
  createdAt: { type: Date, default: Date.now }
});

const File = mongoose.model('File', FileSchema);

// ✅ Multer Memory Storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.mimetype === 'application/x-pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

// ✅ CREATE MULTER INSTANCE
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ✅ Save file to MongoDB
const saveFile = async (file) => {
  if (!file) return { id: null, name: '' };
  
  const newFile = new File({
    filename: Date.now() + '-' + Math.round(Math.random() * 1E9) + '.pdf',
    originalName: file.originalname,
    data: file.buffer,
    contentType: file.mimetype,
    size: file.size
  });
  
  await newFile.save();
  console.log('✅ File saved to MongoDB:', newFile._id);
  return { id: newFile._id, name: newFile.originalName };
};

// ✅ Upload file (alias for saveFile)
const uploadFile = saveFile;

// ✅ Get file from MongoDB
const getFile = async (fileId) => {
  return await File.findById(fileId);
};

// ✅ Delete file from MongoDB
const deleteFile = async (fileId) => {
  return await File.findByIdAndDelete(fileId);
};

// ✅ Error handling
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ 
        success: false, 
        error: 'File too large! Max size is 5MB.' 
      });
    }
    return res.status(400).json({ 
      success: false, 
      error: err.message 
    });
  } else if (err) {
    return res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
  next();
};

// ✅ EXPORT - upload must be first
module.exports = upload; // ✅ This makes upload.fields() work
module.exports.uploadFile = uploadFile;
module.exports.saveFile = saveFile;
module.exports.getFile = getFile;
module.exports.deleteFile = deleteFile;
module.exports.handleMulterError = handleMulterError;