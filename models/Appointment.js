const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentId: {
    type: String,
    unique: true,
    required: true
  },
  poNumber: {
    type: String,
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  ewayBill: {
    type: String,
    default: ''
  },
  docketNumber: {
    type: String,
    default: ''
  },
  asnNumber: {
    type: String,
    default: ''
  },
  contactPerson: {
    type: String,
    default: ''
  },
  contactNumber: {
    type: String,
    default: ''
  },
  // ===== FORWARDER FIELDS (ADMIN ONLY) =====
  forwarderName: {
    type: String,
    default: ''
  },
  forwarderLRNumber: {
    type: String,
    default: ''
  },
  // =========================================
  // ===== PDF FILE FIELDS =====
  // Store Cloudinary public_id
  poFile: {
    type: String,
    default: ''
  },
  // ✅ NEW: Store full Cloudinary URL for direct access
  poFileUrl: {
    type: String,
    default: ''
  },
  poFileOriginalName: {
    type: String,
    default: ''
  },
  // Store Cloudinary public_id
  invoiceFile: {
    type: String,
    default: ''
  },
  // ✅ NEW: Store full Cloudinary URL for direct access
  invoiceFileUrl: {
    type: String,
    default: ''
  },
  invoiceFileOriginalName: {
    type: String,
    default: ''
  },
  // Store Cloudinary public_id
  ewayBillFile: {
    type: String,
    default: ''
  },
  // ✅ NEW: Store full Cloudinary URL for direct access
  ewayBillFileUrl: {
    type: String,
    default: ''
  },
  ewayBillFileOriginalName: {
    type: String,
    default: ''
  },
  // ===== POD FILE FIELD (ADMIN ONLY) =====
  // Store Cloudinary public_id
  podFile: {
    type: String,
    default: ''
  },
  // ✅ NEW: Store full Cloudinary URL for direct access
  podFileUrl: {
    type: String,
    default: ''
  },
  podFileOriginalName: {
    type: String,
    default: ''
  },
  // =========================================
  deliveryDate: {
    type: Date,
    required: true
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  remarks: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// ============================================
// ✅ AUTO-UPDATE updatedAt ON SAVE
// ============================================
AppointmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// ============================================
// ✅ VIRTUAL: Get full Cloudinary URL
// ============================================
AppointmentSchema.virtual('poFileFullUrl').get(function() {
  if (!this.poFile) return '';
  if (this.poFileUrl) return this.poFileUrl;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/raw/upload/${this.poFile}`;
});

AppointmentSchema.virtual('invoiceFileFullUrl').get(function() {
  if (!this.invoiceFile) return '';
  if (this.invoiceFileUrl) return this.invoiceFileUrl;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/raw/upload/${this.invoiceFile}`;
});

AppointmentSchema.virtual('ewayBillFileFullUrl').get(function() {
  if (!this.ewayBillFile) return '';
  if (this.ewayBillFileUrl) return this.ewayBillFileUrl;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/raw/upload/${this.ewayBillFile}`;
});

AppointmentSchema.virtual('podFileFullUrl').get(function() {
  if (!this.podFile) return '';
  if (this.podFileUrl) return this.podFileUrl;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/raw/upload/${this.podFile}`;
});

// ============================================
// ✅ VIRTUAL: Get download URL with attachment
// ============================================
AppointmentSchema.virtual('poFileDownloadUrl').get(function() {
  if (!this.poFile) return '';
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/raw/upload/fl_attachment/${this.poFile}`;
});

AppointmentSchema.virtual('invoiceFileDownloadUrl').get(function() {
  if (!this.invoiceFile) return '';
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/raw/upload/fl_attachment/${this.invoiceFile}`;
});

AppointmentSchema.virtual('ewayBillFileDownloadUrl').get(function() {
  if (!this.ewayBillFile) return '';
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/raw/upload/fl_attachment/${this.ewayBillFile}`;
});

AppointmentSchema.virtual('podFileDownloadUrl').get(function() {
  if (!this.podFile) return '';
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/raw/upload/fl_attachment/${this.podFile}`;
});

// ============================================
// ✅ ENSURE VIRTUALS ARE INCLUDED IN JSON
// ============================================
AppointmentSchema.set('toJSON', { virtuals: true });
AppointmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);