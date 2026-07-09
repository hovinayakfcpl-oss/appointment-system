const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const upload = require('../utils/upload');
const { uploadFile } = require('../utils/upload');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

// ============================================
// CLOUDINARY CONFIG
// ============================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('☁️ Cloudinary Config (client.js):', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '❌ Not Set',
  api_key: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Not Set'
});

// ============================================
// HELPER: Get Cloudinary URL for file (VIEW)
// ============================================
const getCloudinaryUrl = (publicId) => {
    if (!publicId) return null;
    if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
        return publicId;
    }
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}.pdf`;
};

// ============================================
// HELPER: Get download URL with attachment flag
// ============================================
const getDownloadUrl = (publicId) => {
    if (!publicId) return null;
    if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
        return publicId;
    }
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    return `https://res.cloudinary.com/${cloudName}/image/upload/fl_attachment/${publicId}.pdf`;
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

// ============================================
// HELPER: Get file URL (for EJS templates)
// ============================================
const getFileUrl = (appointment, type) => {
    const fileMap = {
        'po': appointment.poFile,
        'invoice': appointment.invoiceFile,
        'ewaybill': appointment.ewayBillFile,
        'pod': appointment.podFile
    };
    const publicId = fileMap[type];
    if (!publicId) return null;
    return getCloudinaryUrl(publicId);
};

// Generate Unique Appointment ID
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
// ✅ FIXED: Using uploadFile from upload.js
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

    if (!appointmentId || !poNumber || !invoiceNumber || !deliveryDate || !deliveryAddress) {
      return res.render('clientAppointmentForm', {
        title: 'New Appointment',
        user: req.user,
        appointment: null,
        appointmentId: generateAppointmentId(),
        error: 'Please fill in all required fields!'
      });
    }

    const existingAppointment = await Appointment.findOne({ appointmentId });
    if (existingAppointment) {
      return res.render('clientAppointmentForm', {
        title: 'New Appointment',
        user: req.user,
        appointment: null,
        appointmentId: generateAppointmentId(),
        error: 'Appointment ID already exists!'
      });
    }

    // ✅ UPLOAD FILES TO CLOUDINARY
    const poFile = req.files?.poFile ? req.files.poFile[0] : null;
    const invoiceFile = req.files?.invoiceFile ? req.files.invoiceFile[0] : null;
    const ewayBillFile = req.files?.ewayBillFile ? req.files.ewayBillFile[0] : null;

    // ✅ Upload files using the helper from upload.js
    const poDetails = poFile ? await uploadFile(poFile) : { publicId: '', url: '', name: '' };
    const invoiceDetails = invoiceFile ? await uploadFile(invoiceFile) : { publicId: '', url: '', name: '' };
    const ewayDetails = ewayBillFile ? await uploadFile(ewayBillFile) : { publicId: '', url: '', name: '' };

    console.log('📄 PO File:', poDetails.publicId || 'No file');
    console.log('📄 Invoice File:', invoiceDetails.publicId || 'No file');
    console.log('📄 E-Way Bill File:', ewayDetails.publicId || 'No file');

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
      // ✅ Store both public_id and full URL
      poFile: poDetails.publicId,
      poFileUrl: poDetails.url,
      poFileOriginalName: poDetails.name,
      invoiceFile: invoiceDetails.publicId,
      invoiceFileUrl: invoiceDetails.url,
      invoiceFileOriginalName: invoiceDetails.name,
      ewayBillFile: ewayDetails.publicId,
      ewayBillFileUrl: ewayDetails.url,
      ewayBillFileOriginalName: ewayDetails.name
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
// ✅ FIXED: Using uploadFile from upload.js
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

    if (!poNumber || !invoiceNumber || !deliveryDate || !deliveryAddress) {
      return res.redirect('/client/dashboard?error=Please fill in all required fields');
    }

    const existingAppointment = await Appointment.findOne({
      _id: req.params.id,
      clientId: req.user._id
    });

    if (!existingAppointment) {
      return res.redirect('/client/dashboard?error=Appointment not found!');
    }

    // ✅ UPLOAD FILES TO CLOUDINARY
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

    // ✅ Upload new files
    const poDetails = poFile ? await uploadFile(poFile) : { publicId: '', url: '', name: '' };
    const invoiceDetails = invoiceFile ? await uploadFile(invoiceFile) : { publicId: '', url: '', name: '' };
    const ewayDetails = ewayBillFile ? await uploadFile(ewayBillFile) : { publicId: '', url: '', name: '' };

    console.log('📄 PO File:', poDetails.publicId || 'No file');
    console.log('📄 Invoice File:', invoiceDetails.publicId || 'No file');
    console.log('📄 E-Way Bill File:', ewayDetails.publicId || 'No file');

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
        // ✅ Store both public_id and full URL
        poFile: poFile ? poDetails.publicId : existingAppointment.poFile,
        poFileUrl: poFile ? poDetails.url : existingAppointment.poFileUrl,
        poFileOriginalName: poFile ? poDetails.name : existingAppointment.poFileOriginalName,
        invoiceFile: invoiceFile ? invoiceDetails.publicId : existingAppointment.invoiceFile,
        invoiceFileUrl: invoiceFile ? invoiceDetails.url : existingAppointment.invoiceFileUrl,
        invoiceFileOriginalName: invoiceFile ? invoiceDetails.name : existingAppointment.invoiceFileOriginalName,
        ewayBillFile: ewayBillFile ? ewayDetails.publicId : existingAppointment.ewayBillFile,
        ewayBillFileUrl: ewayBillFile ? ewayDetails.url : existingAppointment.ewayBillFileUrl,
        ewayBillFileOriginalName: ewayBillFile ? ewayDetails.name : existingAppointment.ewayBillFileOriginalName,
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
// 📄 DOWNLOAD ROUTES - SIMPLE REDIRECT
// ============================================

