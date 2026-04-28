const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const StudentProfile = require('../models/StudentProfile');
const { auth, admin } = require('../middleware/auth');

// Get my results (Student)
router.get('/my', auth, async (req, res) => {
    try {
        const results = await Result.find({ student: req.user.id }).sort({ createdAt: -1 });
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get leaderboard for a specific test and class
router.get('/leaderboard', auth, async (req, res) => {
    try {
        const { testName } = req.query;
        const profile = await StudentProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });

        const query = { studentClass: profile.class };
        if (testName) query.testName = testName;

        const leaderboard = await Result.find(query)
            .populate('student', 'name')
            .sort({ marksObtained: -1 })
            .lean();

        res.json(leaderboard);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Get all results
router.get('/', auth, admin, async (req, res) => {
    try {
        const results = await Result.find().populate('student', 'name email').sort({ createdAt: -1 });
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Post result
router.post('/', auth, admin, async (req, res) => {
    try {
        const { studentId, testName, subjects, marksObtained, totalMarks, testDate, remarks } = req.body;
        
        // Get student's class
        const profile = await StudentProfile.findOne({ user: studentId });
        if (!profile) return res.status(404).json({ message: 'Student profile not found' });

        const percentage = (marksObtained / totalMarks) * 100;

        const result = new Result({
            student: studentId,
            studentClass: profile.class,
            testName,
            subjects,
            marksObtained,
            totalMarks,
            percentage: Math.round(percentage * 100) / 100,
            testDate: testDate ? new Date(testDate) : new Date(),
            remarks
        });

        await result.save();
        const populated = await Result.findById(result._id).populate('student', 'name email');
        res.json(populated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Edit result
router.put('/:id', auth, admin, async (req, res) => {
    try {
        const { testName, subjects, marksObtained, totalMarks, testDate, remarks } = req.body;
        const percentage = (marksObtained / totalMarks) * 100;

        const result = await Result.findByIdAndUpdate(
            req.params.id,
            { 
                testName, 
                subjects, 
                marksObtained, 
                totalMarks, 
                percentage: Math.round(percentage * 100) / 100,
                testDate: testDate ? new Date(testDate) : new Date(),
                remarks 
            },
            { new: true }
        ).populate('student', 'name email');

        if (!result) return res.status(404).json({ message: 'Result not found' });
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Delete result
router.delete('/:id', auth, admin, async (req, res) => {
    try {
        const result = await Result.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ message: 'Result not found' });
        res.json({ message: 'Result deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
