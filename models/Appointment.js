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
  poFile: {
    type: String,
    default: ''
  },
  poFileOriginalName: {
    type: String,
    default: ''
  },
  invoiceFile: {
    type: String,
    default: ''
  },
  invoiceFileOriginalName: {
    type: String,
    default: ''
  },
  ewayBillFile: {
    type: String,
    default: ''
  },
  ewayBillFileOriginalName: {
    type: String,
    default: ''
  },
  // ===== POD FILE FIELD (ADMIN ONLY) =====
  podFile: {
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

module.exports = mongoose.model('Appointment', AppointmentSchema);