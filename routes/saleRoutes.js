const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const auth = require('../middleware/auth');  // Importe o middleware de autenticação

router.get('/stats', auth, saleController.getSalesStats);
router.get('/:period', auth, saleController.getSales);
router.post('/', auth, saleController.createSale);

module.exports = router;
