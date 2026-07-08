const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const upload = require('../utils/upload');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

// ============================================
// HELPER: Get Cloudinary URL for file
// ============================================
const getCloudinaryUrl = (publicId) => {
    if (!publicId) return null;
    // If it's already a full URL, return as is
    if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
        return publicId;
    }
    // Generate Cloudinary URL with proper resource_type
    return cloudinary.url(publicId, {
        secure: true,
        resource_type: 'image', // ✅ Using 'image' for proper PDF viewing
        format: 'pdf'
    });
};

// ============================================
// HELPER: Delete file from Cloudinary
// ============================================
const deleteFromCloudinary = async (publicId) => {
    if (!publicId) return;
    if (publicId.startsWith('http://') || publicId.startsWith('https://')) return;
    
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'image'
        });
        console.log(`🗑️ Cloudinary delete result for ${publicId}:`, result);
        return result;
    } catch (error) {
        console.error('❌ Cloudinary delete error:', error);
    }
};

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
// POST - Create Appointment with File Upload
// ✅ FIXED: Using Cloudinary properly
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

    // ✅ FIXED: Get Cloudinary public_id from uploaded file
    const getFilePublicId = (file) => {
      if (!file) return '';
      // Cloudinary returns filename (public_id) in the file object
      return file.filename || file.path || '';
    };

    const getFileName = (file) => {
      if (!file) return '';
      return file.originalname || '';
    };

    const poFile = req.files?.poFile ? req.files.poFile[0] : null;
    const invoiceFile = req.files?.invoiceFile ? req.files.invoiceFile[0] : null;
    const ewayBillFile = req.files?.ewayBillFile ? req.files.ewayBillFile[0] : null;

    console.log('📄 PO File:', poFile ? getFilePublicId(poFile) : 'No file');
    console.log('📄 Invoice File:', invoiceFile ? getFilePublicId(invoiceFile) : 'No file');
    console.log('📄 E-Way Bill File:', ewayBillFile ? getFilePublicId(ewayBillFile) : 'No file');

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
      // ✅ FIXED: Store Cloudinary public_id (filename)
      poFile: poFile ? getFilePublicId(poFile) : '',
      poFileOriginalName: poFile ? getFileName(poFile) : '',
      invoiceFile: invoiceFile ? getFilePublicId(invoiceFile) : '',
      invoiceFileOriginalName: invoiceFile ? getFileName(invoiceFile) : '',
      ewayBillFile: ewayBillFile ? getFilePublicId(ewayBillFile) : '',
      ewayBillFileOriginalName: ewayBillFile ? getFileName(ewayBillFile) : ''
    });

    await appointment.save();
    console.log('✅ Appointment saved successfully!');
    
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
// PUT - Update Appointment (Client)
// ✅ FIXED: Using Cloudinary properly
// ============================================
router.put('/appointment/:id', auth, upload.fields([
  { name: 'poFile', maxCount: 1 },
  { name: 'invoiceFile', maxCount: 1 },
  { name: 'ewayBillFile', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('📝 ===== UPDATE APPOINTMENT =====');
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

    // ✅ FIXED: Get Cloudinary public_id from uploaded file
    const getFilePublicId = (file) => {
      if (!file) return '';
      return file.filename || file.path || '';
    };

    const getFileName = (file) => {
      if (!file) return '';
      return file.originalname || '';
    };

    const poFile = req.files?.poFile ? req.files.poFile[0] : null;
    const invoiceFile = req.files?.invoiceFile ? req.files.invoiceFile[0] : null;
    const ewayBillFile = req.files?.ewayBillFile ? req.files.ewayBillFile[0] : null;

    // ✅ Delete old files from Cloudinary if new ones are uploaded
    if (poFile && existingAppointment.poFile) {
      await deleteFromCloudinary(existingAppointment.poFile);
    }
    if (invoiceFile && existingAppointment.invoiceFile) {
      await deleteFromCloudinary(existingAppointment.invoiceFile);
    }
    if (ewayBillFile && existingAppointment.ewayBillFile) {
      await deleteFromCloudinary(existingAppointment.ewayBillFile);
    }

    console.log('📄 PO File:', poFile ? getFilePublicId(poFile) : 'No file');
    console.log('📄 Invoice File:', invoiceFile ? getFilePublicId(invoiceFile) : 'No file');
    console.log('📄 E-Way Bill File:', ewayBillFile ? getFilePublicId(ewayBillFile) : 'No file');

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
        // ✅ FIXED: Store Cloudinary public_id
        poFile: poFile ? getFilePublicId(poFile) : existingAppointment.poFile,
        poFileOriginalName: poFile ? getFileName(poFile) : existingAppointment.poFileOriginalName,
        invoiceFile: invoiceFile ? getFilePublicId(invoiceFile) : existingAppointment.invoiceFile,
        invoiceFileOriginalName: invoiceFile ? getFileName(invoiceFile) : existingAppointment.invoiceFileOriginalName,
        ewayBillFile: ewayBillFile ? getFilePublicId(ewayBillFile) : existingAppointment.ewayBillFile,
        ewayBillFileOriginalName: ewayBillFile ? getFileName(ewayBillFile) : existingAppointment.ewayBillFileOriginalName,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!updatedAppointment) {
      return res.redirect('/client/dashboard?error=Appointment not found!');
    }

    console.log('✅ Appointment Updated Successfully!');
    res.redirect('/client/dashboard?success=Appointment updated successfully!');
  } catch (error) {
    console.error('❌ Update Appointment Error:', error);
    res.redirect('/client/dashboard?error=Failed to update appointment!');
  }
});

