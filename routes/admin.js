const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const upload = require('../utils/upload');
const path = require('path');
const fs = require('fs');

// ============================================
// ADMIN DASHBOARD
// ============================================
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
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
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
    
    const recentAppointments = await Appointment.find()
      .populate('clientId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.render('adminDashboard', {
      title: 'Admin Dashboard',
      user: req.user,
      clients: clientData,
      totalAppointments,
      pendingAppointments,
      completedAppointments,
      recentAppointments,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('Admin Dashboard Error:', error);
    res.redirect('/login');
  }
});

// ============================================
// GET - Client Appointments
// ============================================
router.get('/client/:id/appointments', adminAuth, async (req, res) => {
  try {
    const client = await User.findById(req.params.id);
    if (!client) {
      return res.redirect('/admin/dashboard?error=Client not found!');
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
    console.error('Client Appointments Error:', error);
    res.redirect('/admin/dashboard?error=Failed to load client appointments!');
  }
});

// ============================================
// PUT - Update Appointment Status
// ============================================
router.put('/appointment/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'completed'].includes(status)) {
      return res.redirect('/admin/dashboard?error=Invalid status!');
    }
    
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        status,
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    if (!appointment) {
      return res.redirect('/admin/dashboard?error=Appointment not found!');
    }
    
    res.redirect('/admin/dashboard?success=Status updated successfully!');
  } catch (error) {
    console.error('Update Status Error:', error);
    res.redirect('/admin/dashboard?error=Failed to update status!');
  }
});

// ============================================
// PUT - Update Appointment (Admin Direct) with File Upload + POD
// ============================================
router.put('/appointment/:id/admin-update', adminAuth, upload.fields([
  { name: 'poFile', maxCount: 1 },
  { name: 'invoiceFile', maxCount: 1 },
  { name: 'ewayBillFile', maxCount: 1 },
  { name: 'podFile', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('📝 ===== ADMIN UPDATE =====');
    console.log('📝 Request Body:', req.body);
    console.log('📂 Files:', req.files ? Object.keys(req.files) : 'No files');

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

    // Validation
    if (!poNumber || !invoiceNumber || !deliveryDate || !deliveryAddress) {
      return res.redirect('/admin/dashboard?error=Please fill in all required fields');
    }

    // Get uploaded files
    const poFile = req.files?.poFile ? req.files.poFile[0] : null;
    const invoiceFile = req.files?.invoiceFile ? req.files.invoiceFile[0] : null;
    const ewayBillFile = req.files?.ewayBillFile ? req.files.ewayBillFile[0] : null;
    const podFile = req.files?.podFile ? req.files.podFile[0] : null;

    console.log('📄 PO File:', poFile ? poFile.filename : 'No file');
    console.log('📄 Invoice File:', invoiceFile ? invoiceFile.filename : 'No file');
    console.log('📄 E-Way Bill File:', ewayBillFile ? ewayBillFile.filename : 'No file');
    console.log('📄 POD File:', podFile ? podFile.filename : 'No file');

    // Find existing appointment
    const existingAppointment = await Appointment.findById(req.params.id);
    if (!existingAppointment) {
      return res.redirect('/admin/dashboard?error=Appointment not found!');
    }

    // Delete old files if new ones uploaded
    if (poFile && existingAppointment.poFile) {
      try { 
        const oldPath = path.join(__dirname, '../uploads', existingAppointment.poFile);
        if (fs.existsSync(oldPath)) { fs.unlinkSync(oldPath); }
        console.log('🗑️ Deleted old PO file');
      } catch(e) { console.log('Delete error:', e.message); }
    }
    if (invoiceFile && existingAppointment.invoiceFile) {
      try { 
        const oldPath = path.join(__dirname, '../uploads', existingAppointment.invoiceFile);
        if (fs.existsSync(oldPath)) { fs.unlinkSync(oldPath); }
        console.log('🗑️ Deleted old Invoice file');
      } catch(e) { console.log('Delete error:', e.message); }
    }
    if (ewayBillFile && existingAppointment.ewayBillFile) {
      try { 
        const oldPath = path.join(__dirname, '../uploads', existingAppointment.ewayBillFile);
        if (fs.existsSync(oldPath)) { fs.unlinkSync(oldPath); }
        console.log('🗑️ Deleted old E-Way Bill file');
      } catch(e) { console.log('Delete error:', e.message); }
    }
    if (podFile && existingAppointment.podFile) {
      try { 
        const oldPath = path.join(__dirname, '../uploads', existingAppointment.podFile);
        if (fs.existsSync(oldPath)) { fs.unlinkSync(oldPath); }
        console.log('🗑️ Deleted old POD file');
      } catch(e) { console.log('Delete error:', e.message); }
    }

    // ✅ Admin direct update with file fields + POD
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
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
        poFile: poFile ? poFile.filename : existingAppointment.poFile,
        poFileOriginalName: poFile ? poFile.originalname : existingAppointment.poFileOriginalName,
        invoiceFile: invoiceFile ? invoiceFile.filename : existingAppointment.invoiceFile,
        invoiceFileOriginalName: invoiceFile ? invoiceFile.originalname : existingAppointment.invoiceFileOriginalName,
        ewayBillFile: ewayBillFile ? ewayBillFile.filename : existingAppointment.ewayBillFile,
        ewayBillFileOriginalName: ewayBillFile ? ewayBillFile.originalname : existingAppointment.ewayBillFileOriginalName,
        podFile: podFile ? podFile.filename : existingAppointment.podFile,
        podFileOriginalName: podFile ? podFile.originalname : existingAppointment.podFileOriginalName,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!updatedAppointment) {
      return res.redirect('/admin/dashboard?error=Appointment not found!');
    }

    console.log('✅ Admin Update Success!');
    console.log('✅ Docket Number saved:', updatedAppointment.docketNumber);

    res.redirect('/admin/dashboard?success=Appointment updated successfully!');
  } catch (error) {
    console.error('❌ Admin Update Error:', error);
    res.redirect('/admin/dashboard?error=Failed to update appointment!');
  }
});

