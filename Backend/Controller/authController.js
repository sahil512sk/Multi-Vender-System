import jwt from 'jsonwebtoken';
import User from '../Model/User.js';
import { generateOtp, sendEmailOtp, sendSmsOtp } from '../utils/sendOtp.js';


const generateToken = (user) =>
    jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

const buildQuery = ({ email, mobile }) => {
    const q = [];
    if (email)  q.push({ email });
    if (mobile) q.push({ mobile });
    return q;
};

const dispatchOtp = async (user, { email, mobile }) => {
    const otp       = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = { code: otp, expiresAt };
    await user.save();

    if (email  && user.email)  await sendEmailOtp(user.email, otp);
    if (mobile && user.mobile) await sendSmsOtp(user.mobile, otp);
};

export const register = async (req, res) => {
    try {
        const { name, email, password, role, mobile } = req.body;

        if (!name)             return res.status(400).json({ message: 'Name is required' });
        if (!password)         return res.status(400).json({ message: 'Password is required' });
        if (!email && !mobile) return res.status(400).json({ message: 'Provide email or mobile' });

        const existing = await User.findOne({ $or: buildQuery({ email, mobile }) });
        if (existing) {
            if (email  && existing.email  === email)  return res.status(400).json({ message: 'Email already exists' });
            if (mobile && existing.mobile === mobile) return res.status(400).json({ message: 'Mobile already exists' });
        }

        const user = await User.create({
            name,
            password,
            isVerified: false,
            ...(email  && { email }),
            ...(mobile && { mobile }),
            ...(role   && { role }),
        });

        await dispatchOtp(user, { email, mobile });

        return res.status(201).json({
            message: 'OTP sent. Please verify to complete registration.',
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, mobile, password } = req.body;

        if (!email && !mobile) return res.status(400).json({ message: 'Provide email or mobile' });
        if (!password)         return res.status(400).json({ message: 'Password is required' });

        const user = await User.findOne({ $or: buildQuery({ email, mobile }) });

        if (!user)          return res.status(401).json({ message: 'Invalid credentials' });
        if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        // Password correct → send OTP, hold the token
        await dispatchOtp(user, { email, mobile });

        return res.status(200).json({
            message: 'Password verified. OTP sent to your email/mobile.',
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const verifyOtp = async (req, res) => {
    try {
        const { email, mobile, otp } = req.body;

        if (!otp)              return res.status(400).json({ message: 'OTP is required' });
        if (!email && !mobile) return res.status(400).json({ message: 'Provide email or mobile' });

        const user = await User.findOne({ $or: buildQuery({ email, mobile }) });

        if (!user)                           return res.status(404).json({ message: 'User not found' });
        if (!user.otp?.code)                 return res.status(400).json({ message: 'No OTP was requested' });
        if (new Date() > user.otp.expiresAt) return res.status(400).json({ message: 'OTP expired' });
        if (user.otp.code !== otp)           return res.status(400).json({ message: 'Invalid OTP' });

        user.otp        = { code: null, expiresAt: null };
        user.isVerified = true;
        await user.save();

        if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated' });

        const token = generateToken(user);

        return res.status(200).json({
            message: 'Verified successfully',
            token,
            user: {
                id:         user._id,
                name:       user.name,
                email:      user.email,
                mobile:     user.mobile,
                role:       user.role,
                isVerified: user.isVerified,
                isActive:   user.isActive,
            },
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const resendOtp = async (req, res) => {
    try {
        const { email, mobile } = req.body;

        if (!email && !mobile) return res.status(400).json({ message: 'Provide email or mobile' });

        const user = await User.findOne({ $or: buildQuery({ email, mobile }) });
        if (!user) return res.status(404).json({ message: 'User not found' });

        await dispatchOtp(user, { email, mobile });

        return res.status(200).json({ message: 'OTP resent successfully' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};