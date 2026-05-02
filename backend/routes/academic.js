const express = require('express');
const router = express.Router();
const { Announcement, Homework, Result, Schedule, StudentProfile } = require('../models');
const { auth, admin } = require('../middleware/auth');

// ==========================================
// ANNOUNCEMENTS
// ==========================================

// Get announcements
router.get('/announcements', auth, async (req, res) => {
    try {
        const { limit } = req.query;
        if (req.user.role === 'admin' || req.user.role === 'head_admin') {
            let query = Announcement.find().populate('targetStudent', 'name email').sort({ createdAt: -1 });
            if (limit) query = query.limit(parseInt(limit));
            const announcements = await query;
            return res.json(announcements);
        }
        const profile = await StudentProfile.findOne({ user: req.user.id });
        const studentClass = profile ? String(profile.class) : null;
        const filter = {
            $or: [
                { targetType: { $exists: false } },
                { targetType: 'All' },
                { targetType: 'Class', targetClasses: studentClass },
                { targetType: 'Student', targetStudent: req.user.id }
            ]
        };
        let query = Announcement.find(filter).sort({ createdAt: -1 });
        if (limit) query = query.limit(parseInt(limit));
        const announcements = await query;
        res.json(announcements);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Post announcement
router.post('/announcements', auth, admin, async (req, res) => {
    try {
        const { title, content, targetType, targetClasses, targetStudent } = req.body;
        const announcement = new Announcement({ title, content, targetType, targetClasses, targetStudent: targetStudent || null });
        await announcement.save();
        const populated = await Announcement.findById(announcement._id).populate('targetStudent', 'name email');
        res.json(populated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Edit/Delete announcements
router.put('/announcements/:id', auth, admin, async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndUpdate(req.params.id, { ...req.body, targetStudent: req.body.targetStudent || null }, { new: true }).populate('targetStudent', 'name email');
        if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
        res.json(announcement);
    } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete('/announcements/:id', auth, admin, async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndDelete(req.params.id);
        if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
        res.json({ message: 'Announcement deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ==========================================
// HOMEWORK
// ==========================================

// Get my homework
router.get('/homework/my', auth, async (req, res) => {
    try {
        const { limit } = req.query;
        const profile = await StudentProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        let query = Homework.find({ $or: [ { targetClasses: profile.class }, { targetClasses: 'All' } ] }).sort({ createdAt: -1 });
        if (limit) query = query.limit(parseInt(limit));
        const homework = await query;
        res.json(homework);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin: Manage homework
router.get('/homework', auth, admin, async (req, res) => {
    try { res.json(await Homework.find().sort({ createdAt: -1 })); } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post('/homework', auth, admin, async (req, res) => {
    try {
        const homework = new Homework(req.body);
        await homework.save();
        res.json(homework);
    } catch (err) { res.status(500).json({ message: err.message }); }
});
router.put('/homework/:id', auth, admin, async (req, res) => {
    try {
        const homework = await Homework.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!homework) return res.status(404).json({ message: 'Homework not found' });
        res.json(homework);
    } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete('/homework/:id', auth, admin, async (req, res) => {
    try {
        const homework = await Homework.findByIdAndDelete(req.params.id);
        if (!homework) return res.status(404).json({ message: 'Homework not found' });
        res.json({ message: 'Homework deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ==========================================
// RESULTS
// ==========================================

// Get my results
router.get('/results/my', auth, async (req, res) => {
    try {
        const { limit } = req.query;
        let query = Result.find({ student: req.user.id }).sort({ testDate: -1 });
        if (limit) query = query.limit(parseInt(limit));
        res.json(await query);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin: Manage results
router.get('/results', auth, admin, async (req, res) => {
    try { res.json(await Result.find().populate('student', 'name email').sort({ testDate: -1 })); } catch (err) { res.status(500).json({ message: err.message }); }
});
router.get('/results/student/:studentId', auth, admin, async (req, res) => {
    try { res.json(await Result.find({ student: req.params.studentId }).populate('student', 'name email').sort({ testDate: -1 })); } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post('/results', auth, admin, async (req, res) => {
    try {
        const result = new Result(req.body);
        await result.save();
        res.json(await Result.findById(result._id).populate('student', 'name email'));
    } catch (err) { res.status(500).json({ message: err.message }); }
});
router.put('/results/:id', auth, admin, async (req, res) => {
    try {
        const result = await Result.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('student', 'name email');
        if (!result) return res.status(404).json({ message: 'Result not found' });
        res.json(result);
    } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete('/results/:id', auth, admin, async (req, res) => {
    try {
        const result = await Result.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ message: 'Result not found' });
        res.json({ message: 'Result deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ==========================================
// SCHEDULE
// ==========================================

// Get my schedule
router.get('/schedule/my', auth, async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        const schedule = await Schedule.find({ class: profile.class });
        res.json(schedule.map(s => {
            const doc = s.toObject();
            if (!doc.subjects || doc.subjects.length === 0) doc.subjects = doc.subject ? [doc.subject] : [];
            return doc;
        }));
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin: Manage schedule
router.get('/schedule', auth, admin, async (req, res) => {
    try {
        const schedules = await Schedule.find();
        res.json(schedules.map(s => {
            const doc = s.toObject();
            if (!doc.subjects || doc.subjects.length === 0) doc.subjects = doc.subject ? [doc.subject] : [];
            return doc;
        }));
    } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post('/schedule', auth, admin, async (req, res) => {
    try {
        const { className, subjects, day, time, teacher } = req.body;
        const schedule = new Schedule({ class: className, subjects, day, time, teacher });
        await schedule.save();
        res.json(schedule);
    } catch (err) { res.status(500).json({ message: err.message }); }
});
router.put('/schedule/:id', auth, admin, async (req, res) => {
    try {
        const { className, subjects, day, time, teacher } = req.body;
        const schedule = await Schedule.findByIdAndUpdate(req.params.id, { class: className, subjects, day, time, teacher }, { new: true });
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
        res.json(schedule);
    } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete('/schedule/:id', auth, admin, async (req, res) => {
    try {
        const schedule = await Schedule.findByIdAndDelete(req.params.id);
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
        res.json({ message: 'Schedule deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
