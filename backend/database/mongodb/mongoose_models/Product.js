const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'Uncategorized',
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Base selling price is required'],
    min: [0, 'Price cannot be negative']
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: [0, 'Threshold cannot be negative']
  }
}, {
  timestamps: true // Automatically generates createdAt and updatedAt fields
});

// Create search index for category and product name lookup
ProductSchema.index({ name: 'text', sku: 'text', category: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
