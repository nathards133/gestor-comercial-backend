const Sale = require('../models/Sale');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const NodeCache = require('node-cache');

// Cache com tempo de expiração de 5 minutos
const salesCache = new NodeCache({ stdTTL: 300 });

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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const userId = req.userId;

    const cacheKey = `sales_${userId}_${period}_${page}`;
    const cachedData = salesCache.get(cacheKey);

    if (cachedData) {
      return res.json(cachedData);
    }

    let startDate = new Date();
    let endDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      default:
        return res.status(400).json({ message: 'Período inválido' });
    }

    const firstSale = await Sale.findOne({ userId }).sort({ createdAt: 1 });
    const userStartDate = firstSale ? firstSale.createdAt : new Date();
    const isNewUser = (new Date() - userStartDate) < 90 * 24 * 60 * 60 * 1000; // 90 dias em milissegundos

    startDate = new Date(Math.max(startDate, userStartDate));

    const totalSales = await Sale.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      userId
    });

    const sales = await Sale.find({ 
      createdAt: { $gte: startDate, $lte: endDate },
      userId
    })
      .select('items.product items.quantity items.price totalValue createdAt') // Selecione apenas os campos necessários
      .populate('items.product', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(); // Adicione esta linha para obter objetos JavaScript simples

    const result = {
      sales: sales.map(sale => ({
        ...sale,
        items: sale.items.map(item => ({
          ...item,
          product: item.product ? item.product : { name: 'Produto não encontrado' }
        }))
      })),
      period: {
        start: startDate,
        end: endDate,
        isNewUser
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalSales / limit),
        totalItems: totalSales
      }
    };

    salesCache.set(cacheKey, result);

    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.getSalesStats = async (req, res) => {
  try {
    const cacheKey = `salesStats_${req.userId}`;
    const cachedStats = salesCache.get(cacheKey);

    if (cachedStats) {
      return res.json(cachedStats);
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const stats = await Sale.aggregate([
      { $match: { 
        userId: new mongoose.Types.ObjectId(req.userId),
        createdAt: { $gte: startOfDay }
      }},
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
      },
      { $limit: 10 } // Limita a 10 produtos mais vendidos
    ]);

    const totalSales = await Sale.aggregate([
      { $match: { 
        userId: new mongoose.Types.ObjectId(req.userId),
        createdAt: { $gte: startOfDay }
      }},
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$totalValue' },
          count: { $sum: 1 }
        }
      }
    ]);

    salesCache.set(cacheKey, { productStats: stats, totalSales });

    res.json({ productStats: stats, totalSales });
  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
