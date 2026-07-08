const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const upload = require('../utils/upload');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

// ============================================
// CLOUDINARY CONFIG - RE-CONFIGURE
// ============================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('☁️ Cloudinary Config (admin.js):', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '❌ Not Set',
  api_key: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Not Set'
});

// ============================================
// HELPER: Get Cloudinary URL for file
// ✅ FIXED: Using 'raw' resource_type (since files uploaded as raw)
// ============================================
const getCloudinaryUrl = (publicId) => {
    if (!publicId) return null;
    if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
        return publicId;
    }
    // ✅ Using 'raw' resource_type
    return cloudinary.url(publicId, {
        secure: true,
        resource_type: 'raw', // ✅ CHANGED: 'image' → 'raw'
        format: 'pdf'
    });
};

// ============================================
// HELPER: Delete file from Cloudinary
// ✅ FIXED: Using 'raw' resource_type
// ============================================
const deleteFromCloudinary = async (publicId) => {
    if (!publicId) return;
    if (publicId.startsWith('http://') || publicId.startsWith('https://')) return;
    
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'raw' // ✅ CHANGED: 'image' → 'raw'
        });
        console.log(`🗑️ Cloudinary delete result for ${publicId}:`, result);
        return result;
    } catch (error) {
        console.error('❌ Cloudinary delete error:', error);
    }
};

// ============================================
// 📄 VIEW PDF ROUTES (Opens in browser - inline)
// ✅ FIXED: Using direct redirect (simpler and works with raw)
// ============================================

// ===== VIEW PO PDF =====
router.get('/appointment/:id/download/po', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.poFile) {
      return res.status(404).send('File not found');
    }
    
    console.log('📥 View PO:', appointment.poFile);
    
    // ✅ Generate direct Cloudinary URL with raw type
    const fileUrl = cloudinary.url(appointment.poFile, {
        secure: true,
        resource_type: 'raw',
        format: 'pdf'
    });
    
    console.log('📄 URL:', fileUrl);
    
    // ✅ Redirect to Cloudinary (works with raw files)
    return res.redirect(fileUrl);
    
  } catch (error) {
    console.error('❌ View PO Error:', error);
    res.status(500).send('Server error: ' + error.message);
  }
});

// ===== VIEW INVOICE PDF =====
router.get('/appointment/:id/download/invoice', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.invoiceFile) {
      return res.status(404).send('File not found');
    }
    
    console.log('📥 View Invoice:', appointment.invoiceFile);
    
    const fileUrl = cloudinary.url(appointment.invoiceFile, {
        secure: true,
        resource_type: 'raw',
        format: 'pdf'
    });
    
    console.log('📄 URL:', fileUrl);
    return res.redirect(fileUrl);
    
  } catch (error) {
    console.error('❌ View Invoice Error:', error);
    res.status(500).send('Server error: ' + error.message);
  }
});

// ===== VIEW E-WAY BILL PDF =====
router.get('/appointment/:id/download/ewaybill', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.ewayBillFile) {
      return res.status(404).send('File not found');
    }
    
    console.log('📥 View E-Way Bill:', appointment.ewayBillFile);
    
    const fileUrl = cloudinary.url(appointment.ewayBillFile, {
        secure: true,
        resource_type: 'raw',
        format: 'pdf'
    });
    
    console.log('📄 URL:', fileUrl);
    return res.redirect(fileUrl);
    
  } catch (error) {
    console.error('❌ View E-Way Bill Error:', error);
    res.status(500).send('Server error: ' + error.message);
  }
});

// ===== VIEW POD PDF =====
router.get('/appointment/:id/download/pod', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.podFile) {
      return res.status(404).send('File not found');
    }
    
    console.log('📥 View POD:', appointment.podFile);
    
    const fileUrl = cloudinary.url(appointment.podFile, {
        secure: true,
        resource_type: 'raw',
        format: 'pdf'
    });
    
    console.log('📄 URL:', fileUrl);
    return res.redirect(fileUrl);
    
  } catch (error) {
    console.error('❌ View POD Error:', error);
    res.status(500).send('Server error: ' + error.message);
  }
});

// ============================================
// 📥 FORCE DOWNLOAD ROUTES (Attachment)
// ✅ FIXED: Using flags: 'attachment' for force download
// ============================================

// ===== FORCE DOWNLOAD PO PDF =====
router.get('/appointment/:id/download-attachment/po', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.poFile) {
      return res.status(404).send('File not found');
    }
    
    console.log('📥 Force Download PO:', appointment.poFile);
    
    // ✅ Add flags: 'attachment' for force download
    const fileUrl = cloudinary.url(appointment.poFile, {
        secure: true,
        resource_type: 'raw',
        format: 'pdf',
        flags: 'attachment'
    });
    
    console.log('📄 Download URL:', fileUrl);
    return res.redirect(fileUrl);
    
  } catch (error) {
    console.error('❌ Force Download PO Error:', error);
    res.status(500).send('Server error: ' + error.message);
  }
});

