import jwt    from 'jsonwebtoken';
import User   from '../Model/User.js';
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

/* ── Step 1a: Register — store temporarily, send OTP ─── */
const pending = new Map();

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

        const otp       = generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const key       = email || mobile;

        pending.set(key, { name, email, mobile, password, role, otp, expiresAt });

        setTimeout(() => pending.delete(key), 10 * 60 * 1000);

        if (email)  await sendEmailOtp(email,  otp).catch(e => console.error('❌ Email failed:', e.message));
        if (mobile) await sendSmsOtp(mobile, otp).catch(e => console.error('❌ SMS failed:',   e.message));

        return res.status(200).json({
            message: 'OTP sent. Please verify to complete registration.',
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ── Step 1b: Login — verify password, send OTP ─────── */

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

        const otp       = generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        user.otp = { code: otp, expiresAt };
        await user.save();

        if (email  && user.email)  await sendEmailOtp(user.email,  otp).catch(e => console.error('❌ Email failed:', e.message));
        if (mobile && user.mobile) await sendSmsOtp(user.mobile, otp).catch(e => console.error('❌ SMS failed:',   e.message));


        return res.status(200).json({
            message: 'Password verified. OTP sent to your email/mobile.',
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ── Step 2: Verify OTP — handles both register & login  */

export const verifyOtp = async (req, res) => {
    try {
        const { email, mobile, otp } = req.body;

        if (!otp)              return res.status(400).json({ message: 'OTP is required' });
        if (!email && !mobile) return res.status(400).json({ message: 'Provide email or mobile' });

        const key  = email || mobile;
        const data = pending.get(key);

        if (data) {
            if (new Date() > data.expiresAt) {
                pending.delete(key);
                return res.status(400).json({ message: 'OTP expired. Please register again.' });
            }
            if (data.otp !== otp) {
                return res.status(400).json({ message: 'Invalid OTP' });
            }

            const user = await User.create({
                name:       data.name,
                password:   data.password,   // pre-save hook hashes this
                isVerified: true,
                ...(data.email  && { email:  data.email  }),
                ...(data.mobile && { mobile: data.mobile }),
                ...(data.role   && { role:   data.role   }),
            });

            pending.delete(key);
            const token = generateToken(user);

            return res.status(201).json({
                message: 'Registration complete',
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
        }

        const user = await User.findOne({ $or: buildQuery({ email, mobile }) });

        if (!user)                           return res.status(404).json({ message: 'User not found' });
        if (!user.otp?.code)                 return res.status(400).json({ message: 'No OTP was requested' });
        if (new Date() > user.otp.expiresAt) return res.status(400).json({ message: 'OTP expired' });
        if (user.otp.code !== otp)           return res.status(400).json({ message: 'Invalid OTP' });

        user.otp = { code: null, expiresAt: null };
        await user.save();

        if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated' });

        const token = generateToken(user);

        return res.status(200).json({
            message: 'Login successful',
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

/* ── Resend OTP ──────────────────────────────────────── */

export const resendOtp = async (req, res) => {
    try {
        const { email, mobile } = req.body;

        if (!email && !mobile) return res.status(400).json({ message: 'Provide email or mobile' });

        const key  = email || mobile;
        const data = pending.get(key);

        const otp       = generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        if (data) {
            pending.set(key, { ...data, otp, expiresAt });
        } else {
            const user = await User.findOne({ $or: buildQuery({ email, mobile }) });
            if (!user) return res.status(404).json({ message: 'User not found' });
            user.otp = { code: otp, expiresAt };
            await user.save();
        }

        if (email)  await sendEmailOtp(email,  otp).catch(e => console.error('❌ Email failed:', e.message));
        if (mobile) await sendSmsOtp(mobile, otp).catch(e => console.error('❌ SMS failed:',   e.message));

        return res.status(200).json({ message: 'OTP resent successfully' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ── Get Me ──────────────────────────────────────────── */

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -otp');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};