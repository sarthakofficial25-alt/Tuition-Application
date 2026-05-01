const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { auth, admin } = require('../middleware/auth');
const StudentProfile = require('../models/StudentProfile');

// Get announcements (filtered for students, all for admin)
router.get('/', auth, async (req, res) => {
    try {
        const { limit } = req.query;
        
        // Admins and Head Admins see everything
        if (req.user.role === 'admin' || req.user.role === 'head_admin') {
            let query = Announcement.find()
                .populate('targetStudent', 'name email')
                .sort({ createdAt: -1 });
            
            if (limit) {
                query = query.limit(parseInt(limit));
            }
            
            const announcements = await query;
            return res.json(announcements);
        }

        // For students: Filter based on targets
        const profile = await StudentProfile.findOne({ user: req.user.id });
        const studentClass = profile ? String(profile.class) : null;

        const filter = {
            $or: [
                // Legacy support: Announcements without targetType are visible to all
                { targetType: { $exists: false } },
                { targetType: 'All' },
                // Match if student's class is in the targetClasses array
                { targetType: 'Class', targetClasses: studentClass },
                // Match if student is the specific target
                { targetType: 'Student', targetStudent: req.user.id }
            ]
        };

        let query = Announcement.find(filter).sort({ createdAt: -1 });
        
        if (limit) {
            query = query.limit(parseInt(limit));
        }

        const announcements = await query;
        res.json(announcements);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Post announcement
router.post('/', auth, admin, async (req, res) => {
    try {
        const { title, content, targetType, targetClasses, targetStudent } = req.body;
        const announcement = new Announcement({ 
            title, 
            content, 
            targetType, 
            targetClasses, 
            targetStudent: targetStudent || null
        });
        await announcement.save();
        const populated = await Announcement.findById(announcement._id).populate('targetStudent', 'name email');
        res.json(populated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Edit announcement
router.put('/:id', auth, admin, async (req, res) => {
    try {
        const { title, content, targetType, targetClasses, targetStudent } = req.body;
        const announcement = await Announcement.findByIdAndUpdate(
            req.params.id,
            { 
                title, 
                content, 
                targetType, 
                targetClasses, 
                targetStudent: targetStudent || null 
            },
            { new: true }
        ).populate('targetStudent', 'name email');
        
        if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
        res.json(announcement);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Delete announcement
router.delete('/:id', auth, admin, async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndDelete(req.params.id);
        if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
        res.json({ message: 'Announcement deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