// ============================================
// 📄 DOWNLOAD ROUTES - FIXED FOR CLOUDINARY
// ============================================

// ===== DOWNLOAD PO PDF (Client) =====
router.get('/appointment/:id/download/po', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clientId: req.user._id
    });
    
    if (!appointment || !appointment.poFile) {
      return res.status(404).send('File not found');
    }
    
    console.log('📥 Client Download PO:', appointment.poFile);
    
    const fileUrl = getCloudinaryUrl(appointment.poFile);
    if (fileUrl) {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error(`Cloudinary error: ${response.status}`);
        const buffer = await response.arrayBuffer();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${appointment.poFileOriginalName || 'PO_Document.pdf'}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(Buffer.from(buffer));
    }
    
    res.status(404).send('File not found');
  } catch (error) {
    console.error('Download PO Error:', error);
    res.status(500).send('Server error');
  }
});

// ===== DOWNLOAD INVOICE PDF (Client) =====
router.get('/appointment/:id/download/invoice', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clientId: req.user._id
    });
    
    if (!appointment || !appointment.invoiceFile) {
      return res.status(404).send('File not found');
    }
    
    console.log('📥 Client Download Invoice:', appointment.invoiceFile);
    
    const fileUrl = getCloudinaryUrl(appointment.invoiceFile);
    if (fileUrl) {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error(`Cloudinary error: ${response.status}`);
        const buffer = await response.arrayBuffer();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${appointment.invoiceFileOriginalName || 'Invoice_Document.pdf'}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(Buffer.from(buffer));
    }
    
    res.status(404).send('File not found');
  } catch (error) {
    console.error('Download Invoice Error:', error);
    res.status(500).send('Server error');
  }
});

// ===== DOWNLOAD E-WAY BILL PDF (Client) =====
router.get('/appointment/:id/download/ewaybill', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clientId: req.user._id
    });
    
    if (!appointment || !appointment.ewayBillFile) {
      return res.status(404).send('File not found');
    }
    
    console.log('📥 Client Download E-Way Bill:', appointment.ewayBillFile);
    
    const fileUrl = getCloudinaryUrl(appointment.ewayBillFile);
    if (fileUrl) {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error(`Cloudinary error: ${response.status}`);
        const buffer = await response.arrayBuffer();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${appointment.ewayBillFileOriginalName || 'EWayBill_Document.pdf'}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(Buffer.from(buffer));
    }
    
    res.status(404).send('File not found');
  } catch (error) {
    console.error('Download E-Way Bill Error:', error);
    res.status(500).send('Server error');
  }
});

