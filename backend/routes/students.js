const express = require('express');
const router = express.Router();
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Result = require('../models/Result');
const Announcement = require('../models/Announcement');
const { auth, admin, headAdmin } = require('../middleware/auth');

// Get my profile (Student)
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ user: req.user.id }).populate('user', 'name email');
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        res.json(profile);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create student manually (Admin only) - Automatically approved
router.post('/', auth, admin, async (req, res) => {
    try {
        const { name, email, password, className, phoneNumber, address, schoolName } = req.body;
        
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        user = new User({ name, email, password, role: 'student', isApproved: true });
        await user.save();

        const profile = new StudentProfile({
            user: user._id,
            class: className,
            phoneNumber,
            address,
            schoolName,
            paymentStatus: 'pending' // Default for manually added
        });
        await profile.save();

        res.json({ message: 'Student registered successfully and account is active.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Helper to add currentMonthStatus to profile
const addMonthlyStatus = (profile) => {
    const now = new Date();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthName = months[now.getMonth()];
    const currentYear = now.getFullYear();

    const hasPaidThisMonth = profile.paymentHistory?.some(p => 
        p.month === currentMonthName && p.year === currentYear
    );

    return {
        ...profile,
        currentMonthStatus: hasPaidThisMonth ? 'paid' : 'pending',
        joiningDate: (profile.user && profile.user.createdAt) 
                     ? profile.user.createdAt 
                     : (profile.createdAt || new Date())
    };
};

// Get all students (Admin only)
router.get('/', auth, admin, async (req, res) => {
    try {
        const { limit, sort } = req.query;
        const isHeadAdmin = req.user.role === 'head_admin';
        // If not head admin, exclude sensitive fee data
        const projection = isHeadAdmin ? {} : { paymentStatus: 0, paymentHistory: 0 };
        
        // Only get profiles for approved students
        const approvedUsers = await User.find({ role: 'student', isApproved: true }).select('_id');
        const approvedUserIds = approvedUsers.map(u => u._id);
        
        let query = StudentProfile.find({ user: { $in: approvedUserIds } }, projection);
        
        // Sort and limit if provided
        if (sort === 'newest') {
            query = query.sort({ createdAt: -1 });
        }
        
        if (limit) {
            query = query.limit(parseInt(limit));
        }

        const profiles = await query.populate('user', 'name email role createdAt').lean();
        const data = profiles.map(profile => addMonthlyStatus(profile));
        
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update student
router.put('/:id', auth, admin, async (req, res) => {
    try {
        const { name, email, className, phoneNumber, paymentStatus, newPayment, address, schoolName } = req.body;
        const profile = await StudentProfile.findById(req.params.id);
        if (!profile) return res.status(404).json({ message: 'Student not found' });

        const isHeadAdmin = req.user.role === 'head_admin';

        // Restriction check for regular admin
        if (!isHeadAdmin) {
            if (className && className !== profile.class) {
                return res.status(403).json({ message: 'Only Head Admin can promote students' });
            }
            if (paymentStatus || newPayment) {
                return res.status(403).json({ message: 'Only Head Admin can update fee status' });
            }
        }

        const user = await User.findById(profile.user);
        if (user) {
            user.name = name || user.name;
            user.email = email || user.email;
            await user.save();
        }

        profile.class = className || profile.class;
        profile.phoneNumber = phoneNumber || profile.phoneNumber;
        profile.address = address || profile.address;
        profile.schoolName = schoolName || profile.schoolName;

        // Regular admin can update name, email, phone, address, schoolName
        // But only Head Admin can update payment info
        if (isHeadAdmin) {
            const oldStatus = profile.paymentStatus;
            profile.paymentStatus = paymentStatus || profile.paymentStatus;

            const now = new Date();
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const currentMonthName = months[now.getMonth()];
            const currentYear = now.getFullYear();

            // Quick Toggle Logic: If status changed to 'paid' manually without a history record, create one
            if (paymentStatus === 'paid' && !newPayment) {
                const hasRecord = profile.paymentHistory.some(p => p.month === currentMonthName && p.year === currentYear);
                if (!hasRecord) {
                    profile.paymentHistory.push({
                        date: now,
                        month: currentMonthName,
                        year: currentYear,
                        amount: 0,
                        remarks: 'Manually marked as paid'
                    });
                }
            }

            // Add to payment history if newPayment is provided
            if (newPayment && newPayment.date) {
                const dateObj = new Date(newPayment.date);
                
                // Use provided month/year if available, otherwise derive from date
                const monthName = newPayment.month || months[dateObj.getMonth()];
                const year = newPayment.year || dateObj.getFullYear();
                
                profile.paymentHistory.push({
                    date: dateObj,
                    month: monthName,
                    year: year,
                    amount: newPayment.amount || 0,
                    remarks: newPayment.remarks || ''
                });
                
                // If recording payment for CURRENT month, also update the main status
                if (monthName === currentMonthName && year === currentYear) {
                    profile.paymentStatus = 'paid';
                }
            }
        }

        await profile.save();
        const updated = await StudentProfile.findById(profile._id).populate('user', 'name email role createdAt').lean();
        res.json(addMonthlyStatus(updated));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete a payment from history (Head Admin only)
router.delete('/:id/payments/:paymentId', auth, headAdmin, async (req, res) => {
    try {
        const profile = await StudentProfile.findById(req.params.id);
        if (!profile) return res.status(404).json({ message: 'Student not found' });

        profile.paymentHistory = profile.paymentHistory.filter(p => p._id.toString() !== req.params.paymentId);
        await profile.save();
        
        const updated = await StudentProfile.findById(profile._id).populate('user', 'name email');
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete student (Head Admin only)
router.delete('/:id', auth, headAdmin, async (req, res) => {
    try {
        const profile = await StudentProfile.findById(req.params.id);
        if (!profile) return res.status(404).json({ message: 'Student not found' });

        // Cleanup associated data
        await User.findByIdAndDelete(profile.user);
        
        // Delete all results for this student
        await Result.deleteMany({ student: profile.user });
        
        // Delete announcements specifically targeted to this student
        await Announcement.deleteMany({ targetType: 'Student', targetStudent: profile.user });
        
        await StudentProfile.findByIdAndDelete(req.params.id);

        res.json({ message: 'Student and all associated data deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
