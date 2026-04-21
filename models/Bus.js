const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: [true, 'Bus number is required'],
    unique: true,
    trim: true
  },
  licensePlate: {
    type: String,
    required: [true, 'License plate is required'],
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: 1
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    default: null
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'moving', 'stopped'],
    default: 'inactive'
  },
  currentLocation: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    updatedAt: { type: Date, default: null }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Bus', busSchema);
