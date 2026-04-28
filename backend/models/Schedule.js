const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
    class: { type: String, required: true },
    subject: { type: String, required: true },
    day: { type: String, required: true }, // Monday, Tuesday, etc.
    time: { type: String, required: true }, // e.g., 4:00 PM - 5:00 PM
    teacher: { type: String }
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
