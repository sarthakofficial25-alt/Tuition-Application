const express = require('express');
const router = express.Router();
const Homework = require('../models/Homework');
const { auth, admin } = require('../middleware/auth');
const StudentProfile = require('../models/StudentProfile');

// Get homework for student's class
router.get('/my', auth, async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });

        const homework = await Homework.find({
            $or: [
                { targetClasses: profile.class },
                { targetClasses: 'All' }
            ]
        }).sort({ createdAt: -1 });
        res.json(homework);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Get all homework
router.get('/', auth, admin, async (req, res) => {
    try {
        const homework = await Homework.find().sort({ createdAt: -1 });
        res.json(homework);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Post homework
router.post('/', auth, admin, async (req, res) => {
    try {
        console.log('Post Homework body:', req.body);
        const { title, subject, description, targetClasses, dueDate } = req.body;
        
        // Defensive check
        if (!targetClasses || !Array.isArray(targetClasses)) {
            return res.status(400).json({ message: 'targetClasses must be an array' });
        }

        const homework = new Homework({ 
            title, 
            subject, 
            description, 
            targetClasses, 
            dueDate 
        });
        
        await homework.save();
        res.json(homework);
    } catch (err) {
        console.error('Homework Save Error:', err);
        res.status(500).json({ 
            message: err.message,
            errors: err.errors // Provide details for debugging
        });
    }
});

// Admin: Edit homework
router.put('/:id', auth, admin, async (req, res) => {
    try {
        const { title, subject, description, targetClasses, dueDate } = req.body;
        const homework = await Homework.findByIdAndUpdate(
            req.params.id,
            { title, subject, description, targetClasses, dueDate },
            { new: true }
        );
        if (!homework) return res.status(404).json({ message: 'Homework not found' });
        res.json(homework);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Delete homework
router.delete('/:id', auth, admin, async (req, res) => {
    try {
        const homework = await Homework.findByIdAndDelete(req.params.id);
        if (!homework) return res.status(404).json({ message: 'Homework not found' });
        res.json({ message: 'Homework deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

