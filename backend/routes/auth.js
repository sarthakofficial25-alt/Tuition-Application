const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

// Register Student
router.post('/register', async (req, res) => {
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
router.post('/login', async (req, res) => {
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
router.get('/head-admin', async (req, res) => {
    try {
        const headAdmin = await User.findOne({ role: 'head_admin' }, 'name');
        res.json({ name: headAdmin ? headAdmin.name : 'Not Assigned' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
