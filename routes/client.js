const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const { uploadFile, deleteFile } = require('../utils/mongoStorage'); 
const upload = require('../utils/mongoStorage');

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

    const poFile = req.files?.poFile ? req.files.poFile[0] : null;
    const invoiceFile = req.files?.invoiceFile ? req.files.invoiceFile[0] : null;
    const ewayBillFile = req.files?.ewayBillFile ? req.files.ewayBillFile[0] : null;

    const poDetails = poFile ? await uploadFile(poFile) : { id: null, name: '' };
    const invoiceDetails = invoiceFile ? await uploadFile(invoiceFile) : { id: null, name: '' };
    const ewayDetails = ewayBillFile ? await uploadFile(ewayBillFile) : { id: null, name: '' };

    console.log('📄 PO File ID:', poDetails.id || 'No file');
    console.log('📄 Invoice File ID:', invoiceDetails.id || 'No file');
    console.log('📄 E-Way Bill File ID:', ewayDetails.id || 'No file');

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
      poFileId: poDetails.id,
      poFileOriginalName: poDetails.name,
      invoiceFileId: invoiceDetails.id,
      invoiceFileOriginalName: invoiceDetails.name,
      ewayBillFileId: ewayDetails.id,
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
// ✅ GET - Edit Appointment Form (Client)
// ============================================
router.get('/appointment/:id/edit', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clientId: req.user._id
    });
    
    if (!appointment) {
      return res.redirect('/client/dashboard?error=Appointment not found!');
    }
    
    res.render('clientAppointmentForm', {
      title: 'Edit Appointment',
      user: req.user,
      appointment,
      appointmentId: appointment.appointmentId,
      isEdit: true
    });
  } catch (error) {
    console.error('Edit Appointment Error:', error);
    res.redirect('/client/dashboard?error=Failed to load appointment!');
  }
});

// ============================================
// ✅ PUT - Update Appointment (Client)
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

    const poFile = req.files?.poFile ? req.files.poFile[0] : null;
    const invoiceFile = req.files?.invoiceFile ? req.files.invoiceFile[0] : null;
    const ewayBillFile = req.files?.ewayBillFile ? req.files.ewayBillFile[0] : null;

    if (poFile && existingAppointment.poFileId) {
      await deleteFile(existingAppointment.poFileId);
    }
    if (invoiceFile && existingAppointment.invoiceFileId) {
      await deleteFile(existingAppointment.invoiceFileId);
    }
    if (ewayBillFile && existingAppointment.ewayBillFileId) {
      await deleteFile(existingAppointment.ewayBillFileId);
    }

    const poDetails = poFile ? await uploadFile(poFile) : { id: null, name: '' };
    const invoiceDetails = invoiceFile ? await uploadFile(invoiceFile) : { id: null, name: '' };
    const ewayDetails = ewayBillFile ? await uploadFile(ewayBillFile) : { id: null, name: '' };

    console.log('📄 PO File ID:', poDetails.id || 'No file');
    console.log('📄 Invoice File ID:', invoiceDetails.id || 'No file');
    console.log('📄 E-Way Bill File ID:', ewayDetails.id || 'No file');

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
        poFileId: poFile ? poDetails.id : existingAppointment.poFileId,
        poFileOriginalName: poFile ? poDetails.name : existingAppointment.poFileOriginalName,
        invoiceFileId: invoiceFile ? invoiceDetails.id : existingAppointment.invoiceFileId,
        invoiceFileOriginalName: invoiceFile ? invoiceDetails.name : existingAppointment.invoiceFileOriginalName,
        ewayBillFileId: ewayBillFile ? ewayDetails.id : existingAppointment.ewayBillFileId,
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
// 📄 DOWNLOAD ROUTES
// ============================================

// ===== VIEW PO PDF (Client) =====
router.get('/appointment/:id/download/po', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      clientId: req.user._id
    });
    
    if (!appointment || !appointment.poFileId) {
      return res.status(404).send('File not found');
    }
    
    console.log('📥 View PO - File ID:', appointment.poFileId);
    return res.redirect(`/file/${appointment.poFileId}`);
    
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
    
    if (!appointment || !appointment.invoiceFileId) {
      return res.status(404).send('File not found');
    }
    
    console.log('📥 View Invoice - File ID:', appointment.invoiceFileId);
    return res.redirect(`/file/${appointment.invoiceFileId}`);
    
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
    
    if (!appointment || !appointment.ewayBillFileId) {
      return res.status(404).send('File not found');
    }
    
    console.log('📥 View E-Way Bill - File ID:', appointment.ewayBillFileId);
    return res.redirect(`/file/${appointment.ewayBillFileId}`);
    
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
    
    if (!appointment || !appointment.podFileId) {
      return res.status(404).send('File not found');
    }
    
    console.log('📥 View POD - File ID:', appointment.podFileId);
    return res.redirect(`/file/${appointment.podFileId}`);
    
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
    
    if (!appointment || !appointment.poFileId) {
      return res.status(404).send('File not found');
    }
    
    console.log('📥 Force Download PO - File ID:', appointment.poFileId);
    return res.redirect(`/file/${appointment.poFileId}/download`);
    
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
    
    if (!appointment || !appointment.invoiceFileId) {
      return res.status(404).send('File not found');
    }
    
    console.log('📥 Force Download Invoice - File ID:', appointment.invoiceFileId);
    return res.redirect(`/file/${appointment.invoiceFileId}/download`);
    
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
    
    if (!appointment || !appointment.ewayBillFileId) {
      return res.status(404).send('File not found');
    }
    
    console.log('📥 Force Download E-Way Bill - File ID:', appointment.ewayBillFileId);
    return res.redirect(`/file/${appointment.ewayBillFileId}/download`);
    
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
      default:
        return res.status(400).json({ error: 'Invalid file type' });
    }

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

    const fileIds = [
      appointment.poFileId,
      appointment.invoiceFileId,
      appointment.ewayBillFileId
    ];
    
    for (const fileId of fileIds) {
      if (fileId) {
        await deleteFile(fileId);
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
      getFileUrl,
      getDownloadUrl
    });
  } catch (error) {
    console.error('Appointment Details Error:', error);
    res.redirect('/client/dashboard');
  }
});

module.exports = router;