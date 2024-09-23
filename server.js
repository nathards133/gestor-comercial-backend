require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const auth = require('./middleware/auth');

const app = express();

app.use(compression());
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'gestor-comercial-backend.vercel.app',
    'http://localhost:3000'
],
  credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from API!' });
});

const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
const stockRoutes = require('./routes/stockRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');

app.use('/api/auth', authRoutes);

app.use('/api/products', auth, productRoutes);
app.use('/api/sales', auth, saleRoutes);
app.use('/api/suppliers', auth, supplierRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/reports', auth, reportRoutes);

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
