const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
    'http://localhost:5173', // Vite default
    'http://localhost:3000', 
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
    try {
        let uri = process.env.MONGODB_URI;

        if (!uri && process.env.NODE_ENV !== 'production') {
            try {
                const { MongoMemoryServer } = require('mongodb-memory-server');
                const dbPath = path.join(__dirname, 'data', 'db');
                if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });

                const mongoServer = await MongoMemoryServer.create({
                    instance: { dbPath: dbPath, storageEngine: 'wiredTiger' },
                });
                uri = mongoServer.getUri();
                console.log('Using MongoDB Memory Server at:', uri);
            } catch (err) {
                uri = 'mongodb://localhost:27017/tuition_db';
                console.log('MongoMemoryServer failed, using local MongoDB');
            }
        }

        if (!uri) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        await mongoose.connect(uri);
        console.log('MongoDB connected successfully');

        // Initial Head Admin Seeding (Required for first-time access)
        const User = require('./models/User');
        const AdminProfile = require('./models/AdminProfile');

        let headAdmin = await User.findOne({ role: 'head_admin' });
        
        if (!headAdmin) {
            headAdmin = new User({
                name: process.env.ADMIN_NAME || 'SARTHAK KARMAKAR',
                email: process.env.ADMIN_EMAIL || 'admin@tuition.com',
                password: process.env.ADMIN_PASSWORD || 'adminpassword',
                role: 'head_admin',
                isApproved: true
            });
            await headAdmin.save();
            console.log('Head Admin user seeded.');
        } else if (process.env.ADMIN_PASSWORD) {
            // Synchronize password if environment variable is provided
            headAdmin.password = process.env.ADMIN_PASSWORD;
            // Also ensure name and email match if provided
            if (process.env.ADMIN_NAME) headAdmin.name = process.env.ADMIN_NAME;
            if (process.env.ADMIN_EMAIL) headAdmin.email = process.env.ADMIN_EMAIL;
            
            await headAdmin.save();
            console.log('Head Admin credentials synchronized from .env');
        }

        // Ensure Head Admin has a profile
        let headProfile = await AdminProfile.findOne({ user: headAdmin._id });
        if (!headProfile) {
            headProfile = new AdminProfile({ 
                user: headAdmin._id,
                phoneNumber: '9123741641', // Default placeholder
                address: 'Add your address here',
                joiningDate: new Date()
            });
            await headProfile.save();
        }

    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

connectDB();

// Basic Route
app.get('/', (req, res) => {
    res.send('Excellence Coaching Centre API is running');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/homework', require('./routes/homework'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/results', require('./routes/results'));
app.use('/api/admin', require('./routes/admin'));

// Public routes for Landing Page
const User = require('./models/User');
const AdminProfile = require('./models/AdminProfile');

app.get('/api/public/teachers', async (req, res) => {
    try {
        const teachers = await User.find({ role: { $in: ['admin', 'head_admin'] } }).select('name email').lean();
        const teachersWithProfiles = await Promise.all(teachers.map(async (t) => {
            const profile = await AdminProfile.findOne({ user: t._id, isHidden: { $ne: true } }).lean();
            if (!profile) return null;
            return { ...t, profile };
        }));
        res.json(teachersWithProfiles.filter(t => t !== null));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
