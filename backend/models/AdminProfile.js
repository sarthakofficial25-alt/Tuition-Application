const mongoose = require('mongoose');

const AdminProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    phoneNumber: { type: String, required: true },
    address: { type: String, required: true },
    paymentStatus: { type: String, enum: ['paid', 'pending'], default: 'pending' },
    paymentHistory: [
        {
            date: { type: Date, required: true },
            month: { type: String, required: true },
            amount: { type: Number },
            remarks: { type: String }
        }
    ],
    joiningDate: { type: Date, default: Date.now },
    isHidden: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('AdminProfile', AdminProfileSchema);
