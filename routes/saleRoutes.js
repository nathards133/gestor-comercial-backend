const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const auth = require('../middleware/auth'); 
router.post('/', auth, saleController.createSale);
router.get('/:period', auth, saleController.getSales);

module.exports = router;
