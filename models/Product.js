// models/Product.js

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: [true, 'Product ID is required'],
      unique: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^PRD-\d{9}$/.test(v);
        },
        message: props => `${props.value} is not a valid product ID! Format should be PRD-XXXXXXXXX`
      }
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    minStock: {
      type: Number,
      required: [true, 'Minimum stock is required'],
      min: [1, 'Minimum stock must be at least 1'],
      default: 5
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: ''
    },
    image: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// =====================================================
// INDEXES
// =====================================================

productSchema.index({
  name: 'text',
  category: 'text',
  description: 'text',
  productId: 'text'
});

productSchema.index({ category: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ price: 1 });

// =====================================================
// VIRTUALS
// =====================================================

productSchema.virtual('stockStatus').get(function () {
  if (this.stock <= 0) return 'Out of Stock';
  if (this.stock <= this.minStock) return 'Low Stock';
  return 'In Stock';
});

productSchema.virtual('totalValue').get(function () {
  return this.price * this.stock;
});

// =====================================================
// METHODS
// =====================================================

productSchema.methods.isLowStock = function () {
  return this.stock > 0 && this.stock <= this.minStock;
};

productSchema.methods.isOutOfStock = function () {
  return this.stock <= 0;
};

productSchema.methods.updateStock = function (quantity) {
  this.stock += quantity;
  return this.save();
};

// =====================================================
// STATICS
// =====================================================

productSchema.statics.findLowStock = function () {
  return this.find({
    $expr: {
      $and: [
        { $gt: ['$stock', 0] },
        { $lte: ['$stock', '$minStock'] }
      ]
    }
  });
};

productSchema.statics.findOutOfStock = function () {
  return this.find({ stock: { $lte: 0 } });
};

productSchema.statics.findByCategory = function (category) {
  return this.find({ category: { $regex: new RegExp(category, 'i') } });
};

module.exports = mongoose.model('Product', productSchema);
