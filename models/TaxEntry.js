const mongoose = require('mongoose');

const taxEntrySchema = new mongoose.Schema({
  invoiceNo: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true
  },
  customer: {
    type: String,
    required: true
  },
  gstin: String,
  items: [{
    name: String,
    quantity: Number,
    price: Number,
    taxSlabId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxSlab'
    },
    hsn: String
  }],
  isInterState: {
    type: Boolean,
    default: false
  },
  taxableValue: {
    type: Number,
    required: true
  },
  totalTax: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  gstReturn: {
    type: String,
    enum: ['GSTR-1', 'GSTR-2', 'GSTR-2A', 'GSTR-2B', 'GSTR-3B'],
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending', 'Paid', 'Cancelled'],
    default: 'Draft'
  },
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('TaxEntry', taxEntrySchema);