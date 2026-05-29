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
        unique: true,
        sparse: true,
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
    mobile: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        match: /^[0-9]{10}$/
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
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (userPassword) {

    return await bcrypt.compare(userPassword, this.password);
}

module.exports = mongoose.model('User', userSchema);