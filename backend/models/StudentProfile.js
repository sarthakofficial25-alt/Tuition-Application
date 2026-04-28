const mongoose = require('mongoose');

// Clear model cache for development updates on Windows
delete mongoose.models.StudentProfile;

const StudentProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    class: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    paymentStatus: { type: String, enum: ['paid', 'pending'], default: 'pending' },
    paymentHistory: [
        {
            date: { type: Date, required: true },
            month: { type: String, required: true }, // e.g. "January"
            amount: { type: Number },
            remarks: { type: String }
        }
    ],
    address: { type: String },
    schoolName: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', StudentProfileSchema);
