import { Router } from 'express';

import { createProduct } from '../controller/productController.js';
import { createCategory, getCategories } from '../controller/categoryController.js';
import { createSubCategory } from '../controller/subCategoryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
console.log('Product route loaded');
router.post('/categories', protect, createCategory);
console.log('Create category route loaded');
router.get('/categories', protect, getCategories);
router.post('/subcategories', protect, createSubCategory);
router.get('/subcategories', protect, createSubCategory);
router.post('/products', protect, createProduct);
router.get('/products', protect, createProduct);

export default router;