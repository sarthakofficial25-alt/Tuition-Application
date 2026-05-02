const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(v);
            },
            message: props => `'${props.value}' is not a valid email address`
        }
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long']
    },
    role: { type: String, enum: ['head_admin', 'admin', 'student'], default: 'student' },
    isApproved: { type: Boolean, default: false }
}, { timestamps: true, autoIndex: true });

// Explicitly index email for faster lookups during login
UserSchema.index({ email: 1 });

UserSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    // Reduced from 10 to 8 rounds for better performance on lower-end servers 
    // while maintaining strong security for this application type.
    const salt = await bcrypt.genSalt(8);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
