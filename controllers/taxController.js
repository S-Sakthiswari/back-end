const TaxSlab = require('../models/TaxSlab');
const TaxEntry = require('../models/TaxEntry');
const { calculateGST, calculateGSTReturns } = require('../utils/gstCalculator');

// ============================================
// TAX SLABS CONTROLLERS
// ============================================

// Get all tax slabs (EXISTING - Enhanced with better response)
exports.getAllSlabs = async (req, res) => {
  try {
    const slabs = await TaxSlab.find().sort({ rate: 1 });
    res.status(200).json({
      success: true,
      count: slabs.length,
      data: slabs,
      cached: false // For frontend caching logic
    });
  } catch (error) {
    console.error('Error fetching tax slabs:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch tax slabs',
      message: error.message 
    });
  }
};

// 🆕 NEW: Get active tax slabs only (for billing dropdown)
exports.getActiveSlabs = async (req, res) => {
  try {
    const slabs = await TaxSlab.find({ status: 'active' }).sort({ rate: 1 });
    res.status(200).json({
      success: true,
      count: slabs.length,
      data: slabs
    });
  } catch (error) {
    console.error('Error fetching active tax slabs:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch active tax slabs',
      message: error.message 
    });
  }
};

// 🆕 NEW: Get default tax slab (for billing initial rate)
exports.getDefaultSlab = async (req, res) => {
  try {
    let slab = await TaxSlab.findOne({ isDefault: true, status: 'active' });
    
    // If no default found, use first active slab
    if (!slab) {
      slab = await TaxSlab.findOne({ status: 'active' }).sort({ rate: 1 });
    }
    
    if (!slab) {
      return res.status(404).json({ 
        success: false,
        error: 'No tax slabs found',
        message: 'Please create at least one tax slab'
      });
    }
    
    res.status(200).json({
      success: true,
      data: slab
    });
  } catch (error) {
    console.error('Error fetching default tax slab:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch default tax slab',
      message: error.message 
    });
  }
};

// 🆕 NEW: Get tax slab by ID
exports.getSlabById = async (req, res) => {
  try {
    const slab = await TaxSlab.findById(req.params.id);
    
    if (!slab) {
      return res.status(404).json({ 
        success: false,
        error: 'Tax slab not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: slab
    });
  } catch (error) {
    console.error('Error fetching tax slab:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch tax slab',
      message: error.message 
    });
  }
};

// Create tax slab (EXISTING - Enhanced with isDefault handling)
exports.createSlab = async (req, res) => {
  try {
    const { name, rate, category, hsnCode, type, description, status, isDefault } = req.body;
    
    // Validation
    if (!name || rate === undefined || !category) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields',
        required: ['name', 'rate', 'category']
      });
    }
    
    if (rate < 0 || rate > 100) {
      return res.status(400).json({ 
        success: false,
        error: 'Rate must be between 0 and 100' 
      });
    }
    
    // If this is set as default, unset other defaults
    if (isDefault) {
      await TaxSlab.updateMany(
        { isDefault: true },
        { $set: { isDefault: false } }
      );
    }
    
    const slab = new TaxSlab({
      name,
      rate,
      category,
      hsnCode: hsnCode || '',
      type: type || 'Regular',
      description: description || '',
      status: status || 'active',
      isDefault: isDefault || false
    });
    
    await slab.save();
    
    res.status(201).json({ 
      success: true,
      data: slab, 
      message: 'Tax slab created successfully' 
    });
  } catch (error) {
    console.error('Error creating tax slab:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        error: 'Duplicate tax slab',
        message: 'A tax slab with this name already exists'
      });
    }
    
    res.status(400).json({ 
      success: false,
      error: 'Failed to create tax slab',
      message: error.message 
    });
  }
};

// Update tax slab (EXISTING - Enhanced with isDefault handling)
exports.updateSlab = async (req, res) => {
  try {
    const { name, rate, category, hsnCode, type, description, status, isDefault } = req.body;
    
    // Validation
    if (rate !== undefined && (rate < 0 || rate > 100)) {
      return res.status(400).json({ 
        success: false,
        error: 'Rate must be between 0 and 100' 
      });
    }
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (rate !== undefined) updateData.rate = rate;
    if (category !== undefined) updateData.category = category;
    if (hsnCode !== undefined) updateData.hsnCode = hsnCode;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    
    // If this is set as default, unset other defaults
    if (isDefault) {
      await TaxSlab.updateMany(
        { _id: { $ne: req.params.id }, isDefault: true },
        { $set: { isDefault: false } }
      );
    }
    
    const slab = await TaxSlab.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!slab) {
      return res.status(404).json({ 
        success: false,
        error: 'Tax slab not found' 
      });
    }
    
    res.json({ 
      success: true,
      data: slab, 
      message: 'Tax slab updated successfully' 
    });
  } catch (error) {
    console.error('Error updating tax slab:', error);
    res.status(400).json({ 
      success: false,
      error: 'Failed to update tax slab',
      message: error.message 
    });
  }
};

