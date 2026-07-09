require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

const app = express();

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
const fileRoutes = require('./routes/file'); // ✅ ADD THIS

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
// ROUTES - ORDER MATTERS!
// ============================================
app.use('/', fileRoutes);      // ✅ File routes - MUST BE FIRST
app.use('/', authRoutes);
app.use('/client', clientRoutes);
app.use('/admin', adminRoutes);

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
});