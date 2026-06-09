const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference ID is required']
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: [true, 'Warehouse reference ID is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock quantity cannot be less than zero'],
    default: 0
  },
  version: {
    type: Number,
    required: true,
    default: 1 // Crucial for Optimistic Concurrency Control
  }
}, {
  timestamps: true
});

// Enforce compound unique index: one inventory entry per product per warehouse
InventorySchema.index({ productId: 1, warehouseId: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', InventorySchema);
