import User from '../Model/User.js';
import { generateOtp, sendEmailOtp, sendSmsOtp } from '../utils/sendOtp.js';
import jwt from 'jsonwebtoken';

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

export const checkAndSendOtp = async (req, res) => {
    try {
        const { email, mobile } = req.body;

        if (!email && !mobile) {
            return res.status(400).json({ message: 'Provide email or mobile' });
        }

        const query = [];
        if (email)  query.push({ email });
        if (mobile) query.push({ mobile });

        const user = await User.findOne({ $or: query });

        const otp       = generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        if (user) {
            user.otp = { code: otp, expiresAt };
            await user.save();

            if (email && user.email)   await sendEmailOtp(user.email, otp);
            if (mobile && user.mobile) await sendSmsOtp(user.mobile, otp);

            return res.status(200).json({
                message: 'OTP sent',
                userExists: true,
                hasEmail: !!user.email,
                hasMobile: !!user.mobile
            });
        } else {
            return res.status(200).json({
                message: 'User not found',
                userExists: false
            });
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const verifyOtpLogin = async (req, res) => {
    try {
        const { email, mobile, otp } = req.body;

        if (!otp) return res.status(400).json({ message: 'OTP is required' });

        const query = [];
        if (email)  query.push({ email });
        if (mobile) query.push({ mobile });

        const user = await User.findOne({ $or: query });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.otp?.code || !user.otp?.expiresAt) {
            return res.status(400).json({ message: 'No OTP requested' });
        }

        if (new Date() > user.otp.expiresAt) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        if (user.otp.code !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        user.otp = { code: null, expiresAt: null };
        await user.save();

        if (!user.isActive) {
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        const token = generateToken(user);

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id:       user._id,
                name:     user.name,
                email:    user.email,
                mobile:   user.mobile,
                role:     user.role,
                isActive: user.isActive
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};