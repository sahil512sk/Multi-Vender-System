const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
import { request } from '../utils';

export const productApi = {
    getCategories: () => request('/products/categories'),
    createCategory: (payload) => request('/products/categories', { method: 'POST', body: JSON.stringify(payload) }),

    getSubCategories: (categoryId) =>
        request(`/products/subcategories${categoryId ? `?category_id=${categoryId}` : ''}`),
    createSubCategory: (payload) =>
        request('/products/subcategories', { method: 'POST', body: JSON.stringify(payload) }),

    getProducts: (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.categoryId) params.append('category_id', filters.categoryId);
        if (filters.subCategoryId) params.append('sub_category_id', filters.subCategoryId);
        if (filters.search) params.append('search', filters.search);
        return request(`/products/products${params.toString() ? `?${params}` : ''}`);
    },
    createProduct: (payload) =>
        request('/products/products', { method: 'POST', body: JSON.stringify(payload) }),
};
