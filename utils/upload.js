// ============================================
// DOWNLOAD ROUTES - SIMPLE & WORKING
// ============================================

// ===== DOWNLOAD PO PDF =====
router.get('/appointment/:id/download/po', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.poFile) {
      return res.status(404).send('File not found');
    }
    
    // ✅ Cloudinary URL - Direct redirect
    if (appointment.poFile && appointment.poFile.includes('cloudinary')) {
      console.log('📁 Cloudinary URL:', appointment.poFile);
      return res.redirect(appointment.poFile);
    }
    
    return res.status(404).send('File not found');
  } catch (error) {
    console.error('Download Error:', error);
    res.status(500).send('Server error');
  }
});

// ===== DOWNLOAD INVOICE PDF =====
router.get('/appointment/:id/download/invoice', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.invoiceFile) {
      return res.status(404).send('File not found');
    }
    
    if (appointment.invoiceFile && appointment.invoiceFile.includes('cloudinary')) {
      console.log('📁 Cloudinary URL:', appointment.invoiceFile);
      return res.redirect(appointment.invoiceFile);
    }
    
    return res.status(404).send('File not found');
  } catch (error) {
    console.error('Download Error:', error);
    res.status(500).send('Server error');
  }
});

// ===== DOWNLOAD E-WAY BILL PDF =====
router.get('/appointment/:id/download/ewaybill', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.ewayBillFile) {
      return res.status(404).send('File not found');
    }
    
    if (appointment.ewayBillFile && appointment.ewayBillFile.includes('cloudinary')) {
      console.log('📁 Cloudinary URL:', appointment.ewayBillFile);
      return res.redirect(appointment.ewayBillFile);
    }
    
    return res.status(404).send('File not found');
  } catch (error) {
    console.error('Download Error:', error);
    res.status(500).send('Server error');
  }
});

// ===== DOWNLOAD POD PDF =====
router.get('/appointment/:id/download/pod', adminAuth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment || !appointment.podFile) {
      return res.status(404).send('File not found');
    }
    
    if (appointment.podFile && appointment.podFile.includes('cloudinary')) {
      console.log('📁 Cloudinary URL:', appointment.podFile);
      return res.redirect(appointment.podFile);
    }
    
    return res.status(404).send('File not found');
  } catch (error) {
    console.error('Download Error:', error);
    res.status(500).send('Server error');
  }
});