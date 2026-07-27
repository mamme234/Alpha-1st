const { User } = require('./models');

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';
    
    res.status(statusCode).json({
        error: message,
        status: statusCode,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

// Request logger
const logger = (req, res, next) => {
    console.log(`📝 ${req.method} ${req.path} - ${req.ip}`);
    next();
};

// Rate limiter for specific actions
const createRateLimiter = (windowMs, max) => {
    const requests = new Map();
    
    return (req, res, next) => {
        const key = req.user?._id || req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        if (!requests.has(key)) {
            requests.set(key, []);
        }
        
        const userRequests = requests.get(key).filter(timestamp => timestamp > windowStart);
        userRequests.push(now);
        requests.set(key, userRequests);
        
        if (userRequests.length > max) {
            return res.status(429).json({ 
                error: 'Too many requests, please slow down' 
            });
        }
        
        next();
    };
};

// Validate request body
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ 
                error: error.details[0].message 
            });
        }
        next();
    };
};

// Check if user exists
const checkUserExists = async (req, res, next) => {
    try {
        const userId = req.params.userId || req.body.userId;
        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        req.targetUser = user;
        next();
    } catch (error) {
        next(error);
    }
};

// Cache headers
const cache = (duration) => {
    return (req, res, next) => {
        res.setHeader('Cache-Control', `public, max-age=${duration}`);
        next();
    };
};

// CORS headers
const corsHeaders = (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
};

module.exports = {
    errorHandler,
    logger,
    createRateLimiter,
    validate,
    checkUserExists,
    cache,
    corsHeaders
};
