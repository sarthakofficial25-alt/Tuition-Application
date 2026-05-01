const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Announcement = require('../models/Announcement');

async function checkAnnouncements() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tuition_app');
        console.log('Connected to MongoDB');

        const announcements = await Announcement.find();
        console.log('Total announcements:', announcements.length);
        console.log('Announcements:', JSON.stringify(announcements, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAnnouncements();
