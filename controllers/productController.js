const Product = require('../models/Product');
const xlsx = require('xlsx');

exports.createProduct = async (req, res) => {
  try {
    const { name, price, quantity, barcode } = req.body;
    const product = new Product({
      name,
      price,
      quantity,
      barcode,
      userId: req.userId 
    });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({ userId: req.userId });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, price, quantity } = req.body;
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, price: parseFloat(price), quantity: parseInt(quantity, 10) },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });
    res.json({ message: 'Produto removido com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.importProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo foi enviado.' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Remove o cabeçalho
    data.shift();

    const products = data.map(row => ({
      name: row[0],
      price: parseFloat(row[1]),
      quantity: parseInt(row[2], 10),
      barcode: row[3],
      minStockLevel: row[4] ? parseInt(row[4], 10) : 5,
      userId: req.userId
    }));

    // Validação básica
    const invalidProducts = products.filter(product => 
      !product.name || 
      isNaN(product.price) || 
      product.price <= 0 || 
      isNaN(product.quantity) || 
      product.quantity < 0 || 
      !product.barcode
    );

    if (invalidProducts.length > 0) {
      return res.status(400).json({ 
        message: 'Alguns produtos são inválidos', 
        invalidProducts 
      });
    }

    // Inserir produtos no banco de dados
    await Product.insertMany(products);

    res.status(201).json({ message: `${products.length} produtos importados com sucesso.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
