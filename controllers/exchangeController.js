const Exchange = require('../models/Exchange');

exports.createExchange = async (req, res) => {
  try {
    const exchange = new Exchange(req.body);
    await exchange.save();
    res.status(201).json({ data: exchange, message: 'Exchange created successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteExchange = async (req, res) => {
  try {
    const exchange = await Exchange.findByIdAndDelete(req.params.id);
    
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found' });
    }
    
    res.json({ message: 'Exchange deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};