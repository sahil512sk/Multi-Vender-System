import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { register, login, getMe } from '../controller/userController.js';
import { checkAndSendOtp, verifyOtpLogin } from '../controller/otpController.js';
import { protect } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

router.get('/login', (req, res) =>
  res.sendFile(path.join(__dirname, '../views/auth.html'))
);

router.get('/register', (req, res) =>
  res.sendFile(path.join(__dirname, '../views/auth.html'))
);

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/check', checkAndSendOtp);
router.post('/verify-otp', verifyOtpLogin);

export default router;