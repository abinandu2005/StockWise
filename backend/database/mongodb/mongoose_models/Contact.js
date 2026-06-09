const mongoose = require('mongoose');
const TransactionSummarySchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  orderNumber: {
    type: String,
    required: true
  },
  orderType: {
    type: String,
    enum: ['Purchase', 'Sales'],
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const ContactSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Supplier', 'Customer'],
    required: [true, 'Contact type (Supplier/Customer) is required']
  },
  name: {
    type: String,
    required: [true, 'Contact/Business name is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zip: { type: String, default: '' }
  },
  pricingTier: {
    type: String,
    enum: ['Standard', 'Silver', 'Gold', 'VIP'],
    default: 'Standard'
  },
  agreement: {
    discountPercentage: {
      type: Number,
      default: 0.0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    },
    paymentTerms: {
      type: String,
      default: 'COD' // Cash on Delivery, NET30, etc.
    },
    notes: {
      type: String,
      default: ''
    }
  },
  transactionSummary: [TransactionSummarySchema] // Keeps last 5-10 orders embedded for speedy CRM loading
}, {
  timestamps: true
});

// Create search indexes for quick CRM search bar searches
ContactSchema.index({ name: 'text', email: 'text', type: 1 });

module.exports = mongoose.model('Contact', ContactSchema);
