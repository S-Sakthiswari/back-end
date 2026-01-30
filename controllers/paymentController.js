const Payment = require('../models/Payment');

exports.processPayment = async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    res.status(201).json({ data: payment, message: 'Payment processed successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};