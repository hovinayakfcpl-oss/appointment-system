const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

// Admin Dashboard
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    // Get all clients with appointment count
    const clients = await User.find({ role: 'client' });
    const clientData = await Promise.all(clients.map(async (client) => {
      const count = await Appointment.countDocuments({ clientId: client._id });
      return {
        ...client.toObject(),
        appointmentCount: count
      };
    }));
    const totalAppointments = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
    
    res.render('adminDashboard', {
      title: 'Admin Dashboard',
      user: req.user,
      clients: clientData,
      totalAppointments,
      pendingAppointments
    });
  } catch (error) {
    console.log(error);
    res.redirect('/login');
  }
});

// GET - Client Appointments
router.get('/client/:id/appointments', adminAuth, async (req, res) => {
  try {
    const client = await User.findById(req.params.id);
    if (!client) {
      return res.redirect('/admin/dashboard');
    }
    const appointments = await Appointment.find({ clientId: client._id })
      .sort({ createdAt: -1 });
    res.render('adminClientAppointments', {
      title: `Appointments - ${client.name}`,
      user: req.user,
      client,
      appointments
    });
  } catch (error) {
    res.redirect('/admin/dashboard');
  }
});

// PUT - Update Appointment Status
router.put('/appointment/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    await Appointment.findByIdAndUpdate(req.params.id, {
      status,
      updatedAt: Date.now()
    });
    res.redirect('back');
  } catch (error) {
    res.redirect('back');
  }
});

module.exports = router;