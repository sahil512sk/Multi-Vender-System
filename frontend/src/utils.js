// API
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const request = async (endpoint, options = {}) => {
    const token = getToken();
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers = isFormData ? { ...options.headers } : { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
        ? await res.json()
        : { message: await res.text() };

    if (!res.ok) throw new Error(data.message || 'Something went wrong');
    return data;
};

// Token
export const getToken    = ()      => localStorage.getItem('token');
export const setToken    = (token) => localStorage.setItem('token', token);
export const removeToken = ()      => localStorage.removeItem('token');
export const isLoggedIn  = ()      => !!getToken();

// Storage
export const getItem    = (key)        => JSON.parse(localStorage.getItem(key));
export const setItem    = (key, value) => localStorage.setItem(key, JSON.stringify(value));
export const removeItem = (key)        => localStorage.removeItem(key);

// String
// export const capitalize  = (str)       => str.charAt(0).toUpperCase() + str.slice(1);
// export const truncate    = (str, n=50) => str.length > n ? str.slice(0, n) + '...' : str;

// Date
export const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// export const timeAgo = (date) => {
//     const diff = Math.floor((Date.now() - new Date(date)) / 1000);
//     if (diff < 60)   return `${diff}s ago`;
//     if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
//     if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
//     return `${Math.floor(diff / 86400)}d ago`;
// };

// Validation
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone);
export const isStrongPassword = (pwd) => pwd.length >= 8 && /[A-Z]/.test(pwd) && /\d/.test(pwd);
