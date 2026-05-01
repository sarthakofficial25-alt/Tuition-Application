const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const compression = require('compression');

dotenv.config();

const app = express();
app.use(compression());
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        const isAllowed = allowedOrigins.includes(origin) || 
                         origin.endsWith('.vercel.app') || 
                         origin.includes('localhost');

        if (isAllowed) {
            return callback(null, true);
        } else {
            console.error(`CORS Blocked: Origin ${origin} is not in allowed list.`);
            return callback(new Error('CORS policy: This origin is not allowed.'), false);
        }
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
        const bcrypt = require('bcryptjs');

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
            // Check if password actually needs update to avoid heavy bcrypt hashing on every restart
            const isMatch = await bcrypt.compare(process.env.ADMIN_PASSWORD, headAdmin.password);
            const needsNameUpdate = process.env.ADMIN_NAME && headAdmin.name !== process.env.ADMIN_NAME;
            const needsEmailUpdate = process.env.ADMIN_EMAIL && headAdmin.email !== process.env.ADMIN_EMAIL;

            if (!isMatch || needsNameUpdate || needsEmailUpdate) {
                if (!isMatch) headAdmin.password = process.env.ADMIN_PASSWORD;
                if (needsNameUpdate) headAdmin.name = process.env.ADMIN_NAME;
                if (needsEmailUpdate) headAdmin.email = process.env.ADMIN_EMAIL;
                
                await headAdmin.save();
                console.log('Head Admin credentials updated from .env');
            } else {
                console.log('Head Admin credentials already up-to-date.');
            }
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

// Start Server after DB Connection
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});

