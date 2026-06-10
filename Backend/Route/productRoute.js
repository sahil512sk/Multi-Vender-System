import { Router } from 'express';

import { createProduct, fetchProducts } from '../controller/productController.js';
import { createCategory, fetchCategories } from '../controller/categoryController.js';
import { createSubCategory, fetchSubCategories } from '../controller/subCategoryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.post('/categories', protect, createCategory);
router.get('/categories', protect, fetchCategories);
router.post('/subcategories', protect, createSubCategory);
router.get('/subcategories', protect, fetchSubCategories);
router.post('/products', protect, createProduct);
router.get('/products', protect, fetchProducts);

export default router;