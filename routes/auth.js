const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// GET - Login Page
router.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

// GET - Signup Page
router.get('/signup', (req, res) => {
  res.render('signup', { title: 'Sign Up' });
});

// POST - Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('signup', { 
        title: 'Sign Up', 
        error: 'Email already exists!' 
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'client'
    });
    await user.save();
    res.redirect('/login');
  } catch (error) {
    res.render('signup', { 
      title: 'Sign Up', 
      error: 'Something went wrong!' 
    });
  }
});

// POST - Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('login', { 
        title: 'Login', 
        error: 'Invalid credentials!' 
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('login', { 
        title: 'Login', 
        error: 'Invalid credentials!' 
      });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.cookie('token', token, { 
      httpOnly: true, 
      maxAge: 7 * 24 * 60 * 60 * 1000 
    });
    if (user.role === 'admin') {
      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/client/dashboard');
    }
  } catch (error) {
    res.render('login', { 
      title: 'Login', 
      error: 'Something went wrong!' 
    });
  }
});

// GET - Logout
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

module.exports = router;