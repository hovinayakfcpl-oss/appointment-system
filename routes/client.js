const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const upload = require('../utils/upload');
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
// POST - Create Appointment with File Upload (Client + Admin)
// ============================================
router.post('/appointment', auth, upload.fields([
  { name: 'poFile', maxCount: 1 },
  { name: 'invoiceFile', maxCount: 1 },
  { name: 'ewayBillFile', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('📝 ===== CREATE APPOINTMENT =====');
    console.log('📝 Request Body:', req.body);
    console.log('📂 Files:', req.files ? Object.keys(req.files) : 'No files');
    
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
      if (req.files) {
        Object.values(req.files).forEach(fileArray => {
          fileArray.forEach(file => {
            try { fs.unlinkSync(file.path); } catch(e) {}
          });
        });
      }
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
      if (req.files) {
        Object.values(req.files).forEach(fileArray => {
          fileArray.forEach(file => {
            try { fs.unlinkSync(file.path); } catch(e) {}
          });
        });
      }
      return res.render('clientAppointmentForm', {
        title: 'New Appointment',
        user: req.user,
        appointment: null,
        appointmentId: generateAppointmentId(),
        error: 'Appointment ID already exists! Please use a different ID.'
      });
    }

    // Get uploaded file paths
    const poFile = req.files?.poFile ? req.files.poFile[0] : null;
    const invoiceFile = req.files?.invoiceFile ? req.files.invoiceFile[0] : null;
    const ewayBillFile = req.files?.ewayBillFile ? req.files.ewayBillFile[0] : null;

    console.log('📄 PO File:', poFile ? poFile.filename : 'No file');
    console.log('📄 Invoice File:', invoiceFile ? invoiceFile.filename : 'No file');
    console.log('📄 E-Way Bill File:', ewayBillFile ? ewayBillFile.filename : 'No file');

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
      status: 'pending',
      poFile: poFile ? poFile.filename : '',
      poFileOriginalName: poFile ? poFile.originalname : '',
      invoiceFile: invoiceFile ? invoiceFile.filename : '',
      invoiceFileOriginalName: invoiceFile ? invoiceFile.originalname : '',
      ewayBillFile: ewayBillFile ? ewayBillFile.filename : '',
      ewayBillFileOriginalName: ewayBillFile ? ewayBillFile.originalname : ''
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
    if (req.files) {
      Object.values(req.files).forEach(fileArray => {
        fileArray.forEach(file => {
          try { fs.unlinkSync(file.path); } catch(e) {}
        });
      });
    }
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
// PUT - Update Appointment (Client + Admin)
// ============================================
router.put('/appointment/:id', auth, upload.fields([
  { name: 'poFile', maxCount: 1 },
  { name: 'invoiceFile', maxCount: 1 },
  { name: 'ewayBillFile', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('📝 ===== UPDATE APPOINTMENT =====');
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

    // ✅ Admin is route ko use kar sakta hai (kyunki humne alag se admin-update nahi banaya)
    // Validation
    if (!poNumber || !invoiceNumber || !deliveryDate || !deliveryAddress) {
      if (req.user.role === 'admin') {
        return res.redirect('/admin/dashboard?error=Please fill in all required fields');
      }
      return res.redirect('/client/dashboard?error=Please fill in all required fields');
    }

    // Find existing appointment
    const existingAppointment = await Appointment.findOne({
      _id: req.params.id,
      clientId: req.user._id
    });

    if (!existingAppointment) {
      if (req.user.role === 'admin') {
        return res.redirect('/admin/dashboard?error=Appointment not found!');
      }
      return res.redirect('/client/dashboard?error=Appointment not found!');
    }

    // Get uploaded file paths
    const poFile = req.files?.poFile ? req.files.poFile[0] : null;
    const invoiceFile = req.files?.invoiceFile ? req.files.invoiceFile[0] : null;
    const ewayBillFile = req.files?.ewayBillFile ? req.files.ewayBillFile[0] : null;

    console.log('📄 PO File:', poFile ? poFile.filename : 'No file');
    console.log('📄 Invoice File:', invoiceFile ? invoiceFile.filename : 'No file');
    console.log('📄 E-Way Bill File:', ewayBillFile ? ewayBillFile.filename : 'No file');

    // Delete old files if new ones are uploaded
    if (poFile && existingAppointment.poFile) {
      try {
        const oldFilePath = path.join(__dirname, '../uploads', existingAppointment.poFile);
        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
        console.log('🗑️ Deleted old PO file:', existingAppointment.poFile);
      } catch(e) {}
    }
    if (invoiceFile && existingAppointment.invoiceFile) {
      try {
        const oldFilePath = path.join(__dirname, '../uploads', existingAppointment.invoiceFile);
        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
        console.log('🗑️ Deleted old Invoice file:', existingAppointment.invoiceFile);
      } catch(e) {}
    }
    if (ewayBillFile && existingAppointment.ewayBillFile) {
      try {
        const oldFilePath = path.join(__dirname, '../uploads', existingAppointment.ewayBillFile);
        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
        console.log('🗑️ Deleted old E-Way Bill file:', existingAppointment.ewayBillFile);
      } catch(e) {}
    }

    // Update appointment
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
        poFile: poFile ? poFile.filename : existingAppointment.poFile,
        poFileOriginalName: poFile ? poFile.originalname : existingAppointment.poFileOriginalName,
        invoiceFile: invoiceFile ? invoiceFile.filename : existingAppointment.invoiceFile,
        invoiceFileOriginalName: invoiceFile ? invoiceFile.originalname : existingAppointment.invoiceFileOriginalName,
        ewayBillFile: ewayBillFile ? ewayBillFile.filename : existingAppointment.ewayBillFile,
        ewayBillFileOriginalName: ewayBillFile ? ewayBillFile.originalname : existingAppointment.ewayBillFileOriginalName,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!updatedAppointment) {
      if (req.user.role === 'admin') {
        return res.redirect('/admin/dashboard?error=Appointment not found!');
      }
      return res.redirect('/client/dashboard?error=Appointment not found!');
    }

    console.log('✅ Appointment Updated Successfully!');
    console.log('✅ Docket Number saved:', updatedAppointment.docketNumber);

    if (req.user.role === 'admin') {
      return res.redirect('/admin/dashboard?success=Appointment updated successfully!');
    }
    res.redirect('/client/dashboard?success=Appointment updated successfully!');
  } catch (error) {
    console.error('❌ Update Appointment Error:', error);
    if (req.user.role === 'admin') {
      return res.redirect('/admin/dashboard?error=Failed to update appointment!');
    }
    res.redirect('/client/dashboard?error=Failed to update appointment!');
  }
});

// ============================================
// DELETE - Delete Specific File (Client)
// ============================================
router.delete('/appointment/:id/file/:type', auth, async (req, res) => {
  try {
    const { id, type } = req.params;
    
    // ✅ Client can only delete: po, invoice, ewaybill (NOT pod)
    const allowedTypes = ['po', 'invoice', 'ewaybill'];
    if (!allowedTypes.includes(type)) {
      return res.status(403).json({ error: 'You are not authorized to delete this file' });
    }

    const appointment = await Appointment.findOne({
      _id: id,
      clientId: req.user._id
    });
    
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
      default:
        return res.status(400).json({ error: 'Invalid file type' });
    }

    // Delete file from server
    if (appointment[fileField]) {
      const filePath = path.join(__dirname, '../uploads', appointment[fileField]);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🗑️ Client deleted file:', appointment[fileField]);
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

    // Delete associated files (only PO, Invoice, E-Way Bill - not POD)
    const uploadDir = path.join(__dirname, '../uploads');
    const files = [appointment.poFile, appointment.invoiceFile, appointment.ewayBillFile];
    files.forEach(file => {
      if (file) {
        try {
          const filePath = path.join(uploadDir, file);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          console.log('🗑️ Deleted file:', file);
        } catch(e) {}
      }
    });

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