const mongoose = require('mongoose');

const HomeworkSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subject: { type: String, required: true },
    description: { type: String },
    targetClasses: { type: [String], required: true }, // Array of class IDs
    dueDate: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

// Clear cached model to avoid validation issues with old schemas
if (mongoose.models.Homework) {
    delete mongoose.models.Homework;
}

module.exports = mongoose.model('Homework', HomeworkSchema);
