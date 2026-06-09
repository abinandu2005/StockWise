const mongoose = require('mongoose');

// Embedded order item sub-schema
const OrderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  sku: {
    type: String,
    required: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: true
  }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderType: {
    type: String,
    enum: ['Purchase', 'Sales'],
    required: [true, 'Order type (Purchase/Sales) is required']
  },
  orderNumber: {
    type: String,
    required: [true, 'Order reference number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  contact: {
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      required: [true, 'Contact ID is required']
    },
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['Supplier', 'Customer'],
      required: true
    }
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: [true, 'Source/Destination Warehouse is required']
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  items: [OrderItemSchema], // Embedded array for premium performance
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  createdByUserId: {
    type: Number, // Reference to SQL users(user_id) table!
    required: [true, 'Creator SQL user ID is required']
  },
  orderDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Custom helper: Pre-calculate totalAmount before saving
OrderSchema.pre('save', function(next) {
  this.totalAmount = this.items.reduce((sum, item) => {
    item.totalPrice = item.quantity * item.unitPrice;
    return sum + item.totalPrice;
  }, 0);
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
