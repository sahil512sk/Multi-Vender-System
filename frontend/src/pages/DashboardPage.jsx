import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { productApi } from '../api/products';
import '../styles/dashboard.css';

const roleColor = { buyer: '#2563eb', vendor: '#7c3aed', admin: '#dc2626' };
const roleIcon  = { buyer: '🛒', vendor: '🏪', admin: '🛡' };

const DashboardPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState('catalog'); // 'profile' or 'catalog'
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState({});
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedCategories, setExpandedCategories] = useState({});

    // Modal states
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', price: '', attributes: {} });

    const canAddProducts = ['vendor', 'admin'].includes(user?.role);
    const canAddCategories = user?.role === 'admin';

    // Fetch categories
    const loadCategories = async () => {
        try {
            setLoading(true);
            const res = await productApi.getCategories();
            setCategories(res.data || []);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch subcategories for a category
    const loadSubCategories = async (categoryId) => {
        try {
            const res = await productApi.getSubCategories(categoryId);
            setSubCategories(prev => ({
                ...prev,
                [categoryId]: res.data || []
            }));
        } catch (err) {
            console.error('Error fetching subcategories:', err);
        }
    };

    // Fetch products
    const loadProducts = async (filters = {}) => {
        try {
            setLoading(true);
            const res = await productApi.getProducts(filters);
            setProducts(res.data || []);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        if (selectedCategory && !expandedCategories[selectedCategory]) {
            loadSubCategories(selectedCategory);
            setExpandedCategories(prev => ({ ...prev, [selectedCategory]: true }));
        }
    }, [selectedCategory]);

    useEffect(() => {
        if (view === 'catalog') {
            loadProducts({
                categoryId: selectedCategory,
                subCategoryId: selectedSubCategory,
                search: searchTerm
            });
        }
    }, [selectedCategory, selectedSubCategory, searchTerm, view]);

    const handleCategoryToggle = (categoryId) => {
        if (!expandedCategories[categoryId]) {
            loadSubCategories(categoryId);
        }
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        try {
            await productApi.createCategory({ name: formData.name });
            setFormData({ name: '', price: '', attributes: {} });
            setShowCategoryModal(false);
            loadCategories();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleAddSubCategory = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !selectedCategory) return;
        try {
            await productApi.createSubCategory({
                name: formData.name,
                category_id: selectedCategory
            });
            setFormData({ name: '', price: '', attributes: {} });
            setShowSubCategoryModal(false);
            loadSubCategories(selectedCategory);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.price || !selectedSubCategory || !selectedCategory) {
            alert('Please fill in all required fields');
            return;
        }
        try {
            await productApi.createProduct({
                name: formData.name,
                price: parseFloat(formData.price),
                category_id: selectedCategory,
                sub_category_id: selectedSubCategory,
                attributes: formData.attributes
            });
            setFormData({ name: '', price: '', attributes: {} });
            setShowProductModal(false);
            loadProducts({ categoryId: selectedCategory, subCategoryId: selectedSubCategory });
        } catch (err) {
            alert(err.message);
        }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    if (!user) return null;

    if (view === 'profile') {
        return (
            <div className="dashboard">
                <div className="dash-hero">
                    <div className="dash-avatar" style={{ background: roleColor[user.role] }}>
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="dash-name">{user.name}</h1>
                        <span className="role-badge-lg" style={{ background: roleColor[user.role] }}>
                            {roleIcon[user.role]} {user.role}
                        </span>
                    </div>
                </div>

                <div className="dash-cards">
                    <div className="info-card">
                        <p className="info-label">User ID</p>
                        <p className="info-value mono">{user.id || user._id}</p>
                    </div>
                    <div className="info-card">
                        <p className="info-label">Email</p>
                        <p className="info-value">{user.email || '—'}</p>
                    </div>
                    <div className="info-card">
                        <p className="info-label">Mobile</p>
                        <p className="info-value">{user.mobile || '—'}</p>
                    </div>
                    <div className="info-card">
                        <p className="info-label">Status</p>
                        <p className="info-value">
                            <span className={`status-dot ${user.isActive ? 'active' : 'inactive'}`} />
                            {user.isActive ? 'Active' : 'Inactive'}
                        </p>
                    </div>
                    {user.createdAt && (
                        <div className="info-card">
                            <p className="info-label">Member since</p>
                            <p className="info-value">{new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                    )}
                </div>

                <div className="dash-actions">
                    <button className="btn-primary" onClick={() => setView('catalog')}>Back to Catalog</button>
                    <button className="btn-danger-outline" onClick={handleLogout}>Logout</button>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-catalog">
            <header className="dash-header">
                <div className="user-info">
                    <div className="avatar" style={{ background: roleColor[user.role] }}>
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2>{user.name}</h2>
                        <span className="role-badge" style={{ background: roleColor[user.role] }}>
                            {roleIcon[user.role]} {user.role}
                        </span>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-outline" onClick={() => setView('profile')}>Profile</button>
                    <button className="btn-danger-outline" onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <main className="catalog-container">
                <div className="sidebar">
                    <div className="sidebar-header">
                        <h3>📂 Categories</h3>
                        {canAddCategories && (
                            <button className="btn-small" onClick={() => setShowCategoryModal(true)}>+ Add</button>
                        )}
                    </div>
                    <div className="categories-list">
                        {categories.length === 0 ? (
                            <p className="empty-state">No categories yet</p>
                        ) : (
                            categories.map(cat => (
                                <div key={cat._id} className="category-item">
                                    <button
                                        className={`cat-btn ${selectedCategory === cat._id ? 'active' : ''}`}
                                        onClick={() => setSelectedCategory(cat._id)}
                                    >
                                        {cat.name}
                                    </button>
                                    {selectedCategory === cat._id && (
                                        <div className="subcategories">
                                            <button
                                                className="toggle-btn"
                                                onClick={() => handleCategoryToggle(cat._id)}
                                            >
                                                {expandedCategories[cat._id] ? '▼' : '▶'} Subcategories
                                                {canAddProducts && <span className="add-badge" onClick={(e) => { e.stopPropagation(); setShowSubCategoryModal(true); }}>+</span>}
                                            </button>
                                            {expandedCategories[cat._id] && (subCategories[cat._id] || []).map(subCat => (
                                                <button
                                                    key={subCat._id}
                                                    className={`subcat-btn ${selectedSubCategory === subCat._id ? 'active' : ''}`}
                                                    onClick={() => setSelectedSubCategory(subCat._id)}
                                                >
                                                    {subCat.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="content">
                    <div className="content-header">
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="🔍 Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {canAddProducts && (
                            <button className="btn-primary" onClick={() => setShowProductModal(true)}>
                                ➕ Add Product
                            </button>
                        )}
                    </div>

                    {error && <div className="error-message">❌ {error}</div>}

                    <div className="products-grid">
                        {loading ? (
                            <p className="loading">Loading...</p>
                        ) : products.length === 0 ? (
                            <p className="empty-state">No products found</p>
                        ) : (
                            products.map(product => (
                                <div key={product._id} className="product-card">
                                    <div className="product-header">
                                        <h4>{product.name}</h4>
                                    </div>
                                    <div className="product-body">
                                        <p className="price">₹{product.price}</p>
                                        <p className="category-tag">{product.category_id?.name || 'N/A'}</p>
                                        <p className="subcategory-tag">{product.sub_category_id?.name || 'N/A'}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            {/* Modals */}
            {showCategoryModal && (
                <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Add New Category</h3>
                        <form onSubmit={handleAddCategory}>
                            <input
                                type="text"
                                placeholder="Category name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <div className="modal-actions">
                                <button type="submit" className="btn-primary">Add</button>
                                <button type="button" className="btn-outline" onClick={() => setShowCategoryModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showSubCategoryModal && (
                <div className="modal-overlay" onClick={() => setShowSubCategoryModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Add New Subcategory</h3>
                        <form onSubmit={handleAddSubCategory}>
                            <input
                                type="text"
                                placeholder="Subcategory name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <div className="modal-actions">
                                <button type="submit" className="btn-primary">Add</button>
                                <button type="button" className="btn-outline" onClick={() => setShowSubCategoryModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showProductModal && (
                <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Add New Product</h3>
                        <form onSubmit={handleAddProduct}>
                            <input
                                type="text"
                                placeholder="Product name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Price"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                required
                            />
                            {!selectedSubCategory && <p className="warning">⚠️ Please select a subcategory first</p>}
                            <div className="modal-actions">
                                <button type="submit" className="btn-primary">Add</button>
                                <button type="button" className="btn-outline" onClick={() => setShowProductModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
