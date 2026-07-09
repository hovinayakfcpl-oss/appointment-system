const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const upload = require('../utils/mongoStorage'); // ✅ CHANGED
const { uploadFile, deleteFile } = require('../utils/mongoStorage');
const mongoose = require('mongoose');

// ============================================
// HELPER: Get file URL (for EJS templates)
// ============================================
const getFileUrl = (appointment, type) => {
    const fileMap = {
        'po': appointment.poFileId,
        'invoice': appointment.invoiceFileId,
        'ewaybill': appointment.ewayBillFileId,
        'pod': appointment.podFileId
    };
    const fileId = fileMap[type];
    if (!fileId) return null;
    return `/file/${fileId}`;
};

// ============================================
// HELPER: Get download URL (for EJS templates)
// ============================================
const getDownloadUrl = (appointment, type) => {
    const fileMap = {
        'po': appointment.poFileId,
        'invoice': appointment.invoiceFileId,
        'ewaybill': appointment.ewayBillFileId,
        'pod': appointment.podFileId
    };
    const fileId = fileMap[type];
    if (!fileId) return null;
    return `/file/${fileId}/download`;
};

// ============================================
// 📄 VIEW PDF ROUTES (MongoDB)
// ============================================

// ===== VIEW PO PDF =====
router.get('/appointment/:id/download/po', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.poFileId) {
      return res.status(404).send('File not found');
    }
    
    return res.redirect(`/file/${appointment.poFileId}`);
    
  } catch (error) {
    console.error('❌ View PO Error:', error);
    res.status(500).send('Server error: ' + error.message);
  }
});

// ===== VIEW INVOICE PDF =====
router.get('/appointment/:id/download/invoice', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.invoiceFileId) {
      return res.status(404).send('File not found');
    }
    
    return res.redirect(`/file/${appointment.invoiceFileId}`);
    
  } catch (error) {
    console.error('❌ View Invoice Error:', error);
    res.status(500).send('Server error: ' + error.message);
  }
});

// ===== VIEW E-WAY BILL PDF =====
router.get('/appointment/:id/download/ewaybill', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.ewayBillFileId) {
      return res.status(404).send('File not found');
    }
    
    return res.redirect(`/file/${appointment.ewayBillFileId}`);
    
  } catch (error) {
    console.error('❌ View E-Way Bill Error:', error);
    res.status(500).send('Server error: ' + error.message);
  }
});

// ===== VIEW POD PDF =====
router.get('/appointment/:id/download/pod', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.podFileId) {
      return res.status(404).send('File not found');
    }
    
    return res.redirect(`/file/${appointment.podFileId}`);
    
  } catch (error) {
    console.error('❌ View POD Error:', error);
    res.status(500).send('Server error: ' + error.message);
  }
});

// ============================================
// 📥 FORCE DOWNLOAD ROUTES (Attachment)
// ============================================

// ===== FORCE DOWNLOAD PO PDF =====
router.get('/appointment/:id/download-attachment/po', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.poFileId) {
      return res.status(404).send('File not found');
    }
    
    return res.redirect(`/file/${appointment.poFileId}/download`);
    
  } catch (error) {
    console.error('❌ Force Download PO Error:', error);
    res.status(500).send('Server error: ' + error.message);
  }
});

// ===== FORCE DOWNLOAD INVOICE PDF =====
router.get('/appointment/:id/download-attachment/invoice', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.invoiceFileId) {
      return res.status(404).send('File not found');
    }
    
    return res.redirect(`/file/${appointment.invoiceFileId}/download`);
    
  } catch (error) {
    console.error('❌ Force Download Invoice Error:', error);
    res.status(500).send('Server error: ' + error.message);
  }
});

// ===== FORCE DOWNLOAD E-WAY BILL PDF =====
router.get('/appointment/:id/download-attachment/ewaybill', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.ewayBillFileId) {
      return res.status(404).send('File not found');
    }
    
    return res.redirect(`/file/${appointment.ewayBillFileId}/download`);
    
  } catch (error) {
    console.error('❌ Force Download E-Way Bill Error:', error);
    res.status(500).send('Server error: ' + error.message);
  }
});

