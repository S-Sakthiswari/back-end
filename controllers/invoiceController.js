const Invoice = require('../models/Invoice');
const Product = require('../models/Product');

exports.getAllInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    res.json({
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createInvoice = async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    await invoice.save();
    
    // Update product stock
    for (const item of invoice.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }
    
    res.status(201).json({
      success: true,
      data: invoice,
      invoice: invoice,
      message: 'Invoice created successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json({ data: invoice, message: 'Invoice updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};