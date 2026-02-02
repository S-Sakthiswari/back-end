const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v || v === '') return true; // Allow empty
        // Remove spaces and dashes, then check if exactly 10 digits
        const cleaned = v.replace(/[\s-]/g, '');
        return /^[0-9]{10}$/.test(cleaned) && cleaned.length === 10;
      },
      message: 'Phone number must be exactly 10 digits'
    },
    maxlength: [10, 'Phone number cannot exceed 10 digits']
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  city: {
    type: String,
    trim: true,
    default: ''
  },
  state: {
    type: String,
    trim: true,
    default: ''
  },
  pincode: {
    type: String,
    trim: true,
    default: ''
  },
  totalPurchases: {
    type: Number,
    default: 0
  },
  lastPurchaseDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Middleware to clean phone number before validation
customerSchema.pre('validate', function() {
  if (this.phone) {
    // Remove all spaces and dashes
    this.phone = this.phone.replace(/[\s-]/g, '');
  }
});

// Generate unique customer ID before saving
customerSchema.pre('save', async function() {
  if (!this.customerId) {
    try {
      const count = await mongoose.model('Customer').countDocuments();
      this.customerId = `CUST${String(count + 1).padStart(6, '0')}`;
      
      let existing = await mongoose.model('Customer').findOne({ customerId: this.customerId });
      let attempts = 0;
      
      while (existing && attempts < 10) {
        this.customerId = `CUST${String(count + 1 + attempts).padStart(6, '0')}`;
        existing = await mongoose.model('Customer').findOne({ customerId: this.customerId });
        attempts++;
      }
      
      if (attempts >= 10) {
        throw new Error('Failed to generate unique customer ID after multiple attempts');
      }
    } catch (error) {
      console.error('Error generating customerId:', error);
      throw error;
    }
  }
});

// Indexes
customerSchema.index({ customerId: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ name: 1 });
customerSchema.index({ isActive: 1 });

// Virtual for full address
customerSchema.virtual('fullAddress').get(function() {
  const parts = [this.address, this.city, this.state, this.pincode].filter(Boolean);
  return parts.join(', ');
});

// Instance method to update purchase stats
customerSchema.methods.updatePurchaseStats = async function(amount) {
  this.totalPurchases += amount;
  this.lastPurchaseDate = new Date();
  await this.save();
};

// Static method to search customers
customerSchema.statics.searchCustomers = async function(query) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    $or: [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { customerId: searchRegex },
      { address: searchRegex }
    ]
  }).sort({ createdAt: -1 });
};

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
