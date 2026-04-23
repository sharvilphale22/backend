const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// @desc    Register a new admin
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Create admin user
    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      role: 'admin'
    });

    // Generate token
    const token = generateToken(user._id, user.role);

    // Send response
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('REGISTER ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};


// @desc    Login user (all roles)
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    // Send response
    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        erpId: user.erpId,
        assignedBus: user.assignedBus,
        pickupPoint: user.pickupPoint,
        dropPoint: user.dropPoint,
        isOnline: user.isOnline
      }
    });

  } catch (error) {
    console.error('LOGIN ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};


// @desc    Get current user profile
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('assignedBus');

    return res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('GET ME ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user',
      error: error.message
    });
  }
};
