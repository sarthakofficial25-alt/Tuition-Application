const jwt = require('jsonwebtoken');

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

module.exports = { auth, admin, headAdmin };
