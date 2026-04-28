const mongoose = require('mongoose');

// Clear model cache for development updates on Windows
delete mongoose.models.Result;

const ResultSchema = new mongoose.Schema({
    testName: { type: String, required: true },
    subjects: { type: [String], required: true }, // e.g. ['Mathematics', 'Science']
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentClass: { type: String, required: true }, // Denormalized for easy leaderboard queries
    marksObtained: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    percentage: { type: Number, required: true },
    testDate: { type: Date, required: true },
    remarks: { type: String }, // Optional
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Result', ResultSchema);
