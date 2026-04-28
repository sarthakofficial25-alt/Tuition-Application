const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

const approveAdmins = async () => {
    try {
        // Since we are using MongoMemoryServer in local dev, we need to connect to the right URI.
        // If the server is running, it will be using the persistent path in backend/data/db.
        // However, we don't know the dynamic port unless we look it up.
        // A better way is to just use the MONGODB_URI if it exists, or the default.
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tuition_db';
        
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const result = await User.updateMany(
            { role: { $in: ['admin', 'head_admin'] }, isApproved: false },
            { $set: { isApproved: true } }
        );

        console.log(`Successfully approved ${result.modifiedCount} admin accounts.`);
        
        process.exit(0);
    } catch (err) {
        console.error('Error approving admins:', err);
        process.exit(1);
    }
};

approveAdmins();
