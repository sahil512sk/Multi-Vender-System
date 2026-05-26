const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['buyer', 'vendor', 'admin'],
        default: 'buyer',
    },
    isActive: {
        type: Boolean,
        default: true,
    }
},
    {
        timestamps: true,
    });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt();
    } catch (err) {
        return next(err);
    }
})

userSchema.methods.comparePassword = async function (userPassword) {

    return await bcrypt.compare(userPassword, this.password);
}

module.exports = mongoose.model('User', userSchema);