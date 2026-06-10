const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
import { request } from '../utils';

export const authApi = {
    register:  (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    login:     (payload) => request('/auth/login',    { method: 'POST', body: JSON.stringify(payload) }),
    verifyOtp: (payload) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(payload) }),
    resendOtp: (payload) => request('/auth/resend-otp', { method: 'POST', body: JSON.stringify(payload) }),
    getMe:     ()        => request('/auth/me'),
};
