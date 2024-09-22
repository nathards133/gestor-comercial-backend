const Supplier = require('../models/Supplier');

exports.createSupplier = async (req, res) => {
  try {
    const supplier = new Supplier({
      ...req.body,
      userId: req.userId
    });
    await supplier.save();
    res.status(201).json(supplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ userId: req.userId });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ _id: req.params.id, userId: req.userId });
    if (!supplier) return res.status(404).json({ message: 'Fornecedor não encontrado' });
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!supplier) return res.status(404).json({ message: 'Fornecedor não encontrado' });
    res.json(supplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!supplier) return res.status(404).json({ message: 'Fornecedor não encontrado' });
    res.json({ message: 'Fornecedor removido com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