// ===== FORCE DOWNLOAD POD PDF =====
router.get('/appointment/:id/download-attachment/pod', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.podFileId) {
      return res.status(404).send('File not found');
    }
    
    return res.redirect(`/file/${appointment.podFileId}/download`);
    
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
// ✅ FIXED: Using MongoDB storage
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

    // ✅ Get uploaded files
    const poFile = req.files?.poFile ? req.files.poFile[0] : null;
    const invoiceFile = req.files?.invoiceFile ? req.files.invoiceFile[0] : null;
    const ewayBillFile = req.files?.ewayBillFile ? req.files.ewayBillFile[0] : null;
    const podFile = req.files?.podFile ? req.files.podFile[0] : null;

    // ✅ Delete old files from MongoDB if new ones are uploaded
    if (poFile && existingAppointment.poFileId) {
      await deleteFile(existingAppointment.poFileId);
    }
    if (invoiceFile && existingAppointment.invoiceFileId) {
      await deleteFile(existingAppointment.invoiceFileId);
    }
    if (ewayBillFile && existingAppointment.ewayBillFileId) {
      await deleteFile(existingAppointment.ewayBillFileId);
    }
    if (podFile && existingAppointment.podFileId) {
      await deleteFile(existingAppointment.podFileId);
    }

    // ✅ Upload new files
    const poDetails = poFile ? await uploadFile(poFile) : { id: null, name: '' };
    const invoiceDetails = invoiceFile ? await uploadFile(invoiceFile) : { id: null, name: '' };
    const ewayDetails = ewayBillFile ? await uploadFile(ewayBillFile) : { id: null, name: '' };
    const podDetails = podFile ? await uploadFile(podFile) : { id: null, name: '' };

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
        // ✅ Store MongoDB file IDs
        poFileId: poFile ? poDetails.id : existingAppointment.poFileId,
        poFileOriginalName: poFile ? poDetails.name : existingAppointment.poFileOriginalName,
        invoiceFileId: invoiceFile ? invoiceDetails.id : existingAppointment.invoiceFileId,
        invoiceFileOriginalName: invoiceFile ? invoiceDetails.name : existingAppointment.invoiceFileOriginalName,
        ewayBillFileId: ewayBillFile ? ewayDetails.id : existingAppointment.ewayBillFileId,
        ewayBillFileOriginalName: ewayBillFile ? ewayDetails.name : existingAppointment.ewayBillFileOriginalName,
        podFileId: podFile ? podDetails.id : existingAppointment.podFileId,
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
      getFileUrl,
      getDownloadUrl
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
    
    // ✅ Delete files from MongoDB
    const fileIds = [
      appointment.poFileId,
      appointment.invoiceFileId,
      appointment.ewayBillFileId,
      appointment.podFileId
    ];
    
    for (const fileId of fileIds) {
      if (fileId) {
        await deleteFile(fileId);
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
    let fileId = null;
    
    switch(type) {
      case 'po':
        fileField = 'poFileId';
        nameField = 'poFileOriginalName';
        fileId = appointment.poFileId;
        break;
      case 'invoice':
        fileField = 'invoiceFileId';
        nameField = 'invoiceFileOriginalName';
        fileId = appointment.invoiceFileId;
        break;
      case 'ewaybill':
        fileField = 'ewayBillFileId';
        nameField = 'ewayBillFileOriginalName';
        fileId = appointment.ewayBillFileId;
        break;
      case 'pod':
        fileField = 'podFileId';
        nameField = 'podFileOriginalName';
        fileId = appointment.podFileId;
        break;
      default:
        return res.status(400).json({ error: 'Invalid file type' });
    }

    // ✅ Delete from MongoDB
    if (fileId) {
      await deleteFile(fileId);
    }

    appointment[fileField] = null;
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