const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 4,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'driver', 'student'],
    required: true
  },
  erpId: {
    type: String,
    trim: true,
    sparse: true
  },
  phone: {
    type: String,
    trim: true
  },
  assignedBus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    default: null
  },
  pickupPoint: {
    type: String,
    default: ''
  },
  dropPoint: {
    type: String,
    default: ''
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  currentLocation: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    updatedAt: { type: Date, default: null }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
