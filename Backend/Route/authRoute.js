import express from 'express';
import {
    register,
    login,
    verifyOtp,
    resendOtp,
    getMe
} from '../Controller/authController.js';
import { protect } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.get('/me', protect, getMe);

export default router;