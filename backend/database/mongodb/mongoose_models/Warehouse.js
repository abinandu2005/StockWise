const mongoose = require('mongoose');

const WarehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Warehouse name is required'],
    unique: true,
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Warehouse address location is required']
  },
  contact: {
    phone: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Warehouse', WarehouseSchema);
