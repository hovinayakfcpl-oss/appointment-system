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
  forwarderName: {                    // ✅ NEW - Forwarder Company Name
    type: String,
    default: ''
  },
  forwarderLRNumber: {               // ✅ NEW - Forwarder LR Number
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