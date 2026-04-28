const mongoose = require('mongoose');
const User = require('./models/User');
const StudentProfile = require('./models/StudentProfile');
const AdminProfile = require('./models/AdminProfile');

const check = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:60855/'); // Use the current port from logs
        
        const users = await User.find();
        console.log('--- ALL USERS ---');
        users.forEach(u => console.log(`${u.name} | ${u.email} | Role: ${u.role} | Approved: ${u.isApproved}`));
        
        const students = await StudentProfile.find();
        console.log('\n--- STUDENT PROFILES ---');
        students.forEach(s => console.log(`UserID: ${s.user} | Class: ${s.class}`));
        
        const admins = await AdminProfile.find();
        console.log('\n--- ADMIN PROFILES ---');
        admins.forEach(a => console.log(`UserID: ${a.user} | Hidden: ${a.isHidden}`));
        
        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

check();