// Delete tax slab (EXISTING - Enhanced)
exports.deleteSlab = async (req, res) => {
  try {
    const slab = await TaxSlab.findByIdAndDelete(req.params.id);
    
    if (!slab) {
      return res.status(404).json({ 
        success: false,
        error: 'Tax slab not found' 
      });
    }
    
    res.json({ 
      success: true,
      data: slab,
      message: 'Tax slab deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting tax slab:', error);
    res.status(400).json({ 
      success: false,
      error: 'Failed to delete tax slab',
      message: error.message 
    });
  }
};

// Toggle tax slab status (EXISTING - Enhanced)
exports.toggleSlabStatus = async (req, res) => {
  try {
    const slab = await TaxSlab.findById(req.params.id);
    
    if (!slab) {
      return res.status(404).json({ 
        success: false,
        error: 'Tax slab not found' 
      });
    }
    
    slab.status = slab.status === 'active' ? 'inactive' : 'active';
    await slab.save();
    
    res.json({ 
      success: true,
      data: slab, 
      message: `Tax slab ${slab.status === 'active' ? 'activated' : 'deactivated'} successfully` 
    });
  } catch (error) {
    console.error('Error toggling tax slab status:', error);
    res.status(400).json({ 
      success: false,
      error: 'Failed to toggle tax slab status',
      message: error.message 
    });
  }
};

// 🆕 NEW: Bulk create default tax slabs (for initial setup)
exports.bulkCreateSlabs = async (req, res) => {
  try {
    const defaultSlabs = [
      { 
        name: 'No GST', 
        rate: 0, 
        category: 'Exempted', 
        description: 'Zero-rated Goods', 
        type: 'Exempted', 
        status: 'active',
        hsnCode: ''
      },
      { 
        name: 'GST 5%', 
        rate: 5, 
        category: 'Essential Goods', 
        description: 'Essential items', 
        type: 'Regular', 
        status: 'active',
        hsnCode: ''
      },
      { 
        name: 'GST 12%', 
        rate: 12, 
        category: 'Standard', 
        description: 'Standard goods', 
        type: 'Regular', 
        status: 'active',
        hsnCode: ''
      },
      { 
        name: 'GST 18%', 
        rate: 18, 
        category: 'Standard', 
        description: 'General goods', 
        type: 'Regular', 
        status: 'active', 
        isDefault: true,
        hsnCode: ''
      },
      { 
        name: 'GST 28%', 
        rate: 28, 
        category: 'Luxury', 
        description: 'Luxury items', 
        type: 'Regular', 
        status: 'active',
        hsnCode: ''
      }
    ];
    
    const existingCount = await TaxSlab.countDocuments();
    if (existingCount > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Tax slabs already exist',
        message: `Found ${existingCount} existing tax slabs. Delete them first or use individual create endpoint.`
      });
    }
    
    const slabs = await TaxSlab.insertMany(defaultSlabs);
    
    res.status(201).json({
      success: true,
      message: `${slabs.length} default tax slabs created successfully`,
      count: slabs.length,
      data: slabs
    });
  } catch (error) {
    console.error('Error bulk creating tax slabs:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to bulk create tax slabs',
      message: error.message 
    });
  }
};

// ============================================
// TAX ENTRIES CONTROLLERS (EXISTING - Keep as is)
// ============================================

exports.getAllEntries = async (req, res) => {
  try {
    const {
      search,
      gstReturn,
      status,
      isInterState,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { invoiceNo: new RegExp(search, 'i') },
        { customer: new RegExp(search, 'i') },
        { gstin: new RegExp(search, 'i') }
      ];
    }
    
    if (gstReturn) query.gstReturn = gstReturn;
    if (status) query.status = status;
    if (isInterState !== undefined) query.isInterState = isInterState === 'true';
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const total = await TaxEntry.countDocuments(query);
    const entries = await TaxEntry.find(query)
      .populate('items.taxSlabId')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    res.json({
      success: true,
      data: entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tax entries:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch tax entries',
      message: error.message 
    });
  }
};

exports.createEntry = async (req, res) => {
  try {
    const entry = new TaxEntry(req.body);
    await entry.save();
    
    const populatedEntry = await TaxEntry.findById(entry._id).populate('items.taxSlabId');
    res.status(201).json({ 
      success: true,
      data: populatedEntry, 
      message: 'Tax entry created successfully' 
    });
  } catch (error) {
    console.error('Error creating tax entry:', error);
    res.status(400).json({ 
      success: false,
      error: 'Failed to create tax entry',
      message: error.message 
    });
  }
};

