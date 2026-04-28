const mongoose = require('mongoose');

// Clear model cache for development updates on Windows
delete mongoose.models.Announcement;

const AnnouncementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    targetType: { 
        type: String, 
        enum: ['All', 'Class', 'Student'], 
        default: 'All' 
    },
    targetClasses: { type: [String], default: [] },
    targetStudent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Announcement', AnnouncementSchema);
