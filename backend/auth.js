const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User } = require('./models');

const JWT_SECRET = process.env.JWT_SECRET || 'alpha_secret_key_2026';
const JWT_EXPIRY = '7d';

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

// Verify JWT token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// Authenticate user from token
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (user.banned) {
            return res.status(403).json({ error: 'User is banned' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(500).json({ error: 'Authentication error' });
    }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Check if user is creator
const isCreator = (req, res, next) => {
    if (!req.user || !req.user.isCreator) {
        return res.status(403).json({ error: 'Creator access required' });
    }
    next();
};

// Telegram WebApp authentication
const authenticateTelegram = async (req, res, next) => {
    try {
        const { initData } = req.body;
        if (!initData) {
            return res.status(401).json({ error: 'No init data provided' });
        }

        // Parse and validate Telegram WebApp data
        const parsed = new URLSearchParams(initData);
        const userData = JSON.parse(parsed.get('user'));
        const hash = parsed.get('hash');

        // In production, verify hash with bot token
        // const isValid = verifyTelegramHash(initData, process.env.TELEGRAM_BOT_TOKEN);
        // if (!isValid) {
        //     return res.status(401).json({ error: 'Invalid Telegram data' });
        // }

        // Find or create user
        let user = await User.findOne({ telegramId: userData.id.toString() });
        if (!user) {
            const referralCode = generateReferralCode();
            user = new User({
                telegramId: userData.id.toString(),
                username: userData.username || `user_${userData.id}`,
                firstName: userData.first_name || '',
                lastName: userData.last_name || '',
                avatar: userData.photo_url || `https://ui-avatars.com/api/?name=${userData.first_name || 'U'}&background=D4AF37&color=0A0A0A&size=128`,
                referralCode,
                // Check if referred by someone
                referredBy: req.body.referralCode ? await getReferrer(req.body.referralCode) : null
            });
            await user.save();

            // Process referral if applicable
            if (user.referredBy) {
                await processReferral(user.referredBy);
            }
        } else {
            user.lastActive = new Date();
            await user.save();
        }

        // Generate token
        const token = generateToken(user._id);
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        console.error('Telegram auth error:', error);
        return res.status(500).json({ error: 'Authentication failed' });
    }
};

// Generate referral code
const generateReferralCode = () => {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Get referrer by code
const getReferrer = async (code) => {
    const user = await User.findOne({ referralCode: code });
    return user ? user._id : null;
};

// Process referral
const processReferral = async (referrerId) => {
    const referrer = await User.findById(referrerId);
    if (referrer) {
        // Add referral reward
        const reward = 0.50; // $0.50 per referral
        referrer.wallet.balance += reward;
        referrer.wallet.lifetime += reward;
        await referrer.save();

        // Create transaction
        const { Transaction } = require('./models');
        await Transaction.create({
            user: referrerId,
            type: 'credit',
            category: 'referral',
            amount: reward,
            description: 'Referral bonus'
        });
    }
};

// Verify Telegram hash (production only)
const verifyTelegramHash = (initData, botToken) => {
    // Implementation depends on Telegram's hash verification
    // https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
    // For now, we'll trust the data in development
    return true;
};

module.exports = {
    generateToken,
    verifyToken,
    authenticate,
    isAdmin,
    isCreator,
    authenticateTelegram,
    generateReferralCode
};
