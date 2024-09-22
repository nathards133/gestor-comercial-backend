const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const auth = require('../middleware/auth');

router.post('/add', stockController.addStock);
router.post('/remove', stockController.removeStock);
router.get('/low-stock', stockController.checkLowStock);

module.exports = router;
