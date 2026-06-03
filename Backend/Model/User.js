import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type:     String,
        required: true,
        trim:     true,
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true,
    },
    mobile: {
        type:   String,
        sparse: true,
        unique: true,
        trim:   true,
        match:  [/^[0-9]{10}$/, 'Mobile must be a 10-digit number'],
    },
    password: {
        type:     String,
        required: true,
    },
    role: {
        type:    String,
        enum:    ['buyer', 'vendor', 'admin'],
        default: 'buyer',
    },
    isVerified: { type: Boolean, default: false },
    isActive:   { type: Boolean, default: true  },
    otp: {
        code:      { type: String, default: null },
        expiresAt: { type: Date,   default: null },
    },
}, { timestamps: true });

userSchema.pre('validate', function () {
    if (!this.email && !this.mobile) {
        this.invalidate('email', 'At least one of email or mobile is required');
    }
});

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (userPassword) {
    return bcrypt.compare(userPassword, this.password);
};

export default mongoose.model('User', userSchema);