// ============================================
// GET - Edit Appointment Form (Admin)
// ============================================
router.get('/appointment/:id/edit', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.redirect('/admin/dashboard?error=Appointment not found!');
    }
    
    res.render('clientAppointmentForm', {
      title: 'Edit Appointment (Admin)',
      user: req.user,
      appointment,
      appointmentId: appointment.appointmentId
    });
  } catch (error) {
    console.error('Admin Edit Appointment Error:', error);
    res.redirect('/admin/dashboard?error=Failed to load appointment!');
  }
});

// ============================================
// GET - Edit Forwarder Details Form
// ============================================
router.get('/appointment/:id/edit-forwarder', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('clientId', 'name email');
    
    if (!appointment) {
      return res.redirect('/admin/dashboard?error=Appointment not found!');
    }
    
    res.render('adminEditAppointment', {
      title: 'Edit Forwarder Details',
      user: req.user,
      appointment
    });
  } catch (error) {
    console.error('Edit Forwarder Error:', error);
    res.redirect('/admin/dashboard?error=Failed to load forwarder details!');
  }
});

// ============================================
// PUT - Update Forwarder Details
// ============================================
router.put('/appointment/:id/forwarder', adminAuth, async (req, res) => {
  try {
    const { forwarderName, forwarderLRNumber } = req.body;
    
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        forwarderName: forwarderName || '',
        forwarderLRNumber: forwarderLRNumber || '',
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('clientId', 'name email');
    
    if (!appointment) {
      return res.redirect('/admin/dashboard?error=Appointment not found!');
    }
    
    res.render('adminEditAppointment', {
      title: 'Edit Forwarder Details',
      user: req.user,
      appointment,
      success: 'Forwarder details updated successfully!'
    });
  } catch (error) {
    console.error('Update Forwarder Error:', error);
    res.render('adminEditAppointment', {
      title: 'Edit Forwarder Details',
      user: req.user,
      appointment: await Appointment.findById(req.params.id).populate('clientId', 'name email'),
      error: 'Failed to update forwarder details!'
    });
  }
});

// ============================================
// GET - All Appointments (Admin View)
// ============================================
router.get('/appointments', adminAuth, async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('clientId', 'name email')
      .sort({ createdAt: -1 });
    
    res.render('adminAllAppointments', {
      title: 'All Appointments',
      user: req.user,
      appointments
    });
  } catch (error) {
    console.error('All Appointments Error:', error);
    res.redirect('/admin/dashboard?error=Failed to load appointments!');
  }
});

// ============================================
// GET - Appointment Details (Admin View)
// ============================================
router.get('/appointment/:id', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('clientId', 'name email');
    
    if (!appointment) {
      return res.redirect('/admin/dashboard?error=Appointment not found!');
    }
    
    res.render('appointmentDetails', {
      title: 'Appointment Details',
      user: req.user,
      appointment
    });
  } catch (error) {
    console.error('Appointment Details Error:', error);
    res.redirect('/admin/dashboard?error=Failed to load appointment details!');
  }
});

