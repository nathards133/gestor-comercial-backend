const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const auth = require('../middleware/auth');

router.post('/add', auth, stockController.addStock);
router.post('/remove', auth, stockController.removeStock);
router.get('/low-stock', auth, stockController.checkLowStock);

module.exports = router;
