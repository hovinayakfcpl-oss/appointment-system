const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.redirect('/login');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.redirect('/login');
    }
    req.user = user;
    next();
  } catch (error) {
    res.redirect('/login');
  }
};

const adminAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.redirect('/login');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || user.role !== 'admin') {
      return res.status(403).send('Access Denied! Admin only.');
    }
    req.user = user;
    next();
  } catch (error) {
    res.redirect('/login');
  }
};

module.exports = { auth, adminAuth };