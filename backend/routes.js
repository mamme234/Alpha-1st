const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { User, Video, Product, Job, Course, Transaction, Chat, Notification, AIChat } = require('./models');

// ===== FILE UPLOAD SETUP =====
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, unique + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'application/pdf'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    }
});

// ===== MIDDLEWARE =====
const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            // For demo, create a temp user
            const tempUser = await User.findOne({ telegramId: 'demo_' + Date.now() });
            if (tempUser) {
                req.user = tempUser;
                return next();
            }
            // Create temp user
            const user = new User({
                telegramId: 'demo_' + Date.now(),
                username: 'DemoUser',
                firstName: 'Demo',
                lastName: 'User',
                isAdmin: true
            });
            await user.save();
            req.user = user;
            return next();
        }
        // Real auth would go here
        next();
    } catch (error) {
        res.status(401).json({ error: 'Authentication failed' });
    }
};

// ===== USERS =====
router.get('/users/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-__v')
            .populate('followers', 'username avatar')
            .populate('following', 'username avatar');
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/users/me', auth, async (req, res) => {
    try {
        const { username, bio, avatar } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { username, bio, avatar },
            { new: true }
        );
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== VIDEOS =====
router.get('/videos', auth, async (req, res) => {
    try {
        const videos = await Video.find({ status: 'published' })
            .populate('creator', 'username avatar')
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ success: true, videos });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/videos', auth, upload.single('video'), async (req, res) => {
    try {
        const { title, description, isPaid, price } = req.body;
        const video = new Video({
            creator: req.user._id,
            title,
            description,
            url: req.file ? `/uploads/${req.file.filename}` : null,
            isPaid: isPaid === 'true',
            price: price || 0,
            status: 'published'
        });
        await video.save();
        res.status(201).json({ success: true, video });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/videos/:id/like', auth, async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ error: 'Video not found' });
        
        const index = video.likes.indexOf(req.user._id);
        if (index > -1) {
            video.likes.splice(index, 1);
        } else {
            video.likes.push(req.user._id);
        }
        await video.save();
        res.json({ success: true, likes: video.likes.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/videos/:id/comment', auth, async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ error: 'Video not found' });
        
        video.comments.push({
            user: req.user._id,
            text: req.body.text,
            createdAt: new Date()
        });
        await video.save();
        res.json({ success: true, comments: video.comments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== PRODUCTS =====
router.get('/products', auth, async (req, res) => {
    try {
        const { category } = req.query;
        const filter = { status: 'published' };
        if (category && category !== 'all') filter.category = category;
        
        const products = await Product.find(filter)
            .populate('seller', 'username avatar')
            .sort({ createdAt: -1 });
        res.json({ success: true, products });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/products', auth, upload.single('file'), async (req, res) => {
    try {
        const { name, description, price, category } = req.body;
        const product = new Product({
            seller: req.user._id,
            name,
            description,
            price: parseFloat(price),
            category,
            imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
            status: 'published'
        });
        await product.save();
        res.status(201).json({ success: true, product });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/products/:id/buy', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        
        const user = await User.findById(req.user._id);
        if (user.wallet.balance < product.price) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        
        // Process payment
        user.wallet.balance -= product.price;
        await user.save();
        
        // Pay seller (85% after fee)
        const seller = await User.findById(product.seller);
        const commission = product.price * 0.15;
        seller.wallet.balance += product.price - commission;
        seller.wallet.lifetime += product.price - commission;
        await seller.save();
        
        // Create transactions
        await Transaction.create({
            user: user._id,
            type: 'debit',
            category: 'purchase',
            amount: product.price,
            description: `Purchase: ${product.name}`
        });
        
        await Transaction.create({
            user: seller._id,
            type: 'credit',
            category: 'sale',
            amount: product.price - commission,
            description: `Sale: ${product.name}`
        });
        
        product.downloads += 1;
        await product.save();
        
        res.json({ success: true, message: 'Purchase successful!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== COURSES =====
router.get('/courses', auth, async (req, res) => {
    try {
        const courses = await Course.find({ status: 'published' })
            .populate('author', 'username avatar')
            .sort({ createdAt: -1 });
        res.json({ success: true, courses });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/courses', auth, async (req, res) => {
    try {
        const { title, description, price, category, videos } = req.body;
        const course = new Course({
            author: req.user._id,
            title,
            description,
            price: parseFloat(price),
            category,
            videos: videos || [],
            status: 'published'
        });
        await course.save();
        res.status(201).json({ success: true, course });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/courses/:id/enroll', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ error: 'Course not found' });
        
        const user = await User.findById(req.user._id);
        if (user.wallet.balance < course.price) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        
        // Check if already enrolled
        if (course.students.includes(user._id)) {
            return res.status(400).json({ error: 'Already enrolled' });
        }
        
        user.wallet.balance -= course.price;
        await user.save();
        
        const author = await User.findById(course.author);
        author.wallet.balance += course.price * 0.85;
        author.wallet.lifetime += course.price * 0.85;
        await author.save();
        
        course.students.push(user._id);
        await course.save();
        
        await Transaction.create({
            user: user._id,
            type: 'debit',
            category: 'purchase',
            amount: course.price,
            description: `Enrolled: ${course.title}`
        });
        
        res.json({ success: true, message: 'Enrolled successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== JOBS =====
router.get('/jobs', auth, async (req, res) => {
    try {
        const jobs = await Job.find({ status: 'open' })
            .populate('client', 'username avatar')
            .sort({ createdAt: -1 });
        res.json({ success: true, jobs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/jobs', auth, async (req, res) => {
    try {
        const { title, description, budget, category } = req.body;
        const job = new Job({
            client: req.user._id,
            title,
            description,
            budget: parseFloat(budget),
            category,
            status: 'open'
        });
        await job.save();
        res.status(201).json({ success: true, job });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/jobs/:id/apply', auth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ error: 'Job not found' });
        
        if (job.applicants.includes(req.user._id)) {
            return res.status(400).json({ error: 'Already applied' });
        }
        
        job.applicants.push(req.user._id);
        await job.save();
        
        await Notification.create({
            user: job.client,
            type: 'system',
            title: 'New Application',
            message: `${req.user.username} applied to your job: ${job.title}`
        });
        
        res.json({ success: true, message: 'Applied successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== WALLET =====
router.get('/wallet', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('wallet');
        const transactions = await Transaction.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json({ success: true, wallet: user.wallet, transactions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/wallet/deposit', auth, async (req, res) => {
    try {
        const { amount } = req.body;
        const user = await User.findById(req.user._id);
        user.wallet.balance += parseFloat(amount);
        await user.save();
        
        await Transaction.create({
            user: user._id,
            type: 'credit',
            category: 'deposit',
            amount: parseFloat(amount),
            description: 'Deposit'
        });
        
        res.json({ success: true, balance: user.wallet.balance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/wallet/withdraw', auth, async (req, res) => {
    try {
        const { amount } = req.body;
        const user = await User.findById(req.user._id);
        if (user.wallet.balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        
        user.wallet.balance -= parseFloat(amount);
        user.wallet.withdrawn += parseFloat(amount);
        await user.save();
        
        await Transaction.create({
            user: user._id,
            type: 'debit',
            category: 'withdraw',
            amount: parseFloat(amount),
            description: 'Withdrawal'
        });
        
        res.json({ success: true, balance: user.wallet.balance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== CHATS =====
router.get('/chats', auth, async (req, res) => {
    try {
        const chats = await Chat.find({
            participants: req.user._id
        })
        .populate('participants', 'username avatar')
        .sort({ lastMessageAt: -1 });
        res.json({ success: true, chats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/chats', auth, async (req, res) => {
    try {
        const { participantId } = req.body;
        const existing = await Chat.findOne({
            participants: { $all: [req.user._id, participantId] }
        });
        
        if (existing) {
            return res.json({ success: true, chat: existing });
        }
        
        const chat = new Chat({
            participants: [req.user._id, participantId],
            messages: []
        });
        await chat.save();
        res.status(201).json({ success: true, chat });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/chats/:id/messages', auth, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);
        if (!chat) return res.status(404).json({ error: 'Chat not found' });
        
        const message = {
            sender: req.user._id,
            content: req.body.content,
            type: 'text',
            read: false,
            createdAt: new Date()
        };
        
        chat.messages.push(message);
        chat.lastMessage = req.body.content;
        chat.lastMessageAt = new Date();
        await chat.save();
        
        res.json({ success: true, message });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== AI ASSISTANT =====
router.post('/ai/chat', auth, async (req, res) => {
    try {
        const { message } = req.body;
        
        // Simple AI responses for now (can integrate OpenAI later)
        const responses = {
            'hello': 'Hello! How can I help you today?',
            'how are you': 'I\'m doing great! Thanks for asking.',
            'help': 'I can help with: writing, coding, translation, ideas, learning, and more!',
            'write': 'I can help you write emails, articles, social media posts, and more.',
            'code': 'I can help with JavaScript, Python, HTML, CSS, and more.',
            'translate': 'I can translate between many languages.',
            'learn': 'I can explain concepts in simple terms.',
            'idea': 'Here\'s an idea: start a side project that solves a problem you face daily!'
        };
        
        const lowerMsg = message.toLowerCase();
        let reply = 'That\'s interesting! Tell me more.';
        
        for (const [key, value] of Object.entries(responses)) {
            if (lowerMsg.includes(key)) {
                reply = value;
                break;
            }
        }
        
        // Save to history
        let chat = await AIChat.findOne({ user: req.user._id });
        if (!chat) {
            chat = new AIChat({ user: req.user._id, messages: [] });
        }
        
        chat.messages.push(
            { role: 'user', content: message, createdAt: new Date() },
            { role: 'assistant', content: reply, createdAt: new Date() }
        );
        await chat.save();
        
        res.json({ success: true, reply });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/ai/history', auth, async (req, res) => {
    try {
        const chat = await AIChat.findOne({ user: req.user._id });
        res.json({ success: true, history: chat?.messages || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== NOTIFICATIONS =====
router.get('/notifications', auth, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ success: true, notifications });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/notifications/:id/read', auth, async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { read: true },
            { new: true }
        );
        res.json({ success: true, notification });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== ADMIN =====
router.get('/admin/stats', auth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalVideos = await Video.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalJobs = await Job.countDocuments();
        const totalCourses = await Course.countDocuments();
        
        const revenue = await Transaction.aggregate([
            { $match: { type: 'credit', category: { $in: ['sale', 'deposit'] } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        res.json({
            success: true,
            stats: {
                totalUsers,
                totalVideos,
                totalProducts,
                totalJobs,
                totalCourses,
                totalRevenue: revenue[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
