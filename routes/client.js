const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Appointment = require('../models/Appointment');

// Generate Unique Appointment ID (Fallback)
function generateAppointmentId() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `AP-${year}${month}${day}-${random}`;
}

// ============================================
// CLIENT DASHBOARD
// ============================================
router.get('/dashboard', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ clientId: req.user._id })
      .sort({ createdAt: -1 });
    res.render('clientDashboard', {
      title: 'Client Dashboard',
      user: req.user,
      appointments
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.redirect('/login');
  }
});

// ============================================
// GET - Create Appointment Form
// ============================================
router.get('/appointment/new', auth, (req, res) => {
  res.render('clientAppointmentForm', {
    title: 'New Appointment',
    user: req.user,
    appointment: null,
    appointmentId: generateAppointmentId()
  });
});

// ============================================
// POST - Create Appointment
// ============================================
router.post('/appointment', auth, async (req, res) => {
  try {
    const { 
      appointmentId, 
      poNumber, 
      invoiceNumber, 
      ewayBill, 
      docketNumber,
      asnNumber,
      contactPerson,          // ✅ NEW
      contactNumber,          // ✅ NEW
      deliveryDate, 
      deliveryAddress, 
      remarks 
    } = req.body;

    // Validation
    if (!appointmentId || !poNumber || !invoiceNumber || !deliveryDate || !deliveryAddress) {
      return res.render('clientAppointmentForm', {
        title: 'New Appointment',
        user: req.user,
        appointment: null,
        appointmentId: generateAppointmentId(),
        error: 'Please fill in all required fields!'
      });
    }

    // Check if Appointment ID already exists
    const existingAppointment = await Appointment.findOne({ appointmentId });
    if (existingAppointment) {
      return res.render('clientAppointmentForm', {
        title: 'New Appointment',
        user: req.user,
        appointment: null,
        appointmentId: generateAppointmentId(),
        error: 'Appointment ID already exists! Please use a different ID.'
      });
    }

    const appointment = new Appointment({
      clientId: req.user._id,
      appointmentId,
      poNumber,
      invoiceNumber,
      ewayBill: ewayBill || '',
      docketNumber: docketNumber || '',
      asnNumber: asnNumber || '',
      contactPerson: contactPerson || '',        // ✅ NEW
      contactNumber: contactNumber || '',        // ✅ NEW
      deliveryDate,
      deliveryAddress,
      remarks: remarks || '',
      status: 'pending'
    });

    await appointment.save();
    res.redirect('/client/dashboard');
  } catch (error) {
    console.error('Create Appointment Error:', error);
    res.render('clientAppointmentForm', {
      title: 'New Appointment',
      user: req.user,
      appointment: null,
      appointmentId: generateAppointmentId(),
      error: 'Failed to create appointment! Please try again.'
    });
  }
});

// ============================================
// GET - Edit Appointment Form
// ============================================
router.get('/appointment/:id/edit', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clientId: req.user._id
    });
    if (!appointment) {
      return res.redirect('/client/dashboard');
    }
    res.render('clientAppointmentForm', {
      title: 'Edit Appointment',
      user: req.user,
      appointment,
      appointmentId: appointment.appointmentId
    });
  } catch (error) {
    console.error('Edit Appointment Error:', error);
    res.redirect('/client/dashboard');
  }
});

// ============================================
// PUT - Update Appointment
// ============================================
router.put('/appointment/:id', auth, async (req, res) => {
  try {
    const { 
      poNumber, 
      invoiceNumber, 
      ewayBill, 
      docketNumber,
      asnNumber,
      contactPerson,          // ✅ NEW
      contactNumber,          // ✅ NEW
      deliveryDate, 
      deliveryAddress, 
      remarks 
    } = req.body;

    // Validation
    if (!poNumber || !invoiceNumber || !deliveryDate || !deliveryAddress) {
      return res.redirect('/client/dashboard?error=Please fill in all required fields');
    }

    await Appointment.findOneAndUpdate(
      { _id: req.params.id, clientId: req.user._id },
      {
        poNumber,
        invoiceNumber,
        ewayBill: ewayBill || '',
        docketNumber: docketNumber || '',
        asnNumber: asnNumber || '',
        contactPerson: contactPerson || '',        // ✅ NEW
        contactNumber: contactNumber || '',        // ✅ NEW
        deliveryDate,
        deliveryAddress,
        remarks: remarks || '',
        updatedAt: Date.now()
      }
    );
    res.redirect('/client/dashboard');
  } catch (error) {
    console.error('Update Appointment Error:', error);
    res.redirect('/client/dashboard');
  }
});

// ============================================
// DELETE - Delete Appointment
// ============================================
router.delete('/appointment/:id', auth, async (req, res) => {
  try {
    const result = await Appointment.findOneAndDelete({
      _id: req.params.id,
      clientId: req.user._id
    });
    if (!result) {
      return res.status(404).send('Appointment not found');
    }
    res.redirect('/client/dashboard');
  } catch (error) {
    console.error('Delete Appointment Error:', error);
    res.redirect('/client/dashboard');
  }
});

module.exports = router;