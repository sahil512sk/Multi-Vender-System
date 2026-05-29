import jwt from 'jsonwebtoken';
import User from '../Model/User.js';
import otp from '../utils/sendOtp.js';

const generateToken = (user) => {

    return jwt.sign(
        {
            id: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRE || '7d'
        }
    );
};

const register = async (req, res) => {
    try {
        const { name, email, password, role, mobile } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }
        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }
        if (!email && !mobile) {
            return res.status(400).json({
                message: 'Please provide email or mobile number'
            });
        }

        const query = [];
        if (email)  query.push({ email });
        if (mobile) query.push({ mobile });

        const existingUser = await User.findOne({ $or: query });

        if (existingUser) {
            if (email && existingUser.email === email) {
                return res.status(400).json({ message: 'Email already exists' });
            }
            if (mobile && existingUser.mobile === mobile) {
                return res.status(400).json({ message: 'Mobile number already exists' });
            }
        }

        const userData = { name, password };
        if (email)  userData.email  = email;
        if (mobile) userData.mobile = mobile;
        if (role)   userData.role   = role;

        const user = await User.create(userData);
        const token = generateToken(user);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                isActive: user.isActive,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { mobile, email, password } = req.body;

        if (!mobile && !email) {
            return res.status(400).json({
                message: 'Please provide email or mobile number'
            });
        }

        if (!password) {
            return res.status(400).json({
                message: 'Please provide password'
            });
        }

        const query = [];
        if (email)  query.push({ email });
        if (mobile) query.push({ mobile });

        const user = await User.findOne({ $or: query });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid credentials'
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                message: 'Account is deactivated'
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                message: 'Invalid credentials'
            });
        }

        const token = generateToken(user);

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                isActive: user.isActive
            }
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getMe = async (req, res) => {

    try {
        const user = await User
            .findById(req.user.id)
            .select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }
        res.status(200).json(user);
    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};

export { register, login, getMe };

// .env
// Username                 =   "sahil512sk_db_user"
// database                 =   "MVS"
// password                 =   "rdx_tbijm_049"
// mongo_uri                =   "mongodb+srv://sahil512sk_db_user:rdx_tbijm_049@mvs.h8suti5.mongodb.net/?appName=MVS"
// JWT_SECRET               =   "your_jwt_secret_key"
// JWT_EXPIRE               =   "7d"
// TWILIO_ACCOUNT_SID       =   your_sid
// TWILIO_AUTH_TOKEN        =   your_token
// TWILIO_PHONE             =   +1xxxxxxxxxx
// EMAIL_USER               =   your@gmail.com
// EMAIL_PASS               =   your_app_password