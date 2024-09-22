const Sale = require('../models/Sale');
const Product = require('../models/Product');
const mongoose = require('mongoose');

exports.createSale = async (req, res) => {
  try {
    const { items } = req.body;
    const sale = new Sale({
      items: items.map(item => ({
        product: item._id,
        quantity: item.quantidade,
        price: item.price
      })),
      totalValue: items.reduce((acc, item) => acc + item.price * item.quantidade, 0),
      userId: req.userId
    });
    await sale.save();

    // Atualizar o estoque dos produtos
    for (let item of items) {
      await Product.findOneAndUpdate(
        { _id: item._id, userId: req.userId },
        { $inc: { quantity: -item.quantidade } }
      );
    }

    res.status(201).json(sale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getSales = async (req, res) => {
  try {
    const { period } = req.params;
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        return res.status(400).json({ message: 'Período inválido' });
    }

    const sales = await Sale.find({ 
      createdAt: { $gte: startDate },
      userId: req.userId
    })
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });

    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSalesStats = async (req, res) => {
  try {
    const stats = await Sale.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalValue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $project: {
          name: '$productInfo.name',
          totalQuantity: 1,
          totalValue: 1
        }
      }
    ]);

    const totalSales = await Sale.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$totalValue' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      productStats: stats,
      totalSales: totalSales[0] || { totalValue: 0, count: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
