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
// CLOUDINARY CONFIG
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
// ============================================
const getCloudinaryUrl = (publicId) => {
    if (!publicId) return null;
    if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
        return publicId;
    }
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    return `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}`;
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
    return `https://res.cloudinary.com/${cloudName}/raw/upload/fl_attachment/${publicId}`;
};

// ============================================
// HELPER: Delete file from Cloudinary
// ============================================
const deleteFromCloudinary = async (publicId) => {
    if (!publicId) return;
    if (publicId.startsWith('http://') || publicId.startsWith('https://')) return;
    
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'raw'
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

// ============================================
// 📄 VIEW PDF ROUTES (Opens in browser - inline)
// ✅ FIXED: Using stored URL directly
// ============================================

// ===== VIEW PO PDF =====
router.get('/appointment/:id/download/po', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
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

// ===== VIEW INVOICE PDF =====
router.get('/appointment/:id/download/invoice', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
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

// ===== VIEW E-WAY BILL PDF =====
router.get('/appointment/:id/download/ewaybill', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
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

// ===== VIEW POD PDF =====
router.get('/appointment/:id/download/pod', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
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
// ✅ FIXED: Using fl_attachment flag for force download
// ============================================

// ===== FORCE DOWNLOAD PO PDF =====
router.get('/appointment/:id/download-attachment/po', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
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

// ===== FORCE DOWNLOAD INVOICE PDF =====
router.get('/appointment/:id/download-attachment/invoice', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
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

// ===== FORCE DOWNLOAD E-WAY BILL PDF =====
router.get('/appointment/:id/download-attachment/ewaybill', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
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

// ===== FORCE DOWNLOAD POD PDF =====
router.get('/appointment/:id/download-attachment/pod', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.podFile) {
      return res.status(404).send('File not found');
    }
    
    const downloadUrl = getDownloadUrl(appointment.podFile);
    console.log('📥 Force Download POD - URL:', downloadUrl);
    return res.redirect(downloadUrl);
    
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
// ✅ FIXED: Store both public_id and full URL
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

    // ✅ Get file details
    const getFileDetails = (file) => {
      if (!file) return { publicId: '', url: '', name: '' };
      const publicId = file.filename || file.path || '';
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const url = `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}`;
      return {
        publicId: publicId,
        url: url,
        name: file.originalname || ''
      };
    };

    const poFile = req.files?.poFile ? req.files.poFile[0] : null;
    const invoiceFile = req.files?.invoiceFile ? req.files.invoiceFile[0] : null;
    const ewayBillFile = req.files?.ewayBillFile ? req.files.ewayBillFile[0] : null;
    const podFile = req.files?.podFile ? req.files.podFile[0] : null;

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
    if (podFile && existingAppointment.podFile) {
      await deleteFromCloudinary(existingAppointment.podFile);
    }

    const poDetails = getFileDetails(poFile);
    const invoiceDetails = getFileDetails(invoiceFile);
    const ewayDetails = getFileDetails(ewayBillFile);
    const podDetails = getFileDetails(podFile);

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
        podFile: podFile ? podDetails.publicId : existingAppointment.podFile,
        podFileUrl: podFile ? podDetails.url : existingAppointment.podFileUrl,
        podFileOriginalName: podFile ? podDetails.name : existingAppointment.podFileOriginalName,
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
      getFileUrl
    });
  } catch (error) {
    console.error('Appointment Details Error:', error);
    res.redirect('/admin/dashboard?error=Failed to load appointment details!');
  }
});

// ============================================
// DELETE - Delete Appointment (Admin)
// ✅ FIXED: Delete URL fields too
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
// ✅ FIXED: Delete URL fields too
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
      case 'pod':
        fileField = 'podFile';
        nameField = 'podFileOriginalName';
        urlField = 'podFileUrl';
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
    appointment[urlField] = '';
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