exports.updateEntry = async (req, res) => {
  try {
    const entry = await TaxEntry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('items.taxSlabId');
    
    if (!entry) {
      return res.status(404).json({ 
        success: false,
        error: 'Tax entry not found' 
      });
    }
    
    res.json({ 
      success: true,
      data: entry, 
      message: 'Tax entry updated successfully' 
    });
  } catch (error) {
    console.error('Error updating tax entry:', error);
    res.status(400).json({ 
      success: false,
      error: 'Failed to update tax entry',
      message: error.message 
    });
  }
};

exports.deleteEntry = async (req, res) => {
  try {
    const entry = await TaxEntry.findByIdAndDelete(req.params.id);
    
    if (!entry) {
      return res.status(404).json({ 
        success: false,
        error: 'Tax entry not found' 
      });
    }
    
    res.json({ 
      success: true,
      data: entry,
      message: 'Tax entry deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting tax entry:', error);
    res.status(400).json({ 
      success: false,
      error: 'Failed to delete tax entry',
      message: error.message 
    });
  }
};

exports.updateEntryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const entry = await TaxEntry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('items.taxSlabId');
    
    if (!entry) {
      return res.status(404).json({ 
        success: false,
        error: 'Tax entry not found' 
      });
    }
    
    res.json({ 
      success: true,
      data: entry, 
      message: 'Status updated successfully' 
    });
  } catch (error) {
    console.error('Error updating entry status:', error);
    res.status(400).json({ 
      success: false,
      error: 'Failed to update entry status',
      message: error.message 
    });
  }
};

// ============================================
// SUMMARY & REPORTS (EXISTING - Keep as is)
// ============================================

exports.getSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateQuery = {};
    if (startDate || endDate) {
      dateQuery.date = {};
      if (startDate) dateQuery.date.$gte = new Date(startDate);
      if (endDate) dateQuery.date.$lte = new Date(endDate);
    }
    
    const entries = await TaxEntry.find(dateQuery);
    
    const summary = {
      totalEntries: entries.length,
      totalTaxAmount: entries.reduce((sum, e) => sum + (e.totalTax || 0), 0),
      totalInvoiceValue: entries.reduce((sum, e) => sum + (e.totalAmount || 0), 0),
      avgTaxRate: 0,
      returnStats: {
        'GSTR-1': { count: 0, tax: 0, amount: 0 },
        'GSTR-2': { count: 0, tax: 0, amount: 0 },
        'GSTR-2A': { count: 0, tax: 0, amount: 0 },
        'GSTR-2B': { count: 0, tax: 0, amount: 0 },
        'GSTR-3B': { count: 0, tax: 0, amount: 0 }
      }
    };
    
    if (summary.totalInvoiceValue > 0) {
      summary.avgTaxRate = summary.totalTaxAmount / summary.totalInvoiceValue;
    }
    
    entries.forEach(entry => {
      if (summary.returnStats[entry.gstReturn]) {
        summary.returnStats[entry.gstReturn].count += 1;
        summary.returnStats[entry.gstReturn].tax += entry.totalTax || 0;
        summary.returnStats[entry.gstReturn].amount += entry.totalAmount || 0;
      }
    });
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch summary',
      message: error.message 
    });
  }
};

exports.generateGSTR1 = async (req, res) => {
  try {
    const { gstin, month, year } = req.body;
    
    if (!gstin || !month || !year) {
      return res.status(400).json({ 
        success: false,
        error: 'GSTIN, month, and year are required' 
      });
    }
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const entries = await TaxEntry.find({
      gstReturn: 'GSTR-1',
      date: { $gte: startDate, $lte: endDate }
    }).populate('items.taxSlabId');
    
    const report = calculateGSTReturns(entries, 'GSTR-1', gstin, month, year);
    
    res.json({ 
      success: true,
      data: report, 
      message: 'GSTR-1 generated successfully' 
    });
  } catch (error) {
    console.error('Error generating GSTR-1:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate GSTR-1',
      message: error.message 
    });
  }
};

exports.generateGSTR2 = async (req, res) => {
  try {
    const { gstin, month, year } = req.body;
    
    if (!gstin || !month || !year) {
      return res.status(400).json({ 
        success: false,
        error: 'GSTIN, month, and year are required' 
      });
    }
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const entries = await TaxEntry.find({
      gstReturn: 'GSTR-2',
      date: { $gte: startDate, $lte: endDate }
    }).populate('items.taxSlabId');
    
    const report = calculateGSTReturns(entries, 'GSTR-2', gstin, month, year);
    
    res.json({ 
      success: true,
      data: report, 
      message: 'GSTR-2 generated successfully' 
    });
  } catch (error) {
    console.error('Error generating GSTR-2:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate GSTR-2',
      message: error.message 
    });
  }
};

module.exports = exports;