const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth'); 
const multer = require('multer');
const upload = multer();

router.post('/', auth, productController.createProduct); 
router.get('/', auth, productController.getProducts);
router.put('/:id', auth, productController.updateProduct);
router.delete('/:id', auth, productController.deleteProduct);
router.post('/import', auth(['admin']), upload.single('file'), productController.importProducts);

module.exports = router;
