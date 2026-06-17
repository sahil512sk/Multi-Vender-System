import express from 'express';

import upload from '../middleware/upload.js';
import { createProduct, fetchProducts } from '../controller/productController.js';
import { createCategory, fetchCategories } from '../controller/categoryController.js';
import { createSubCategory, fetchSubCategories } from '../controller/subCategoryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.post('/categories', protect, createCategory);
router.get('/categories', protect, fetchCategories);
router.post('/subcategories', protect, createSubCategory);
router.get('/subcategories', protect, fetchSubCategories);
router.post('/', protect, upload.array('images', 10), createProduct);
router.get('/', protect, fetchProducts);

export default router;