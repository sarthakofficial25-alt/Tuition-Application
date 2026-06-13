const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, StudentProfile, Homework, Announcement, Schedule, AdminProfile, Result } = require('./models');

// =========================================================================
// MIDDLEWARE
// =========================================================================

const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const admin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'head_admin')) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied, admin only' });
    }
};

const headAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'head_admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied, Head Admin only' });
    }
};

// =========================================================================
// AUTHENTICATION ROUTES
// =========================================================================

// Register Student
router.post('/auth/register', async (req, res) => {
    try {
        const { name, email, password, className, phoneNumber, address, schoolName } = req.body;
        
        // Server-side email format validation
        const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ message: 'Please enter a valid email address (e.g. you@example.com)' });
        }
        
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        user = new User({ name, email, password, role: 'student', isApproved: false });
        await user.save();

        const profile = new StudentProfile({
            user: user._id,
            class: className,
            phoneNumber,
            address,
            schoolName
        });
        await profile.save();

        res.json({ message: 'Registration successful! Your account is pending approval from the Head Admin. You will be able to log in once approved.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login
router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.time(`[Performance] Login Total: ${email}`);
        console.time(`[Performance] DB Lookup: ${email}`);
        const user = await User.findOne({ email });
        console.timeEnd(`[Performance] DB Lookup: ${email}`);

        if (!user) {
            console.timeEnd(`[Performance] Login Total: ${email}`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.time(`[Performance] Password Compare: ${email}`);
        const isMatch = await user.comparePassword(password);
        console.timeEnd(`[Performance] Password Compare: ${email}`);

        if (!isMatch) {
            console.timeEnd(`[Performance] Login Total: ${email}`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!user.isApproved && user.role === 'student') {
            console.timeEnd(`[Performance] Login Total: ${email}`);
            return res.status(403).json({ message: 'Your account is pending approval. Please contact the Head Admin.' });
        }
        
        console.time(`[Performance] JWT Sign: ${email}`);
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        console.timeEnd(`[Performance] JWT Sign: ${email}`);

        console.timeEnd(`[Performance] Login Total: ${email}`);
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Head Admin Name
router.get('/auth/head-admin', async (req, res) => {
    try {
        const headAdmin = await User.findOne({ role: 'head_admin' }, 'name');
        res.json({ name: headAdmin ? headAdmin.name : 'Not Assigned' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// =========================================================================
// ACADEMIC - ANNOUNCEMENTS
// =========================================================================

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

// =========================================================================
// ACADEMIC - HOMEWORK
// =========================================================================

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

// =========================================================================
// ACADEMIC - RESULTS
// =========================================================================

// Get my results
router.get('/results/my', auth, async (req, res) => {
    try {
        const { limit } = req.query;
        let query = Result.find({ student: req.user.id }).sort({ testDate: -1 });
        if (limit) query = query.limit(parseInt(limit));
        res.json(await query);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get available tests for student's class
router.get('/results/tests', auth, async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        
        const tests = await Result.distinct('testName', { studentClass: profile.class });
        res.json(tests);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get leaderboard for student's class
router.get('/results/leaderboard', auth, async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        
        const { testName } = req.query;
        let matchStage = { studentClass: profile.class };
        if (testName) {
            matchStage.testName = testName;
        }

        const leaderboard = await Result.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$student',
                    avg: { $avg: '$percentage' },
                    percentage: { $avg: '$percentage' },
                    marksObtained: { $sum: '$marksObtained' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'student'
                }
            },
            { $unwind: '$student' },
            {
                $project: {
                    _id: 1,
                    avg: { $round: ['$avg', 1] },
                    percentage: { $round: ['$percentage', 1] },
                    marksObtained: 1,
                    'student._id': 1,
                    'student.name': 1
                }
            },
            { $sort: { avg: -1 } }
        ]);

        res.json(leaderboard);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin: Manage results
router.get('/results', auth, admin, async (req, res) => {
    try { res.json(await Result.find().populate('student', 'name email').sort({ createdAt: -1 })); } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/results/student/:studentId', auth, admin, async (req, res) => {
    try { res.json(await Result.find({ student: req.params.studentId }).populate('student', 'name email').sort({ testDate: -1 })); } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/results', auth, admin, async (req, res) => {
    try {
        const { studentId, testName, subjects, marksObtained, totalMarks, testDate, remarks } = req.body;
        const profile = await StudentProfile.findOne({ user: studentId });
        if (!profile) return res.status(404).json({ message: 'Student profile not found' });
        
        const percentage = (marksObtained / totalMarks) * 100;
        const result = new Result({
            student: studentId,
            studentClass: profile.class,
            testName, subjects, marksObtained, totalMarks,
            percentage: Math.round(percentage * 100) / 100,
            testDate: testDate ? new Date(testDate) : new Date(),
            remarks
        });
        await result.save();
        res.json(await Result.findById(result._id).populate('student', 'name email'));
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/results/:id', auth, admin, async (req, res) => {
    try {
        const { testName, subjects, marksObtained, totalMarks, testDate, remarks } = req.body;
        const percentage = (marksObtained / totalMarks) * 100;
        const result = await Result.findByIdAndUpdate(
            req.params.id,
            { testName, subjects, marksObtained, totalMarks, percentage: Math.round(percentage * 100) / 100, testDate: testDate ? new Date(testDate) : new Date(), remarks },
            { new: true }
        ).populate('student', 'name email');
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

// =========================================================================
// ACADEMIC - SCHEDULE
// =========================================================================

// Get my schedule
router.get('/schedule/my', auth, async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        const schedule = await Schedule.find({
            class: profile.class,
            $or: [
                { student: null },
                { student: req.user.id }
            ]
        });
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
        const schedules = await Schedule.find().populate('student', 'name email');
        res.json(schedules.map(s => {
            const doc = s.toObject();
            if (!doc.subjects || doc.subjects.length === 0) doc.subjects = doc.subject ? [doc.subject] : [];
            return doc;
        }));
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/schedule', auth, admin, async (req, res) => {
    try {
        const { className, subjects, day, time, teacher, student } = req.body;
        const schedule = new Schedule({ class: className, subjects, day, time, teacher, student: student || null });
        await schedule.save();
        const populated = await Schedule.findById(schedule._id).populate('student', 'name email');
        const doc = populated.toObject();
        if (!doc.subjects || doc.subjects.length === 0) doc.subjects = doc.subject ? [doc.subject] : [];
        res.json(doc);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/schedule/:id', auth, admin, async (req, res) => {
    try {
        const { className, subjects, day, time, teacher, student } = req.body;
        const schedule = await Schedule.findByIdAndUpdate(
            req.params.id,
            { class: className, subjects, day, time, teacher, student: student || null },
            { new: true }
        ).populate('student', 'name email');
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
        const doc = schedule.toObject();
        if (!doc.subjects || doc.subjects.length === 0) doc.subjects = doc.subject ? [doc.subject] : [];
        res.json(doc);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/schedule/:id', auth, admin, async (req, res) => {
    try {
        const schedule = await Schedule.findByIdAndDelete(req.params.id);
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
        res.json({ message: 'Schedule deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// =========================================================================
// MANAGEMENT - DASHBOARD & STATS
// =========================================================================

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

// =========================================================================
// MANAGEMENT - STUDENT MANAGEMENT
// =========================================================================

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

// =========================================================================
// MANAGEMENT - TEACHER & APPROVAL MANAGEMENT
// =========================================================================

router.get('/admin/pending-approvals', auth, admin, async (req, res) => {
    try {
        const users = await User.find({ isApproved: false }).select('-password').lean();
        const userIds = users.map(u => u._id);
        const profiles = await StudentProfile.find({ user: { $in: userIds } }).lean();
        const usersWithProfile = users.map(user => {
            const profile = profiles.find(p => p.user && p.user.toString() === user._id.toString());
            return { ...user, profile: profile || null };
        });
        res.json(usersWithProfile);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/admin/approve-user/:id', auth, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.isApproved = true; await user.save();
        res.json({ message: 'User approved' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/admin/approve-user/:id', auth, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.isApproved = true; await user.save();
        res.json({ message: 'User approved' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/admin/reject-user/:id', auth, admin, async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        await StudentProfile.findOneAndDelete({ user: userId });
        await User.findByIdAndDelete(userId);
        res.json({ message: 'Registration rejected and deleted permanently' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/admin/all-faculty', auth, async (req, res) => {
    try {
        const admins = await User.find({ role: { $in: ['admin', 'head_admin'] } }).select('-password').lean();
        const profiles = await AdminProfile.find({ user: { $in: admins.map(a => a._id) } }).lean();
        const result = admins.map(admin => {
            const profile = profiles.find(p => p.user && p.user.toString() === admin._id.toString());
            return { ...admin, profile: profile || null };
        });
        res.json(result);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/admin/teachers', auth, admin, async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' }).select('-password').lean();
        const profiles = await AdminProfile.find({ user: { $in: admins.map(a => a._id) } }).lean();
        const result = admins.map(admin => {
            const profile = profiles.find(p => p.user && p.user.toString() === admin._id.toString());
            return { ...admin, profile: profile || null };
        });
        res.json(result);
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