// ============================================
// DELETE - Delete Appointment (Admin)
// ============================================
router.delete('/appointment/:id', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    
    if (!appointment) {
      return res.redirect('/admin/dashboard?error=Appointment not found!');
    }
    
    // Delete all associated files
    const uploadDir = path.join(__dirname, '../uploads');
    const files = [
      appointment.poFile, 
      appointment.invoiceFile, 
      appointment.ewayBillFile,
      appointment.podFile
    ];
    files.forEach(file => {
      if (file) {
        try {
          const filePath = path.join(uploadDir, file);
          if (fs.existsSync(filePath)) { fs.unlinkSync(filePath); }
          console.log('🗑️ Deleted file:', file);
        } catch(e) {}
      }
    });
    
    res.redirect('/admin/dashboard?success=Appointment deleted successfully!');
  } catch (error) {
    console.error('Delete Appointment Error:', error);
    res.redirect('/admin/dashboard?error=Failed to delete appointment!');
  }
});

// ============================================
// DELETE - Delete Specific File (Admin)
// ============================================
router.delete('/appointment/:id/file/:type', adminAuth, async (req, res) => {
  try {
    const { id, type } = req.params;
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    let fileField = '';
    let nameField = '';
    
    switch(type) {
      case 'po':
        fileField = 'poFile';
        nameField = 'poFileOriginalName';
        break;
      case 'invoice':
        fileField = 'invoiceFile';
        nameField = 'invoiceFileOriginalName';
        break;
      case 'ewaybill':
        fileField = 'ewayBillFile';
        nameField = 'ewayBillFileOriginalName';
        break;
      case 'pod':
        fileField = 'podFile';
        nameField = 'podFileOriginalName';
        break;
      default:
        return res.status(400).json({ error: 'Invalid file type' });
    }

    // Delete file from server
    if (appointment[fileField]) {
      const filePath = path.join(__dirname, '../uploads', appointment[fileField]);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🗑️ Deleted file:', appointment[fileField]);
      }
    }

    // Clear fields in database
    appointment[fileField] = '';
    appointment[nameField] = '';
    await appointment.save();

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete File Error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// ============================================
// GET - Download PO PDF
// ============================================
router.get('/appointment/:id/download/po', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.poFile) {
      return res.status(404).send('File not found');
    }
    const filePath = path.join(__dirname, '../uploads', appointment.poFile);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }
    res.download(filePath, appointment.poFileOriginalName || 'PO_Document.pdf');
  } catch (error) {
    console.error('Download Error:', error);
    res.status(500).send('Server error');
  }
});

// ============================================
// GET - Download Invoice PDF
// ============================================
router.get('/appointment/:id/download/invoice', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.invoiceFile) {
      return res.status(404).send('File not found');
    }
    const filePath = path.join(__dirname, '../uploads', appointment.invoiceFile);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }
    res.download(filePath, appointment.invoiceFileOriginalName || 'Invoice_Document.pdf');
  } catch (error) {
    console.error('Download Error:', error);
    res.status(500).send('Server error');
  }
});

// ============================================
// GET - Download E-Way Bill PDF
// ============================================
router.get('/appointment/:id/download/ewaybill', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.ewayBillFile) {
      return res.status(404).send('File not found');
    }
    const filePath = path.join(__dirname, '../uploads', appointment.ewayBillFile);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }
    res.download(filePath, appointment.ewayBillFileOriginalName || 'EWayBill_Document.pdf');
  } catch (error) {
    console.error('Download Error:', error);
    res.status(500).send('Server error');
  }
});

// ============================================
// GET - Download POD PDF
// ============================================
router.get('/appointment/:id/download/pod', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.podFile) {
      return res.status(404).send('File not found');
    }
    const filePath = path.join(__dirname, '../uploads', appointment.podFile);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }
    res.download(filePath, appointment.podFileOriginalName || 'POD_Document.pdf');
  } catch (error) {
    console.error('Download Error:', error);
    res.status(500).send('Server error');
  }
});

// ============================================
// GET - Dashboard Stats (JSON - For API)
// ============================================
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalAppointments = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
    const confirmedAppointments = await Appointment.countDocuments({ status: 'confirmed' });
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
    
    res.json({
      totalClients,
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments
    });
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// GET - Today's Appointments (Admin)
// ============================================
router.get('/today', adminAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAppointments = await Appointment.find({
      deliveryDate: { $gte: today, $lt: tomorrow }
    }).populate('clientId', 'name email');
    
    res.json({
      count: todayAppointments.length,
      appointments: todayAppointments
    });
  } catch (error) {
    console.error('Today Appointments Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;