const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 🔐 Check JWT_SECRET exists
if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is not defined in environment variables");
}

// ==============================
// 🔐 Verify JWT token middleware
// ==============================
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error("🔴 TOKEN VERIFY ERROR:", error.message);

    return res.status(401).json({
      success: false,
      message: 'Not authorized, token invalid'
    });
  }
};

// ==============================
// 🔒 Role-based access
// ==============================
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
};

// ==============================
// 🎟️ Generate JWT token
// ==============================
const generateToken = (id, role) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET missing");
    }

    return jwt.sign(
      { id, role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

  } catch (error) {
    console.error("🔴 TOKEN GENERATION ERROR:", error.message);
    throw error; // important → so controller catches it
  }
};

module.exports = { protect, requireRole, generateToken };
