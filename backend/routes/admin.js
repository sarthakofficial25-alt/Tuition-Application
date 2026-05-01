const express = require('express');
const router = express.Router();
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Homework = require('../models/Homework');
const Announcement = require('../models/Announcement');
const Schedule = require('../models/Schedule');
const { auth, admin, headAdmin } = require('../middleware/auth');
const AdminProfile = require('../models/AdminProfile');

// Get Faculty Directory (All authenticated users)
router.get('/all-faculty', auth, async (req, res) => {
    try {
        const teachers = await User.find({ role: { $in: ['admin', 'head_admin'] } }).select('-password').lean();
        const teachersWithProfiles = await Promise.all(teachers.map(async (t) => {
            const profile = await AdminProfile.findOne({ user: t._id }).lean();
            return {
                _id: t._id,
                name: t.name,
                email: t.email,
                role: t.role,
                createdAt: t.createdAt,
                profile: profile || { phoneNumber: 'N/A', address: 'Excellence Campus' }
            };
        }));
        res.json(teachersWithProfiles);
    } catch (err) {
        console.error('Directory fetch error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get dashboard stats
router.get('/stats', auth, admin, async (req, res) => {
    try {
        const now = new Date();
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentMonthName = months[now.getMonth()];
        const currentYear = now.getFullYear();
        const today = now.toLocaleDateString('en-US', { weekday: 'long' });

        const approvedStudents = await User.find({ isApproved: true, role: 'student' }).select('_id').lean();
        const approvedUserIds = approvedStudents.map(s => s._id);
        
        const [
            totalStudents,
            homeworkAssigned,
            classesToday,
            totalAnnouncements,
            feesPaidCount
        ] = await Promise.all([
            StudentProfile.countDocuments({ user: { $in: approvedUserIds } }),
            Homework.countDocuments(),
            Schedule.countDocuments({ day: today }),
            Announcement.countDocuments(),
            StudentProfile.countDocuments({ 
                user: { $in: approvedUserIds },
                paymentHistory: {
                    $elemMatch: {
                        month: currentMonthName,
                        year: currentYear
                    }
                }
            })
        ]);

        res.json({
            totalStudents: totalStudents || 0,
            homeworkAssigned: homeworkAssigned || 0,
            classesToday: classesToday || 0,
            totalAnnouncements: totalAnnouncements || 0,
            feesPaidCount: feesPaidCount || 0,
            feesPendingCount: Math.max(0, (totalStudents || 0) - (feesPaidCount || 0))
        });
    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({ message: 'Error fetching stats' });
    }
});


// Get Pending Approvals (Head Admin only)
router.get('/pending-approvals', auth, headAdmin, async (req, res) => {
    try {
        const pendingUsers = await User.find({ isApproved: false, role: 'student' }).select('-password').lean();
        const pendingWithProfiles = await Promise.all(pendingUsers.map(async (u) => {
            const profile = await StudentProfile.findOne({ user: u._id });
            return { ...u, profile };
        }));
        res.json(pendingWithProfiles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Approve User (Head Admin only)
router.put('/approve-user/:id', auth, headAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        user.isApproved = true;
        await user.save();
        res.json({ message: 'User approved successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Reject/Delete Pending User (Head Admin only)
router.delete('/reject-user/:id', auth, headAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await StudentProfile.findOneAndDelete({ user: user._id });
        await User.findByIdAndDelete(user._id);
        
        res.json({ message: 'User rejected and deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Manage Admin Teachers (Head Admin only)
router.get('/teachers', auth, headAdmin, async (req, res) => {
    try {
        const teachers = await User.find({ role: 'admin' }).select('-password').lean();
        const teachersWithProfiles = await Promise.all(teachers.map(async (t) => {
            const profile = await AdminProfile.findOne({ user: t._id });
            return { ...t, profile };
        }));
        res.json(teachersWithProfiles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/teachers', auth, headAdmin, async (req, res) => {
    try {
        const { name, email, password, phoneNumber, address } = req.body;
        
        // Simple validation
        if (!name || !email || !password || !phoneNumber || !address) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        user = new User({ name, email, password, role: 'admin', isApproved: true });
        await user.save();
        
        const profile = new AdminProfile({
            user: user._id,
            phoneNumber,
            address
        });
        await profile.save();

        res.json({ 
            _id: user._id, 
            name: user.name, 
            email: user.email, 
            role: user.role,
            profile 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/teachers/:id', auth, headAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        await AdminProfile.deleteMany({ user: req.params.id });
        res.json({ message: 'Admin Teacher and profile deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Teacher Profile & Payments (Head Admin only)
router.put('/teachers/:id', auth, headAdmin, async (req, res) => {
    try {
        const { name, email, password, phoneNumber, address, paymentStatus, newPayment, isHidden } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Teacher not found' });

        if (name) user.name = name;
        if (email) user.email = email;
        if (password) user.password = password; // Mongoose middleware will hash this
        await user.save();

        const profile = await AdminProfile.findOne({ user: user._id });
        if (profile) {
            if (phoneNumber) profile.phoneNumber = phoneNumber;
            if (address) profile.address = address;
            if (paymentStatus) profile.paymentStatus = paymentStatus;
            if (isHidden !== undefined) profile.isHidden = isHidden;

            if (newPayment && newPayment.date) {
                const dateObj = new Date(newPayment.date);
                const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const monthName = months[dateObj.getMonth()];
                
                profile.paymentHistory.push({
                    date: dateObj,
                    month: monthName,
                    amount: newPayment.amount || 0,
                    remarks: newPayment.remarks || ''
                });
            }
            await profile.save();
        }

        const updated = await User.findById(user._id).select('-password').lean();
        const updatedProfile = await AdminProfile.findOne({ user: user._id });
        res.json({ ...updated, profile: updatedProfile });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete teacher payment
router.delete('/teachers/:id/payments/:paymentId', auth, headAdmin, async (req, res) => {
    try {
        const profile = await AdminProfile.findOne({ user: req.params.id });
        if (!profile) return res.status(404).json({ message: 'Teacher profile not found' });

        profile.paymentHistory = profile.paymentHistory.filter(p => p._id.toString() !== req.params.paymentId);
        await profile.save();
        
        const user = await User.findById(req.params.id).select('-password').lean();
        res.json({ ...user, profile });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Transfer Head Admin Role (Head Admin only)
router.post('/transfer-head-role', auth, headAdmin, async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const currentHeadAdminId = req.user.id;

        const targetUser = await User.findById(targetUserId);
        if (!targetUser || targetUser.role !== 'admin') {
            return res.status(400).json({ message: 'Invalid target user. Must be an Admin Teacher.' });
        }

        // 1. Update current Head Admin to Admin Teacher
        const currentHeadAdmin = await User.findById(currentHeadAdminId);
        currentHeadAdmin.role = 'admin';
        await currentHeadAdmin.save();

        // 2. Ensure former Head Admin has an AdminProfile
        let formerHeadAdminProfile = await AdminProfile.findOne({ user: currentHeadAdminId });
        if (!formerHeadAdminProfile) {
            formerHeadAdminProfile = new AdminProfile({
                user: currentHeadAdminId,
                phoneNumber: 'N/A',
                address: 'N/A'
            });
            await formerHeadAdminProfile.save();
        }

        // 3. Update Target Admin Teacher to Head Admin
        targetUser.role = 'head_admin';
        await targetUser.save();

        res.json({ message: 'Head Admin role transferred successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


module.exports = router;
