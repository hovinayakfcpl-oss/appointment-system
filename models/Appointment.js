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
  // ===== MONGODB FILE FIELDS (GridFS) =====
  // PO File
  poFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null
  },
  poFileOriginalName: {
    type: String,
    default: ''
  },
  // Invoice File
  invoiceFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null
  },
  invoiceFileOriginalName: {
    type: String,
    default: ''
  },
  // E-Way Bill File
  ewayBillFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null
  },
  ewayBillFileOriginalName: {
    type: String,
    default: ''
  },
  // POD File (Admin Only)
  podFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null
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
// ✅ VIRTUAL: Get File URL
// ============================================
AppointmentSchema.virtual('poFileUrl').get(function() {
  if (!this.poFileId) return null;
  return `/file/${this.poFileId}`;
});

AppointmentSchema.virtual('invoiceFileUrl').get(function() {
  if (!this.invoiceFileId) return null;
  return `/file/${this.invoiceFileId}`;
});

AppointmentSchema.virtual('ewayBillFileUrl').get(function() {
  if (!this.ewayBillFileId) return null;
  return `/file/${this.ewayBillFileId}`;
});

AppointmentSchema.virtual('podFileUrl').get(function() {
  if (!this.podFileId) return null;
  return `/file/${this.podFileId}`;
});

// ============================================
// ✅ VIRTUAL: Get Download URL
// ============================================
AppointmentSchema.virtual('poFileDownloadUrl').get(function() {
  if (!this.poFileId) return null;
  return `/file/${this.poFileId}/download`;
});

AppointmentSchema.virtual('invoiceFileDownloadUrl').get(function() {
  if (!this.invoiceFileId) return null;
  return `/file/${this.invoiceFileId}/download`;
});

AppointmentSchema.virtual('ewayBillFileDownloadUrl').get(function() {
  if (!this.ewayBillFileId) return null;
  return `/file/${this.ewayBillFileId}/download`;
});

AppointmentSchema.virtual('podFileDownloadUrl').get(function() {
  if (!this.podFileId) return null;
  return `/file/${this.podFileId}/download`;
});

// ============================================
// ✅ ENSURE VIRTUALS ARE INCLUDED IN JSON
// ============================================
AppointmentSchema.set('toJSON', { virtuals: true });
AppointmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);