const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => {

    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role
        }
    );
};

const register = async (req, res) => {

    try {
        const { name, email, password, role, mobile } = req.body;
        const existingUser = await User.findOne({ email }) || User.findOne({ mobile });

        if (existingUser) {
            return res.status(400).json({
                message: 'Email or mobile number already exists'
            });
        }

        const user = await User.create({
            name,
            email,
            password,
            mobile,
            role
        });
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

        res.status(500).json({
            message: error.message
        });
    }
};

const login = async (req, res) => {

    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {

            return res.status(401).json({
                message: 'Invalid email or password'
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

module.exports = {
    register,
    login,
    getMe
};