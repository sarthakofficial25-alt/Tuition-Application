const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const { auth, admin } = require('../middleware/auth');
const StudentProfile = require('../models/StudentProfile');

// Get schedule for student's class
router.get('/my', auth, async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        
        const schedule = await Schedule.find({ class: profile.class });
        const formatted = schedule.map(s => {
            const doc = s.toObject();
            if (!doc.subjects || doc.subjects.length === 0) {
                doc.subjects = doc.subject ? [doc.subject] : [];
            }
            return doc;
        });
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Get all schedules
router.get('/', auth, admin, async (req, res) => {
    try {
        const schedules = await Schedule.find();
        const formatted = schedules.map(s => {
            const doc = s.toObject();
            if (!doc.subjects || doc.subjects.length === 0) {
                doc.subjects = doc.subject ? [doc.subject] : [];
            }
            return doc;
        });
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Create schedule
router.post('/', auth, admin, async (req, res) => {
    try {
        const { className, subjects, day, time, teacher } = req.body;
        const schedule = new Schedule({ class: className, subjects, day, time, teacher });
        await schedule.save();
        res.json(schedule);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Edit schedule
router.put('/:id', auth, admin, async (req, res) => {
    try {
        const { className, subjects, day, time, teacher } = req.body;
        const schedule = await Schedule.findByIdAndUpdate(
            req.params.id,
            { class: className, subjects, day, time, teacher },
            { new: true }
        );
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
        res.json(schedule);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Delete schedule
router.delete('/:id', auth, admin, async (req, res) => {
    try {
        const schedule = await Schedule.findByIdAndDelete(req.params.id);
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
        res.json({ message: 'Schedule deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
