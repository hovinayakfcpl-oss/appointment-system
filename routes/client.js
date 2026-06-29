const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Appointment = require('../models/Appointment');

// Generate Unique Appointment ID
function generateAppointmentId() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `AP-${year}${month}${day}-${random}`;
}

// Client Dashboard
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
    res.redirect('/login');
  }
});

// GET - Create Appointment Form
router.get('/appointment/new', auth, (req, res) => {
  res.render('clientAppointmentForm', {
    title: 'New Appointment',
    user: req.user,
    appointment: null,
    appointmentId: generateAppointmentId()
  });
});

// POST - Create Appointment
router.post('/appointment', auth, async (req, res) => {
  try {
    const { appointmentId, poNumber, invoiceNumber, ewayBill, docketNumber, deliveryDate, deliveryAddress, remarks } = req.body;
    const appointment = new Appointment({
      clientId: req.user._id,
      appointmentId,
      poNumber,
      invoiceNumber,
      ewayBill: ewayBill || '',
      docketNumber: docketNumber || '',
      deliveryDate,
      deliveryAddress,
      remarks: remarks || '',
      status: 'pending'
    });
    await appointment.save();
    res.redirect('/client/dashboard');
  } catch (error) {
    res.render('clientAppointmentForm', {
      title: 'New Appointment',
      user: req.user,
      appointment: null,
      appointmentId: generateAppointmentId(),
      error: 'Failed to create appointment!'
    });
  }
});

// GET - Edit Appointment Form
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
    res.redirect('/client/dashboard');
  }
});

// PUT - Update Appointment
router.put('/appointment/:id', auth, async (req, res) => {
  try {
    const { poNumber, invoiceNumber, ewayBill, docketNumber, deliveryDate, deliveryAddress, remarks } = req.body;
    await Appointment.findOneAndUpdate(
      { _id: req.params.id, clientId: req.user._id },
      {
        poNumber,
        invoiceNumber,
        ewayBill,
        docketNumber,
        deliveryDate,
        deliveryAddress,
        remarks,
        updatedAt: Date.now()
      }
    );
    res.redirect('/client/dashboard');
  } catch (error) {
    res.redirect('/client/dashboard');
  }
});

// DELETE - Delete Appointment
router.delete('/appointment/:id', auth, async (req, res) => {
  try {
    await Appointment.findOneAndDelete({
      _id: req.params.id,
      clientId: req.user._id
    });
    res.redirect('/client/dashboard');
  } catch (error) {
    res.redirect('/client/dashboard');
  }
});

module.exports = router;