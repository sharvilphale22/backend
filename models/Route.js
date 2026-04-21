const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  order: { type: Number, required: true }
}, { _id: false });

const routeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Route name is required'],
    trim: true
  },
  stops: [stopSchema],
  startPoint: {
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  endPoint: {
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Route', routeSchema);
