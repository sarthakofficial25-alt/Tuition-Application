const mongoose = require('mongoose');
const User = require('../models/User');

async function listUsers() {
    try {
        // Need to find the current mongo server port if it's dynamic
        // But the user might be using the persistent one at localhost:27017 or the one I saw in logs
        // Actually, the server is running, so I should try to connect to the same URI.
        // I'll try to find the URI from the running server if possible, or just use the default.
        const uri = 'mongodb://127.0.0.1:57281/'; // Port from previous status check
        await mongoose.connect(uri);
        const users = await User.find({ role: { $in: ['admin', 'head_admin'] } });
        console.log(JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listUsers();
