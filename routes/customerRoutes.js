const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// ============================================
// GET ALL CUSTOMERS
// ============================================
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      customers: customers,
      count: customers.length
    });
  } catch (error) {
    console.error('❌ Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message
    });
  }
});

// ============================================
// SEARCH CUSTOMERS
// ============================================
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const customers = await Customer.searchCustomers(q);
    
    res.status(200).json({
      success: true,
      customers: customers,
      count: customers.length
    });
  } catch (error) {
    console.error('❌ Error searching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search customers',
      error: error.message
    });
  }
});

// ============================================
// GET SINGLE CUSTOMER
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.status(200).json({
      success: true,
      customer: customer
    });
  } catch (error) {
    console.error('❌ Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error: error.message
    });
  }
});

// ============================================
// CREATE CUSTOMER
// ============================================
router.post('/', async (req, res) => {
  try {
    console.log('📥 Received customer data:', req.body);
    
    if (!req.body.name || !req.body.name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required'
      });
    }
    
    const customerData = {
      name: req.body.name.trim(),
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };
    
    if (req.body.phone && req.body.phone.trim()) {
      customerData.phone = req.body.phone.trim();
    }
    
    if (req.body.email && req.body.email.trim()) {
      customerData.email = req.body.email.trim().toLowerCase();
    }
    
    if (req.body.address && req.body.address.trim()) {
      customerData.address = req.body.address.trim();
    }
    
    if (req.body.city && req.body.city.trim()) {
      customerData.city = req.body.city.trim();
    }
    
    if (req.body.state && req.body.state.trim()) {
      customerData.state = req.body.state.trim();
    }
    
    if (req.body.pincode && req.body.pincode.trim()) {
      customerData.pincode = req.body.pincode.trim();
    }
    
    console.log('💾 Creating customer with data:', customerData);
    
    const customer = new Customer(customerData);
    await customer.save();
    
    console.log('✅ Customer created:', customer);
    
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer: customer
    });
  } catch (error) {
    console.error('❌ Error creating customer:', error);
    console.error('❌ Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
        error: error.message
      });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Customer with this ${field} already exists`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ============================================
// UPDATE CUSTOMER (including status)
// ============================================
router.put('/:id', async (req, res) => {
  try {
    console.log('📥 Updating customer:', req.params.id);
    console.log('📥 Update data:', req.body);
    
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Update name if provided
    if (req.body.name !== undefined) {
      if (!req.body.name || !req.body.name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Customer name is required'
        });
      }
      customer.name = req.body.name.trim();
    }
    
    // Update isActive status
    if (req.body.isActive !== undefined) {
      customer.isActive = Boolean(req.body.isActive);
    }
    
    // Update optional fields
    if (req.body.phone !== undefined) {
      customer.phone = req.body.phone ? req.body.phone.trim() : '';
    }
    
    if (req.body.email !== undefined) {
      customer.email = req.body.email ? req.body.email.trim().toLowerCase() : '';
    }
    
    if (req.body.address !== undefined) {
      customer.address = req.body.address ? req.body.address.trim() : '';
    }
    
    if (req.body.city !== undefined) {
      customer.city = req.body.city ? req.body.city.trim() : '';
    }
    
    if (req.body.state !== undefined) {
      customer.state = req.body.state ? req.body.state.trim() : '';
    }
    
    if (req.body.pincode !== undefined) {
      customer.pincode = req.body.pincode ? req.body.pincode.trim() : '';
    }
    
    await customer.save();
    
    console.log('✅ Customer updated:', customer);
    
    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      customer: customer
    });
  } catch (error) {
    console.error('❌ Error updating customer:', error);
    console.error('❌ Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message
    });
  }
});

// ============================================
// TOGGLE CUSTOMER STATUS (dedicated endpoint)
// ============================================
router.patch('/:id/status', async (req, res) => {
  try {
    console.log('🔄 Toggling status for customer:', req.params.id);
    
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Toggle or set specific status
    if (req.body.isActive !== undefined) {
      customer.isActive = Boolean(req.body.isActive);
    } else {
      customer.isActive = !customer.isActive;
    }
    
    await customer.save();
    
    console.log('✅ Customer status updated:', customer.isActive);
    
    res.status(200).json({
      success: true,
      message: `Customer ${customer.isActive ? 'activated' : 'deactivated'} successfully`,
      customer: customer
    });
  } catch (error) {
    console.error('❌ Error toggling customer status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer status',
      error: error.message
    });
  }
});

// ============================================
// DELETE CUSTOMER
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ Deleting customer:', req.params.id);
    
    const customer = await Customer.findByIdAndDelete(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    console.log('✅ Customer deleted');
    
    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: error.message
    });
  }
});

// ============================================
// GET CUSTOMER STATISTICS
// ============================================
router.get('/stats/summary', async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({ isActive: true });
    const inactiveCustomers = await Customer.countDocuments({ isActive: false });
    
    const totalPurchases = await Customer.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPurchases' }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      stats: {
        total: totalCustomers,
        active: activeCustomers,
        inactive: inactiveCustomers,
        totalPurchaseValue: totalPurchases.length > 0 ? totalPurchases[0].total : 0
      }
    });
  } catch (error) {
    console.error('❌ Error fetching customer stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer statistics',
      error: error.message
    });
  }
});

module.exports = router;