// ===== VIEW PO PDF (Client) =====
router.get('/appointment/:id/download/po', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clientId: req.user._id
    });
    
    if (!appointment || !appointment.poFileUrl) {
      return res.status(404).send('File not found');
    }
    
    console.log('📥 View PO - URL:', appointment.poFileUrl);
    return res.redirect(appointment.poFileUrl);
    
  } catch (error) {
    console.error('❌ View PO Error:', error);
    res.status(500).send('Server error: ' + error.message);
  }
});

// ===== VIEW INVOICE PDF (Client) =====
router.get('/appointment/:id/download/invoice', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clientId: req.user._id
    });
    
    if (!appointment || !appointment.invoiceFileUrl) {
      return res.status(404).send('File not found');
    }
    
    console.log('📥 View Invoice - URL:', appointment.invoiceFileUrl);
    return res.redirect(appointment.invoiceFileUrl);
    
  } catch (error) {
    console.error('❌ View Invoice Error:', error);
    res.status(500).send('Server error: ' + error.message);
  }
});

// ===== VIEW E-WAY BILL PDF (Client) =====
router.get('/appointment/:id/download/ewaybill', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clientId: req.user._id
    });
    
    if (!appointment || !appointment.ewayBillFileUrl) {
      return res.status(404).send('File not found');
    }
    
    console.log('📥 View E-Way Bill - URL:', appointment.ewayBillFileUrl);
    return res.redirect(appointment.ewayBillFileUrl);
    
  } catch (error) {
    console.error('❌ View E-Way Bill Error:', error);
    res.status(500).send('Server error: ' + error.message);
  }
});

// ===== VIEW POD PDF (Client - View Only) =====
router.get('/appointment/:id/download/pod', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clientId: req.user._id
    });
    
    if (!appointment || !appointment.podFileUrl) {
      return res.status(404).send('File not found');
    }
    
    console.log('📥 View POD - URL:', appointment.podFileUrl);
    return res.redirect(appointment.podFileUrl);
    
  } catch (error) {
    console.error('❌ View POD Error:', error);
    res.status(500).send('Server error: ' + error.message);
  }
});

// ============================================
// 📥 FORCE DOWNLOAD ROUTES (Attachment)
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
    
    const downloadUrl = getDownloadUrl(appointment.poFile);
    console.log('📥 Force Download PO - URL:', downloadUrl);
    return res.redirect(downloadUrl);
    
  } catch (error) {
    console.error('❌ Force Download PO Error:', error);
    res.status(500).send('Server error: ' + error.message);
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
    
    const downloadUrl = getDownloadUrl(appointment.invoiceFile);
    console.log('📥 Force Download Invoice - URL:', downloadUrl);
    return res.redirect(downloadUrl);
    
  } catch (error) {
    console.error('❌ Force Download Invoice Error:', error);
    res.status(500).send('Server error: ' + error.message);
  }
});

// ===== FORCE DOWNLOAD E-WAY BILL PDF (Client) =====
router.get('/appointment/:id/download-attachment/ewaybill', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clientId: req.user._id
    });
    
    if (!appointment || !appointment.ewayBillFile) {
      return res.status(404).send('File not found');
    }
    
    const downloadUrl = getDownloadUrl(appointment.ewayBillFile);
    console.log('📥 Force Download E-Way Bill - URL:', downloadUrl);
    return res.redirect(downloadUrl);
    
  } catch (error) {
    console.error('❌ Force Download E-Way Bill Error:', error);
    res.status(500).send('Server error: ' + error.message);
  }
});

// ============================================
// DELETE - Delete Specific File (Client)
// ============================================
router.delete('/appointment/:id/file/:type', auth, async (req, res) => {
  try {
    const { id, type } = req.params;
    
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
    let urlField = '';
    let fileValue = '';
    
    switch(type) {
      case 'po':
        fileField = 'poFile';
        nameField = 'poFileOriginalName';
        urlField = 'poFileUrl';
        fileValue = appointment.poFile;
        break;
      case 'invoice':
        fileField = 'invoiceFile';
        nameField = 'invoiceFileOriginalName';
        urlField = 'invoiceFileUrl';
        fileValue = appointment.invoiceFile;
        break;
      case 'ewaybill':
        fileField = 'ewayBillFile';
        nameField = 'ewayBillFileOriginalName';
        urlField = 'ewayBillFileUrl';
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
    appointment[urlField] = '';
    await appointment.save();

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete File Error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// ============================================
// DELETE - Delete Appointment (Client)
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
      getFileUrl
    });
  } catch (error) {
    console.error('Appointment Details Error:', error);
    res.redirect('/client/dashboard');
  }
});

module.exports = router;