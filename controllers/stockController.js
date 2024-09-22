const Product = require('../models/Product');

exports.addStock = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const product = await Product.findOne({ _id: productId, userId: req.userId });
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    product.quantity += quantity;
    await product.save();
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.removeStock = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const product = await Product.findOne({ _id: productId, userId: req.userId });
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }
    if (product.quantity < quantity) {
      return res.status(400).json({ message: 'Estoque insuficiente' });
    }
    product.quantity -= quantity;
    await product.save();
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.checkLowStock = async (req, res) => {
  try {
    const lowStockProducts = await Product.find({
      userId: req.userId,
      $expr: { $lte: ['$quantity', '$minStockLevel'] }
    });
    res.status(200).json(lowStockProducts);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
