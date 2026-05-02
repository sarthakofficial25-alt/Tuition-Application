const express = require('express');
const router = express.Router();
const { User, StudentProfile, Homework, Announcement, Schedule, AdminProfile, Result } = require('../models');
const { auth, admin, headAdmin } = require('../middleware/auth');

// ==========================================
// DASHBOARD & STATS
// ==========================================

// Super-Endpoint for Dashboard
router.get('/admin/dashboard-init', auth, admin, async (req, res) => {
    try {
        const now = new Date();
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentMonthName = months[now.getMonth()];
        const currentYear = now.getFullYear();
        const today = now.toLocaleDateString('en-US', { weekday: 'long' });

        const approvedStudents = await User.find({ isApproved: true, role: 'student' }).select('_id').lean();
        const approvedUserIds = approvedStudents.map(s => s._id);
        
        const [totalStudents, homeworkAssigned, classesToday, totalAnnouncements, feesPaidCount, recentStudentsProfiles, headAdminObj, recentAnnouncements] = await Promise.all([
            StudentProfile.countDocuments({ user: { $in: approvedUserIds } }),
            Homework.countDocuments(),
            Schedule.countDocuments({ day: today }),
            Announcement.countDocuments(),
            StudentProfile.countDocuments({ user: { $in: approvedUserIds }, paymentHistory: { $elemMatch: { month: currentMonthName, year: currentYear } } }),
            StudentProfile.find({ user: { $in: approvedUserIds } }).sort({ createdAt: -1 }).limit(4).populate('user', 'name email createdAt').lean(),
            User.findOne({ role: 'head_admin' }, 'name').lean(),
            Announcement.find().sort({ createdAt: -1 }).limit(3).lean()
        ]);

        const processedStudents = recentStudentsProfiles.map(profile => ({
            ...profile,
            currentMonthStatus: profile.paymentHistory?.some(p => p.month === currentMonthName && p.year === currentYear) ? 'paid' : 'pending'
        }));

        res.json({
            stats: { totalStudents, homeworkAssigned, classesToday, totalAnnouncements, feesPaidCount, feesPendingCount: totalStudents - feesPaidCount },
            recentStudents: processedStudents,
            headAdminName: headAdminObj ? headAdminObj.name : 'Not Assigned',
            announcements: recentAnnouncements
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/admin/stats', auth, admin, async (req, res) => {
    try {
        const now = new Date();
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentMonthName = months[now.getMonth()];
        const currentYear = now.getFullYear();
        const today = now.toLocaleDateString('en-US', { weekday: 'long' });

        const approvedStudents = await User.find({ isApproved: true, role: 'student' }).select('_id').lean();
        const approvedUserIds = approvedStudents.map(s => s._id);

        const [totalStudents, homeworkAssigned, classesToday, totalAnnouncements, feesPaidCount] = await Promise.all([
            StudentProfile.countDocuments({ user: { $in: approvedUserIds } }),
            Homework.countDocuments(),
            Schedule.countDocuments({ day: today }),
            Announcement.countDocuments(),
            StudentProfile.countDocuments({ user: { $in: approvedUserIds }, paymentHistory: { $elemMatch: { month: currentMonthName, year: currentYear } } })
        ]);

        res.json({ totalStudents, homeworkAssigned, classesToday, totalAnnouncements, feesPaidCount, feesPendingCount: totalStudents - feesPaidCount });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ==========================================
// STUDENT MANAGEMENT
// ==========================================

// Get my profile (Student)
router.get('/students/me', auth, async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ user: req.user.id }).populate('user', 'name email');
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        res.json(profile);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get all students
router.get('/students', auth, admin, async (req, res) => {
    try {
        const { limit, sort } = req.query;
        const isHeadAdminUser = req.user.role === 'head_admin';
        const projection = isHeadAdminUser ? {} : { paymentStatus: 0, paymentHistory: 0 };
        const approvedUsers = await User.find({ role: 'student', isApproved: true }).select('_id').lean();
        const approvedUserIds = approvedUsers.map(u => u._id);
        let query = StudentProfile.find({ user: { $in: approvedUserIds } }, projection);
        if (sort === 'newest') query = query.sort({ createdAt: -1 });
        const limitNum = parseInt(limit);
        if (!isNaN(limitNum) && limitNum > 0) query = query.limit(limitNum);

        const profiles = await query.populate('user', 'name email role createdAt').lean();
        const now = new Date();
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentMonthName = months[now.getMonth()];
        const currentYear = now.getFullYear();

        res.json(profiles.map(profile => ({
            ...profile,
            currentMonthStatus: profile.paymentHistory?.some(p => p.month === currentMonthName && p.year === currentYear) ? 'paid' : 'pending',
            joiningDate: (profile.user && profile.user.createdAt) ? profile.user.createdAt : (profile.createdAt || new Date())
        })));
    } catch (err) { res.status(500).json({ message: 'Error fetching students data' }); }
});

// Create/Update/Delete Students (from students.js)
router.post('/students', auth, admin, async (req, res) => {
    try {
        const { name, email, password, className, phoneNumber, address, schoolName } = req.body;
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });
        user = new User({ name, email, password, role: 'student', isApproved: true });
        await user.save();
        const profile = new StudentProfile({ user: user._id, class: className, phoneNumber, address, schoolName });
        await profile.save();
        res.json({ message: 'Student registered successfully' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/students/:id', auth, admin, async (req, res) => {
    try {
        const { name, email, className, phoneNumber, paymentStatus, newPayment, address, schoolName } = req.body;
        const profile = await StudentProfile.findById(req.params.id);
        if (!profile) return res.status(404).json({ message: 'Student not found' });
        const isHeadAdminUser = req.user.role === 'head_admin';
        if (!isHeadAdminUser && ((className && className !== profile.class) || paymentStatus || newPayment)) {
            return res.status(403).json({ message: 'Only Head Admin can update fee or promote students' });
        }
        const user = await User.findById(profile.user);
        if (user) { user.name = name || user.name; user.email = email || user.email; await user.save(); }
        profile.class = className || profile.class;
        profile.phoneNumber = phoneNumber || profile.phoneNumber;
        profile.address = address || profile.address;
        profile.schoolName = schoolName || profile.schoolName;

        if (isHeadAdminUser) {
            profile.paymentStatus = paymentStatus || profile.paymentStatus;
            if (paymentStatus === 'paid' && !newPayment) {
                const now = new Date();
                const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const currentMonthName = months[now.getMonth()];
                const currentYear = now.getFullYear();
                if (!profile.paymentHistory.some(p => p.month === currentMonthName && p.year === currentYear)) {
                    profile.paymentHistory.push({ date: now, month: currentMonthName, year: currentYear, amount: 0, remarks: 'Manually marked as paid' });
                }
            }
            if (newPayment && newPayment.date) {
                const dateObj = new Date(newPayment.date);
                const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const monthName = newPayment.month || months[dateObj.getMonth()];
                const year = newPayment.year || dateObj.getFullYear();
                profile.paymentHistory.push({ date: dateObj, month: monthName, year, amount: newPayment.amount || 0, remarks: newPayment.remarks || '' });
                if (monthName === months[(new Date()).getMonth()] && year === (new Date()).getFullYear()) profile.paymentStatus = 'paid';
            }
        }
        await profile.save();
        res.json(profile);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/students/:id', auth, headAdmin, async (req, res) => {
    try {
        const profile = await StudentProfile.findById(req.params.id);
        if (!profile) return res.status(404).json({ message: 'Student not found' });
        await User.findByIdAndDelete(profile.user);
        await Result.deleteMany({ student: profile.user });
        await Announcement.deleteMany({ targetType: 'Student', targetStudent: profile.user });
        await StudentProfile.findByIdAndDelete(req.params.id);
        res.json({ message: 'Student deleted successfully' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ==========================================
// TEACHER & APPROVAL MANAGEMENT
// ==========================================

router.get('/admin/pending-approvals', auth, admin, async (req, res) => {
    try { res.json(await User.find({ isApproved: false }).select('-password')); } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post('/admin/approve-user/:id', auth, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.isApproved = true; await user.save();
        res.json({ message: 'User approved' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});
router.get('/admin/all-faculty', auth, async (req, res) => {
    try {
        const admins = await User.find({ role: { $in: ['admin', 'head_admin'] } }).select('-password').lean();
        const profiles = await AdminProfile.find({ user: { $in: admins.map(a => a._id) } }).populate('user', 'name email role').lean();
        res.json(profiles);
    } catch (err) { res.status(500).json({ message: err.message }); }
});
router.get('/admin/faculty-directory', auth, admin, async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' }).select('-password').lean();
        const profiles = await AdminProfile.find({ user: { $in: admins.map(a => a._id) } }).populate('user', 'name email role').lean();
        res.json(profiles);
    } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post('/admin/teachers', auth, headAdmin, async (req, res) => {
    try {
        const { name, email, password, phoneNumber, address } = req.body;
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'Teacher already exists' });
        user = new User({ name, email, password, role: 'admin', isApproved: true });
        await user.save();
        const profile = new AdminProfile({ user: user._id, phoneNumber, address });
        await profile.save();
        res.json({ message: 'Teacher added successfully' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});
router.put('/admin/teachers/:id', auth, headAdmin, async (req, res) => {
    try {
        const profile = await AdminProfile.findById(req.params.id);
        if (!profile) return res.status(404).json({ message: 'Teacher not found' });
        const user = await User.findById(profile.user);
        if (user) { user.name = req.body.name || user.name; user.email = req.body.email || user.email; await user.save(); }
        profile.phoneNumber = req.body.phoneNumber || profile.phoneNumber;
        profile.address = req.body.address || profile.address;
        await profile.save();
        res.json(profile);
    } catch (err) { res.status(500).json({ message: err.message }); }
});
router.delete('/admin/teachers/:id', auth, headAdmin, async (req, res) => {
    try {
        const profile = await AdminProfile.findById(req.params.id);
        if (!profile) return res.status(404).json({ message: 'Teacher not found' });
        await User.findByIdAndDelete(profile.user);
        await AdminProfile.findByIdAndDelete(req.params.id);
        res.json({ message: 'Teacher deleted successfully' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
