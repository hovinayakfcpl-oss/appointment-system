const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const fs = require('fs');
const path = require('path');

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
// POST - Create Appointment (CLIENT - NO FILE UPLOAD)
// ============================================
router.post('/appointment', auth, async (req, res) => {
  try {
    // ===== DEBUG LOGS =====
    console.log('📝 ===== CLIENT CREATE APPOINTMENT =====');
    console.log('📝 Request Body:', req.body);
    
    const { 
      appointmentId, 
      poNumber, 
      invoiceNumber, 
      ewayBill, 
      docketNumber,
      asnNumber,
      contactPerson,
      contactNumber,
      deliveryDate, 
      deliveryAddress, 
      remarks 
    } = req.body;

    console.log('📝 Docket Number from form:', docketNumber || 'EMPTY');

    // Validation
    if (!appointmentId || !poNumber || !invoiceNumber || !deliveryDate || !deliveryAddress) {
      console.log('❌ Validation failed! Missing required fields.');
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
      console.log('❌ Appointment ID already exists:', appointmentId);
      return res.render('clientAppointmentForm', {
        title: 'New Appointment',
        user: req.user,
        appointment: null,
        appointmentId: generateAppointmentId(),
        error: 'Appointment ID already exists! Please use a different ID.'
      });
    }

    // ===== CLIENT: NO FILE UPLOAD =====
    // Client sirf form fields bhar sakta hai, files nahi upload kar sakta
    const appointment = new Appointment({
      clientId: req.user._id,
      appointmentId,
      poNumber,
      invoiceNumber,
      ewayBill: ewayBill || '',
      docketNumber: docketNumber || '',
      asnNumber: asnNumber || '',
      contactPerson: contactPerson || '',
      contactNumber: contactNumber || '',
      deliveryDate,
      deliveryAddress,
      remarks: remarks || '',
      status: 'pending'
      // ⚠️ NO FILE FIELDS - ONLY ADMIN CAN UPLOAD FILES
    });

    await appointment.save();
    console.log('✅ Appointment saved successfully!');
    console.log('✅ Docket Number saved:', appointment.docketNumber);
    
    if (req.user.role === 'admin') {
      return res.redirect('/admin/dashboard?success=Appointment created successfully!');
    }
    res.redirect('/client/dashboard?success=Appointment created successfully!');
  } catch (error) {
    console.error('❌ Create Appointment Error:', error);
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
// PUT - Update Appointment (CLIENT - NO FILE UPLOAD)
// ============================================
router.put('/appointment/:id', auth, async (req, res) => {
  try {
    // ===== DEBUG LOGS =====
    console.log('📝 ===== CLIENT UPDATE APPOINTMENT =====');
    console.log('📝 Request Body:', req.body);

    const { 
      poNumber, 
      invoiceNumber, 
      ewayBill, 
      docketNumber,
      asnNumber,
      contactPerson,
      contactNumber,
      deliveryDate, 
      deliveryAddress, 
      remarks 
    } = req.body;

    console.log('📝 Docket Number from form:', docketNumber || 'EMPTY');

    // ✅ Sirf client ke liye (admin is route ko use nahi karega)
    if (req.user.role === 'admin') {
      return res.redirect('/admin/dashboard?error=Use admin update route!');
    }

    // Validation
    if (!poNumber || !invoiceNumber || !deliveryDate || !deliveryAddress) {
      return res.redirect('/client/dashboard?error=Please fill in all required fields');
    }

    // Find existing appointment
    const existingAppointment = await Appointment.findOne({
      _id: req.params.id,
      clientId: req.user._id
    });

    if (!existingAppointment) {
      return res.redirect('/client/dashboard?error=Appointment not found!');
    }

    // ===== CLIENT: NO FILE UPLOAD =====
    // Sirf form fields update karo, files nahi
    const updatedAppointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, clientId: req.user._id },
      {
        poNumber,
        invoiceNumber,
        ewayBill: ewayBill || '',
        docketNumber: docketNumber || '',
        asnNumber: asnNumber || '',
        contactPerson: contactPerson || '',
        contactNumber: contactNumber || '',
        deliveryDate,
        deliveryAddress,
        remarks: remarks || '',
        updatedAt: Date.now()
        // ⚠️ FILE FIELDS NOT UPDATED - ONLY ADMIN CAN UPDATE FILES
      },
      { new: true }
    );

    if (!updatedAppointment) {
      return res.redirect('/client/dashboard?error=Appointment not found!');
    }

    console.log('✅ Client Update Success!');
    console.log('✅ Docket Number saved:', updatedAppointment.docketNumber);

    res.redirect('/client/dashboard?success=Appointment updated successfully!');
  } catch (error) {
    console.error('❌ Update Appointment Error:', error);
    res.redirect('/client/dashboard?error=Failed to update appointment!');
  }
});

// ============================================
// DELETE - Delete Appointment
// ============================================
router.delete('/appointment/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clientId: req.user._id
    });
    
    if (!appointment) {
      return res.status(404).send('Appointment not found');
    }

    await Appointment.findOneAndDelete({
      _id: req.params.id,
      clientId: req.user._id
    });
    
    if (req.user.role === 'admin') {
      return res.redirect('/admin/dashboard?success=Appointment deleted successfully!');
    }
    res.redirect('/client/dashboard?success=Appointment deleted successfully!');
  } catch (error) {
    console.error('Delete Appointment Error:', error);
    if (req.user.role === 'admin') {
      return res.redirect('/admin/dashboard?error=Failed to delete appointment!');
    }
    res.redirect('/client/dashboard?error=Failed to delete appointment!');
  }
});

// ============================================
// GET - Appointment Details (Client View)
// ============================================
router.get('/appointment/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clientId: req.user._id
    });
    
    if (!appointment) {
      return res.redirect('/client/dashboard');
    }
    
    res.render('appointmentDetails', {
      title: 'Appointment Details',
      user: req.user,
      appointment
    });
  } catch (error) {
    console.error('Appointment Details Error:', error);
    res.redirect('/client/dashboard');
  }
});

module.exports = router;