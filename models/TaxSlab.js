const mongoose = require('mongoose');

const taxSlabSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  category: {
    type: String,
    required: true,
    enum: ['Essential Goods', 'Standard', 'Luxury', 'Services', 'Special', 'Exempted']
  },
  hsnCode: String,
  type: {
    type: String,
    enum: ['Regular', 'Compounded', 'Exempted', 'Nil Rated'],
    default: 'Regular'
  },
  description: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TaxSlab', taxSlabSchema);