// ===== FORCE DOWNLOAD INVOICE PDF =====
router.get('/appointment/:id/download-attachment/invoice', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.invoiceFile) {
      return res.status(404).send('File not found');
    }
    
    console.log('📥 Force Download Invoice:', appointment.invoiceFile);
    
    const fileUrl = cloudinary.url(appointment.invoiceFile, {
        secure: true,
        resource_type: 'raw',
        format: 'pdf',
        flags: 'attachment'
    });
    
    console.log('📄 Download URL:', fileUrl);
    return res.redirect(fileUrl);
    
  } catch (error) {
    console.error('❌ Force Download Invoice Error:', error);
    res.status(500).send('Server error: ' + error.message);
  }
});

// ===== FORCE DOWNLOAD E-WAY BILL PDF =====
router.get('/appointment/:id/download-attachment/ewaybill', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.ewayBillFile) {
      return res.status(404).send('File not found');
    }
    
    console.log('📥 Force Download E-Way Bill:', appointment.ewayBillFile);
    
    const fileUrl = cloudinary.url(appointment.ewayBillFile, {
        secure: true,
        resource_type: 'raw',
        format: 'pdf',
        flags: 'attachment'
    });
    
    console.log('📄 Download URL:', fileUrl);
    return res.redirect(fileUrl);
    
  } catch (error) {
    console.error('❌ Force Download E-Way Bill Error:', error);
    res.status(500).send('Server error: ' + error.message);
  }
});

// ===== FORCE DOWNLOAD POD PDF =====
router.get('/appointment/:id/download-attachment/pod', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.podFile) {
      return res.status(404).send('File not found');
    }
    
    console.log('📥 Force Download POD:', appointment.podFile);
    
    const fileUrl = cloudinary.url(appointment.podFile, {
        secure: true,
        resource_type: 'raw',
        format: 'pdf',
        flags: 'attachment'
    });
    
    console.log('📄 Download URL:', fileUrl);
    return res.redirect(fileUrl);
    
  } catch (error) {
    console.error('❌ Force Download POD Error:', error);
    res.status(500).send('Server error: ' + error.message);
  }
});

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
// POST - Update Appointment (Admin Direct) with File Upload
// ✅ FIXED: Changed from PUT to POST
// ============================================
router.post('/appointment/:id/admin-update', adminAuth, upload.fields([
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

    if (!poNumber || !invoiceNumber || !deliveryDate || !deliveryAddress) {
      return res.redirect('/admin/dashboard?error=Please fill in all required fields');
    }

    const existingAppointment = await Appointment.findById(req.params.id);
    if (!existingAppointment) {
      return res.redirect('/admin/dashboard?error=Appointment not found!');
    }

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
    const podFile = req.files?.podFile ? req.files.podFile[0] : null;

    if (poFile && existingAppointment.poFile) {
      await deleteFromCloudinary(existingAppointment.poFile);
    }
    if (invoiceFile && existingAppointment.invoiceFile) {
      await deleteFromCloudinary(existingAppointment.invoiceFile);
    }
    if (ewayBillFile && existingAppointment.ewayBillFile) {
      await deleteFromCloudinary(existingAppointment.ewayBillFile);
    }
    if (podFile && existingAppointment.podFile) {
      await deleteFromCloudinary(existingAppointment.podFile);
    }

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
        poFile: poFile ? getFilePublicId(poFile) : existingAppointment.poFile,
        poFileOriginalName: poFile ? getFileName(poFile) : existingAppointment.poFileOriginalName,
        invoiceFile: invoiceFile ? getFilePublicId(invoiceFile) : existingAppointment.invoiceFile,
        invoiceFileOriginalName: invoiceFile ? getFileName(invoiceFile) : existingAppointment.invoiceFileOriginalName,
        ewayBillFile: ewayBillFile ? getFilePublicId(ewayBillFile) : existingAppointment.ewayBillFile,
        ewayBillFileOriginalName: ewayBillFile ? getFileName(ewayBillFile) : existingAppointment.ewayBillFileOriginalName,
        podFile: podFile ? getFilePublicId(podFile) : existingAppointment.podFile,
        podFileOriginalName: podFile ? getFileName(podFile) : existingAppointment.podFileOriginalName,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!updatedAppointment) {
      return res.redirect('/admin/dashboard?error=Appointment not found!');
    }

    console.log('✅ Admin Update Success!');
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
      appointment,
      getCloudinaryUrl
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
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.redirect('/admin/dashboard?error=Appointment not found!');
    }
    
    const files = [
      appointment.poFile,
      appointment.invoiceFile,
      appointment.ewayBillFile,
      appointment.podFile
    ];
    
    for (const file of files) {
      if (file && !file.startsWith('http://') && !file.startsWith('https://')) {
        await deleteFromCloudinary(file);
      }
    }
    
    await Appointment.findByIdAndDelete(req.params.id);
    
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
      case 'pod':
        fileField = 'podFile';
        nameField = 'podFileOriginalName';
        fileValue = appointment.podFile;
        break;
      default:
        return res.status(400).json({ error: 'Invalid file type' });
    }

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