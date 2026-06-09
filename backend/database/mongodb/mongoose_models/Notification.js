const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['LowStockAlert', 'EmailLog'],
    required: true,
    default: 'LowStockAlert'
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  warehouseName: {
    type: String,
    required: true
  },
  currentStock: {
    type: Number,
    required: true
  },
  threshold: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Resolved'],
    default: 'Active'
  },
  emailDetails: {
    sentTo: { type: String, default: '' },
    sentAt: { type: Date },
    subject: { type: String, default: '' },
    body: { type: String, default: '' }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema);