// ===== DOWNLOAD POD PDF (Client - View Only) =====
router.get('/appointment/:id/download/pod', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clientId: req.user._id
    });
    
    if (!appointment || !appointment.podFile) {
      return res.status(404).send('File not found');
    }
    
    console.log('📥 Client View POD:', appointment.podFile);
    
    const fileUrl = getCloudinaryUrl(appointment.podFile);
    if (fileUrl) {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error(`Cloudinary error: ${response.status}`);
        const buffer = await response.arrayBuffer();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${appointment.podFileOriginalName || 'POD_Document.pdf'}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(Buffer.from(buffer));
    }
    
    res.status(404).send('File not found');
  } catch (error) {
    console.error('Download POD Error:', error);
    res.status(500).send('Server error');
  }
});

// ============================================
// FORCE DOWNLOAD ROUTES (Attachment)
// ============================================

// ===== FORCE DOWNLOAD PO PDF (Client) =====
router.get('/appointment/:id/download-attachment/po', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clientId: req.user._id
    });
    
    if (!appointment || !appointment.poFile) {
      return res.status(404).send('File not found');
    }
    
    const fileUrl = getCloudinaryUrl(appointment.poFile);
    if (fileUrl) {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error(`Cloudinary error: ${response.status}`);
        const buffer = await response.arrayBuffer();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${appointment.poFileOriginalName || 'PO_Document.pdf'}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(Buffer.from(buffer));
    }
    
    res.status(404).send('File not found');
  } catch (error) {
    console.error('Download PO Error:', error);
    res.status(500).send('Server error');
  }
});

// ===== FORCE DOWNLOAD INVOICE PDF (Client) =====
router.get('/appointment/:id/download-attachment/invoice', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clientId: req.user._id
    });
    
    if (!appointment || !appointment.invoiceFile) {
      return res.status(404).send('File not found');
    }
    
    const fileUrl = getCloudinaryUrl(appointment.invoiceFile);
    if (fileUrl) {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error(`Cloudinary error: ${response.status}`);
        const buffer = await response.arrayBuffer();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${appointment.invoiceFileOriginalName || 'Invoice_Document.pdf'}"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(Buffer.from(buffer));
    }
    
    res.status(404).send('File not found');
  } catch (error) {
    console.error('Download Invoice Error:', error);
    res.status(500).send('Server error');
  }
});

// ============================================
// DELETE - Delete Specific File (Client)
// ✅ FIXED: Delete from Cloudinary too
// ============================================
router.delete('/appointment/:id/file/:type', auth, async (req, res) => {
  try {
    const { id, type } = req.params;
    
    // Client can only delete: po, invoice, ewaybill (NOT pod)
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
    let fileValue = '';
    
    switch(type) {
      case 'po':
        fileField = 'poFile';
        nameField = 'poFileOriginalName';
        fileValue = appointment.poFile;
        break;
      case 'invoice':
        fileField = 'invoiceFile';
        nameField = 'invoiceFileOriginalName';
        fileValue = appointment.invoiceFile;
        break;
      case 'ewaybill':
        fileField = 'ewayBillFile';
        nameField = 'ewayBillFileOriginalName';
        fileValue = appointment.ewayBillFile;
        break;
      default:
        return res.status(400).json({ error: 'Invalid file type' });
    }

    // ✅ Delete from Cloudinary
    if (fileValue && !fileValue.startsWith('http://') && !fileValue.startsWith('https://')) {
      await deleteFromCloudinary(fileValue);
    }

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
// DELETE - Delete Appointment (Client)
// ✅ FIXED: Delete from Cloudinary too
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

    // ✅ Delete files from Cloudinary
    const files = [
      appointment.poFile,
      appointment.invoiceFile,
      appointment.ewayBillFile
    ];
    
    for (const file of files) {
      if (file && !file.startsWith('http://') && !file.startsWith('https://')) {
        await deleteFromCloudinary(file);
      }
    }

    await Appointment.findOneAndDelete({
      _id: req.params.id,
      clientId: req.user._id
    });
    
    res.redirect('/client/dashboard?success=Appointment deleted successfully!');
  } catch (error) {
    console.error('Delete Appointment Error:', error);
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
      appointment,
      getCloudinaryUrl
    });
  } catch (error) {
    console.error('Appointment Details Error:', error);
    res.redirect('/client/dashboard');
  }
});

module.exports = router;