require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const app = express();

// ============================================
// CLOUDINARY CONFIG
// ============================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('☁️ Cloudinary Config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '❌ Not Set',
  api_key: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Not Set'
});

// ============================================
// MIDDLEWARE
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'partials/layout');

// ============================================
// IMPORT MODELS & ROUTES
// ============================================
const User = require('./models/User');
const Appointment = require('./models/Appointment');

const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/client');
const adminRoutes = require('./routes/admin');

// ============================================
// DATABASE CONNECTION
// ============================================
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');
    // Create admin if not exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      const admin = new User({
        name: 'Super Admin',
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Admin created successfully!');
      console.log('📧 Email: ' + process.env.ADMIN_EMAIL);
      console.log('🔑 Password: ' + process.env.ADMIN_PASSWORD);
    }
  })
  .catch(err => console.log('❌ MongoDB Error:', err));

// ============================================
// ROUTES
// ============================================
app.use('/', authRoutes);
app.use('/client', clientRoutes);
app.use('/admin', adminRoutes);

// ============================================
// 📄 DOWNLOAD ROUTE - VIEW PDF IN BROWSER
// ✅ FIXED: Using 'image' resource_type for proper PDF viewing
// ============================================
app.get('/download/:publicId', async (req, res) => {
    try {
        const { publicId } = req.params;
        
        console.log('📥 View PDF requested for:', publicId);
        
        // ✅ FIXED: Using 'image' resource_type
        const url = cloudinary.url(publicId, {
            secure: true,
            resource_type: 'image', // ✅ CHANGED: 'raw' → 'image'
            format: 'pdf'
        });
        
        console.log('📄 PDF URL:', url);
        
        // Fetch the PDF from Cloudinary
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Cloudinary error: ${response.status}`);
        }
        
        const buffer = await response.arrayBuffer();
        
        // ✅ Set proper headers for PDF viewing
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${publicId}.pdf"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        
        res.send(Buffer.from(buffer));
        
    } catch (error) {
        console.error('❌ View PDF error:', error);
        res.status(500).send(`
            <h2>❌ Failed to Load PDF</h2>
            <p>Error: ${error.message}</p>
            <p><a href="javascript:history.back()">← Go Back</a></p>
        `);
    }
});

// ============================================
// 📥 DOWNLOAD ATTACHMENT ROUTE - Force Download
// ============================================
app.get('/download-attachment/:publicId', async (req, res) => {
    try {
        const { publicId } = req.params;
        
        console.log('📥 Download attachment requested for:', publicId);
        
        // ✅ FIXED: Using 'image' resource_type
        const url = cloudinary.url(publicId, {
            secure: true,
            resource_type: 'image', // ✅ CHANGED: 'raw' → 'image'
            format: 'pdf'
        });
        
        console.log('📄 PDF URL:', url);
        
        // Fetch the PDF from Cloudinary
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Cloudinary error: ${response.status}`);
        }
        
        const buffer = await response.arrayBuffer();
        
        // ✅ Force download instead of view
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${publicId}.pdf"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        
        res.send(Buffer.from(buffer));
        
    } catch (error) {
        console.error('❌ Download error:', error);
        res.status(500).send(`
            <h2>❌ Download Failed</h2>
            <p>Error: ${error.message}</p>
            <p><a href="javascript:history.back()">← Go Back</a></p>
        `);
    }
});

// ============================================
// 🔗 SIGNED URL ROUTE (For private files)
// ============================================
app.get('/download-signed/:publicId', async (req, res) => {
    try {
        const { publicId } = req.params;
        
        console.log('🔗 Signed URL requested for:', publicId);
        
        // Generate signed URL (valid for 60 seconds)
        const signedUrl = cloudinary.url(publicId, {
            secure: true,
            sign_url: true,
            expires_at: Math.floor(Date.now() / 1000) + 60,
            resource_type: 'image', // ✅ CHANGED: 'raw' → 'image'
            format: 'pdf'
        });
        
        console.log('✅ Signed URL generated successfully');
        res.redirect(signedUrl);
        
    } catch (error) {
        console.error('❌ Signed URL error:', error);
        res.status(500).send(`
            <h2>❌ Failed to Generate Download Link</h2>
            <p>Error: ${error.message}</p>
            <p><a href="javascript:history.back()">← Go Back</a></p>
        `);
    }
});

// ============================================
// HOME ROUTE
// ============================================
app.get('/', (req, res) => {
    res.redirect('/login');
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📄 View PDF: http://localhost:${PORT}/download/PUBLIC_ID`);
    console.log(`📥 Download: http://localhost:${PORT}/download-attachment/PUBLIC_ID`);
    console.log(`🔗 Signed URL: http://localhost:${PORT}/download-signed/PUBLIC_ID`);
});