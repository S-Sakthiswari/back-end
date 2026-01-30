const Coupon = require('../models/Coupon');

exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { code, amount } = req.body;
    
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(), 
      isActive: true 
    });
    
    if (!coupon) {
      return res.json({ valid: false, message: 'Invalid coupon code' });
    }
    
    // Check validity dates
    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      return res.json({ valid: false, message: 'Coupon not yet valid' });
    }
    if (coupon.validUntil && now > coupon.validUntil) {
      return res.json({ valid: false, message: 'Coupon has expired' });
    }
    
    // Check minimum amount
    if (amount < coupon.minAmount) {
      return res.json({ 
        valid: false, 
        message: `Minimum order amount of ₹${coupon.minAmount} required` 
      });
    }
    
    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.json({ valid: false, message: 'Coupon usage limit exceeded' });
    }
    
    res.json({ valid: true, coupon });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.status(201).json({ data: coupon, message: 'Coupon created successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};