const {
    User,
    Content,
    Product,
    Transaction,
    Withdrawal,
    Ad,
    Comment,
    Chat,
    Notification
} = require('./models');
const { generateToken } = require('./auth');

// ===== AUTH CONTROLLERS =====
const auth = {
    login: async (req, res) => {
        try {
            const { user, token } = req;
            res.json({
                success: true,
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    avatar: user.avatar,
                    level: user.level,
                    wallet: user.wallet,
                    premium: user.premium,
                    isAdmin: user.isAdmin,
                    isCreator: user.isCreator
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    refreshToken: async (req, res) => {
        try {
            const { token } = req.body;
            const decoded = verifyToken(token);
            if (!decoded) {
                return res.status(401).json({ error: 'Invalid token' });
            }
            const newToken = generateToken(decoded.userId);
            res.json({ token: newToken });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    logout: async (req, res) => {
        res.json({ success: true, message: 'Logged out' });
    }
};

// ===== USER CONTROLLERS =====
const user = {
    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.user._id)
                .select('-__v')
                .populate('referrals', 'username avatar level');
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    updateProfile: async (req, res) => {
        try {
            const updates = req.body;
            const allowed = ['username', 'bio', 'avatar', 'country', 'settings'];
            const filtered = {};
            Object.keys(updates).forEach(key => {
                if (allowed.includes(key)) {
                    filtered[key] = updates[key];
                }
            });
            
            const user = await User.findByIdAndUpdate(
                req.user._id,
                filtered,
                { new: true }
            ).select('-__v');
            
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getUser: async (req, res) => {
        try {
            const user = await User.findById(req.params.userId)
                .select('-__v -settings')
                .populate('referrals', 'username avatar level');
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    listUsers: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;
            
            const users = await User.find()
                .select('-__v')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 });
            
            const total = await User.countDocuments();
            
            res.json({
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    banUser: async (req, res) => {
        try {
            const user = await User.findByIdAndUpdate(
                req.params.userId,
                { banned: true },
                { new: true }
            );
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ success: true, message: 'User banned' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    unbanUser: async (req, res) => {
        try {
            const user = await User.findByIdAndUpdate(
                req.params.userId,
                { banned: false },
                { new: true }
            );
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ success: true, message: 'User unbanned' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    updateBalance: async (req, res) => {
        try {
            const { amount, action } = req.body;
            const user = await User.findById(req.params.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            if (action === 'add') {
                user.wallet.balance += amount;
                user.wallet.lifetime += amount;
            } else if (action === 'subtract') {
                if (user.wallet.balance < amount) {
                    return res.status(400).json({ error: 'Insufficient balance' });
                }
                user.wallet.balance -= amount;
            } else {
                return res.status(400).json({ error: 'Invalid action' });
            }
            
            await user.save();
            
            // Create transaction
            await Transaction.create({
                user: user._id,
                type: action === 'add' ? 'credit' : 'debit',
                category: 'reward',
                amount,
                description: `Admin ${action === 'add' ? 'added' : 'subtracted'} $${amount}`
            });
            
            res.json({ success: true, balance: user.wallet.balance });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

// ===== WALLET CONTROLLERS =====
const wallet = {
    getBalance: async (req, res) => {
        try {
            const user = await User.findById(req.user._id).select('wallet');
            res.json(user.wallet);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getTransactions: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;
            
            const transactions = await Transaction.find({ user: req.user._id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            
            const total = await Transaction.countDocuments({ user: req.user._id });
            
            res.json({
                transactions,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    deposit: async (req, res) => {
        try {
            const { amount, method } = req.body;
            if (!amount || amount <= 0) {
                return res.status(400).json({ error: 'Invalid amount' });
            }
            
            // Process deposit (simplified)
            const user = await User.findById(req.user._id);
            user.wallet.balance += amount;
            await user.save();
            
            await Transaction.create({
                user: user._id,
                type: 'credit',
                category: 'deposit',
                amount,
                description: `Deposit via ${method || 'direct'}`
            });
            
            res.json({ success: true, balance: user.wallet.balance });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    withdraw: async (req, res) => {
        try {
            const { amount, method, address } = req.body;
            if (!amount || amount <= 0) {
                return res.status(400).json({ error: 'Invalid amount' });
            }
            
            const user = await User.findById(req.user._id);
            if (user.wallet.balance < amount) {
                return res.status(400).json({ error: 'Insufficient balance' });
            }
            
            // Create withdrawal request
            const withdrawal = await Withdrawal.create({
                user: user._id,
                amount,
                method,
                address,
                status: 'pending'
            });
            
            res.json({
                success: true,
                message: 'Withdrawal request submitted',
                withdrawal
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    approveWithdrawal: async (req, res) => {
        try {
            const withdrawal = await Withdrawal.findById(req.params.id);
            if (!withdrawal) {
                return res.status(404).json({ error: 'Withdrawal not found' });
            }
            
            if (withdrawal.status !== 'pending') {
                return res.status(400).json({ error: 'Withdrawal already processed' });
            }
            
            withdrawal.status = 'approved';
            withdrawal.processedBy = req.user._id;
            withdrawal.processedAt = new Date();
            await withdrawal.save();
            
            // Deduct from user balance
            const user = await User.findById(withdrawal.user);
            user.wallet.balance -= withdrawal.amount;
            user.wallet.withdrawn += withdrawal.amount;
            await user.save();
            
            await Transaction.create({
                user: user._id,
                type: 'debit',
                category: 'withdraw',
                amount: withdrawal.amount,
                description: `Withdrawal #${withdrawal._id}`
            });
            
            res.json({ success: true, withdrawal });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    rejectWithdrawal: async (req, res) => {
        try {
            const withdrawal = await Withdrawal.findById(req.params.id);
            if (!withdrawal) {
                return res.status(404).json({ error: 'Withdrawal not found' });
            }
            
            if (withdrawal.status !== 'pending') {
                return res.status(400).json({ error: 'Withdrawal already processed' });
            }
            
            withdrawal.status = 'rejected';
            withdrawal.processedBy = req.user._id;
            withdrawal.processedAt = new Date();
            await withdrawal.save();
            
            res.json({ success: true, withdrawal });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

// ===== CONTENT CONTROLLERS =====
const content = {
    create: async (req, res) => {
        try {
            const { title, description, type, price, isPaid, isPremium, tags } = req.body;
            const file = req.file;
            
            const content = await Content.create({
                creator: req.user._id,
                title,
                description,
                type,
                price: price || 0,
                isPaid: isPaid || false,
                isPremium: isPremium || false,
                fileUrl: file ? `/uploads/${file.filename}` : null,
                tags: tags ? tags.split(',') : [],
                status: req.user.isAdmin ? 'approved' : 'pending'
            });
            
            res.status(201).json(content);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    list: async (req, res) => {
        try {
            const { type, status, creator } = req.query;
            const filter = {};
            if (type) filter.type = type;
            if (status) filter.status = status;
            if (creator) filter.creator = creator;
            
            const content = await Content.find(filter)
                .populate('creator', 'username avatar')
                .sort({ createdAt: -1 });
            
            res.json(content);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    get: async (req, res) => {
        try {
            const content = await Content.findById(req.params.id)
                .populate('creator', 'username avatar')
                .populate('comments');
            
            if (!content) {
                return res.status(404).json({ error: 'Content not found' });
            }
            
            // Increment views
            content.views += 1;
            await content.save();
            
            res.json(content);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const content = await Content.findById(req.params.id);
            if (!content) {
                return res.status(404).json({ error: 'Content not found' });
            }
            
            if (content.creator.toString() !== req.user._id.toString() && !req.user.isAdmin) {
                return res.status(403).json({ error: 'Not authorized' });
            }
            
            const updates = req.body;
            const allowed = ['title', 'description', 'price', 'isPaid', 'isPremium', 'tags'];
            const filtered = {};
            Object.keys(updates).forEach(key => {
                if (allowed.includes(key)) {
                    filtered[key] = updates[key];
                }
            });
            
            const updated = await Content.findByIdAndUpdate(
                req.params.id,
                filtered,
                { new: true }
            );
            
            res.json(updated);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const content = await Content.findById(req.params.id);
            if (!content) {
                return res.status(404).json({ error: 'Content not found' });
            }
            
            if (content.creator.toString() !== req.user._id.toString() && !req.user.isAdmin) {
                return res.status(403).json({ error: 'Not authorized' });
            }
            
            await content.remove();
            res.json({ success: true, message: 'Content deleted' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    approve: async (req, res) => {
        try {
            const content = await Content.findByIdAndUpdate(
                req.params.id,
                { status: 'approved' },
                { new: true }
            );
            if (!content) {
                return res.status(404).json({ error: 'Content not found' });
            }
            res.json(content);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    like: async (req, res) => {
        try {
            const content = await Content.findById(req.params.id);
            if (!content) {
                return res.status(404).json({ error: 'Content not found' });
            }
            
            content.likes += 1;
            await content.save();
            
            res.json({ likes: content.likes });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

// ===== PRODUCT CONTROLLERS =====
const product = {
    create: async (req, res) => {
        try {
            const { name, description, price, category } = req.body;
            const file = req.file;
            
            const product = await Product.create({
                seller: req.user._id,
                name,
                description,
                price,
                category,
                imageUrl: file ? `/uploads/${file.filename}` : null,
                status: req.user.isAdmin ? 'approved' : 'pending'
            });
            
            res.status(201).json(product);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    list: async (req, res) => {
        try {
            const { category, status, featured } = req.query;
            const filter = { status: 'approved' };
            if (category && category !== 'all') filter.category = category;
            if (featured === 'true') filter.featured = true;
            
            const products = await Product.find(filter)
                .populate('seller', 'username avatar')
                .sort({ createdAt: -1 });
            
            res.json(products);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    get: async (req, res) => {
        try {
            const product = await Product.findById(req.params.id)
                .populate('seller', 'username avatar');
            
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
            
            res.json(product);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
            
            if (product.seller.toString() !== req.user._id.toString() && !req.user.isAdmin) {
                return res.status(403).json({ error: 'Not authorized' });
            }
            
            const updates = req.body;
            const allowed = ['name', 'description', 'price', 'category'];
            const filtered = {};
            Object.keys(updates).forEach(key => {
                if (allowed.includes(key)) {
                    filtered[key] = updates[key];
                }
            });
            
            const updated = await Product.findByIdAndUpdate(
                req.params.id,
                filtered,
                { new: true }
            );
            
            res.json(updated);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
            
            if (product.seller.toString() !== req.user._id.toString() && !req.user.isAdmin) {
                return res.status(403).json({ error: 'Not authorized' });
            }
            
            await product.remove();
            res.json({ success: true, message: 'Product deleted' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    buy: async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
            
            if (product.status !== 'approved') {
                return res.status(400).json({ error: 'Product not available' });
            }
            
            const user = await User.findById(req.user._id);
            if (user.wallet.balance < product.price) {
                return res.status(400).json({ error: 'Insufficient balance' });
            }
            
            // Process payment
            user.wallet.balance -= product.price;
            await user.save();
            
            // Pay seller
            const seller = await User.findById(product.seller);
            seller.wallet.balance += product.price * 0.85; // 15% platform fee
            seller.wallet.lifetime += product.price * 0.85;
            await seller.save();
            
            // Create transactions
            await Transaction.create({
                user: user._id,
                type: 'debit',
                category: 'sale',
                amount: product.price,
                description: `Purchase: ${product.name}`
            });
            
            await Transaction.create({
                user: seller._id,
                type: 'credit',
                category: 'sale',
                amount: product.price * 0.85,
                description: `Sale: ${product.name}`
            });
            
            product.downloads += 1;
            await product.save();
            
            res.json({
                success: true,
                message: 'Purchase successful',
                product
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    approve: async (req, res) => {
        try {
            const product = await Product.findByIdAndUpdate(
                req.params.id,
                { status: 'approved' },
                { new: true }
            );
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
            res.json(product);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    feature: async (req, res) => {
        try {
            const product = await Product.findByIdAndUpdate(
                req.params.id,
                { featured: true },
                { new: true }
            );
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
            res.json(product);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

// ===== AD CONTROLLERS =====
const ad = {
    list: async (req, res) => {
        try {
            const { type } = req.query;
            const filter = { active: true };
            if (type) filter.type = type;
            
            const ads = await Ad.find(filter).sort({ createdAt: -1 });
            res.json(ads);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getRewardedAd: async (req, res) => {
        try {
            const ad = await Ad.findOne({ type: 'rewarded', active: true });
            if (!ad) {
                return res.status(404).json({ error: 'No rewarded ads available' });
            }
            res.json(ad);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    watchRewardedAd: async (req, res) => {
        try {
            const ad = await Ad.findById(req.body.adId);
            if (!ad) {
                return res.status(404).json({ error: 'Ad not found' });
            }
            
            const user = await User.findById(req.user._id);
            const reward = ad.reward || 0.05;
            
            // Add reward
            user.wallet.balance += reward;
            user.wallet.lifetime += reward;
            await user.save();
            
            // Track impression
            ad.impressions += 1;
            ad.revenue += reward * 0.7; // 70% of reward is revenue
            await ad.save();
            
            await Transaction.create({
                user: user._id,
                type: 'credit',
                category: 'ad',
                amount: reward,
                description: `Ad reward: ${ad.title || 'Rewarded ad'}`
            });
            
            res.json({
                success: true,
                reward,
                balance: user.wallet.balance
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    create: async (req, res) => {
        try {
            const ad = await Ad.create(req.body);
            res.status(201).json(ad);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const ad = await Ad.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            );
            if (!ad) {
                return res.status(404).json({ error: 'Ad not found' });
            }
            res.json(ad);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const ad = await Ad.findByIdAndDelete(req.params.id);
            if (!ad) {
                return res.status(404).json({ error: 'Ad not found' });
            }
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

// ===== OFFER CONTROLLERS =====
const offer = {
    list: async (req, res) => {
        // Mock offers for now
        const offers = [
            { id: 1, title: 'Install App', reward: 0.50, description: 'Install and open the app', category: 'app' },
            { id: 2, title: 'Complete Survey', reward: 0.75, description: 'Answer a 5-minute survey', category: 'survey' },
            { id: 3, title: 'Play Game', reward: 1.00, description: 'Reach level 10 in the game', category: 'game' },
            { id: 4, title: 'Register Account', reward: 0.25, description: 'Create a new account', category: 'register' }
        ];
        res.json(offers);
    },

    complete: async (req, res) => {
        try {
            const { offerId } = req.body;
            const user = await User.findById(req.user._id);
            
            // Mock completion
            const reward = 0.50;
            user.wallet.balance += reward;
            user.wallet.lifetime += reward;
            await user.save();
            
            await Transaction.create({
                user: user._id,
                type: 'credit',
                category: 'offer',
                amount: reward,
                description: `Offer completion: ${offerId}`
            });
            
            res.json({
                success: true,
                reward,
                balance: user.wallet.balance
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

// ===== REFERRAL CONTROLLERS =====
const referral = {
    getReferrals: async (req, res) => {
        try {
            const user = await User.findById(req.user._id)
                .populate('referrals', 'username avatar level createdAt');
            res.json(user.referrals);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getStats: async (req, res) => {
        try {
            const user = await User.findById(req.user._id);
            const referralCount = user.referrals.length;
            const referralEarnings = await Transaction.aggregate([
                { $match: { user: user._id, category: 'referral' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            
            res.json({
                referralCode: user.referralCode,
                referralCount,
                referralEarnings: referralEarnings[0]?.total || 0
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getLeaderboard: async (req, res) => {
        try {
            const users = await User.aggregate([
                { $match: { referrals: { $ne: [] } } },
                { $project: { 
                    username: 1, 
                    avatar: 1, 
                    referralCount: { $size: '$referrals' } 
                }},
                { $sort: { referralCount: -1 } },
                { $limit: 10 }
            ]);
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

// ===== CHAT CONTROLLERS =====
const chat = {
    list: async (req, res) => {
        try {
            const chats = await Chat.find({
                participants: req.user._id
            })
                .populate('participants', 'username avatar')
                .sort({ lastMessageAt: -1 });
            
            res.json(chats);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    get: async (req, res) => {
        try {
            const chat = await Chat.findById(req.params.chatId)
                .populate('participants', 'username avatar')
                .populate('messages.sender', 'username avatar');
            
            if (!chat) {
                return res.status(404).json({ error: 'Chat not found' });
            }
            
            // Mark messages as read
            chat.messages.forEach(msg => {
                if (msg.sender._id.toString() !== req.user._id.toString()) {
                    msg.read = true;
                }
            });
            await chat.save();
            
            res.json(chat);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    create: async (req, res) => {
        try {
            const { participantId } = req.body;
            const existingChat = await Chat.findOne({
                participants: { $all: [req.user._id, participantId] }
            });
            
            if (existingChat) {
                return res.json(existingChat);
            }
            
            const chat = await Chat.create({
                participants: [req.user._id, participantId],
                messages: []
            });
            
            res.status(201).json(chat);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    sendMessage: async (req, res) => {
        try {
            const { content, type } = req.body;
            const chat = await Chat.findById(req.params.chatId);
            
            if (!chat) {
                return res.status(404).json({ error: 'Chat not found' });
            }
            
            if (!chat.participants.includes(req.user._id)) {
                return res.status(403).json({ error: 'Not a participant' });
            }
            
            const message = {
                sender: req.user._id,
                content,
                type: type || 'text',
                read: false,
                createdAt: new Date()
            };
            
            chat.messages.push(message);
            chat.lastMessage = content;
            chat.lastMessageAt = new Date();
            await chat.save();
            
            const populatedChat = await Chat.findById(chat._id)
                .populate('messages.sender', 'username avatar');
            
            res.json(populatedChat);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    markAsRead: async (req, res) => {
        try {
            const chat = await Chat.findById(req.params.chatId);
            if (!chat) {
                return res.status(404).json({ error: 'Chat not found' });
            }
            
            const message = chat.messages.id(req.params.messageId);
            if (message) {
                message.read = true;
                await chat.save();
            }
            
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

// ===== NOTIFICATION CONTROLLERS =====
const notification = {
    list: async (req, res) => {
        try {
            const notifications = await Notification.find({ user: req.user._id })
                .sort({ createdAt: -1 })
                .limit(50);
            
            res.json(notifications);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    markAsRead: async (req, res) => {
        try {
            const notification = await Notification.findByIdAndUpdate(
                req.params.id,
                { read: true },
                { new: true }
            );
            if (!notification) {
                return res.status(404).json({ error: 'Notification not found' });
            }
            res.json(notification);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    markAllAsRead: async (req, res) => {
        try {
            await Notification.updateMany(
                { user: req.user._id, read: false },
                { read: true }
            );
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    send: async (req, res) => {
        try {
            const { userId, title, message, type } = req.body;
            const notification = await Notification.create({
                user: userId,
                title,
                message,
                type: type || 'system'
            });
            res.status(201).json(notification);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

// ===== LEADERBOARD CONTROLLERS =====
const leaderboard = {
    get: async (req, res) => {
        try {
            const { type = 'earners', limit = 10 } = req.query;
            
            let users;
            if (type === 'earners') {
                users = await User.find()
                    .sort({ 'wallet.lifetime': -1 })
                    .limit(parseInt(limit))
                    .select('username avatar wallet.lifetime level');
            } else if (type === 'referrals') {
                users = await User.aggregate([
                    { $project: { 
                        username: 1, 
                        avatar: 1, 
                        referralCount: { $size: '$referrals' } 
                    }},
                    { $sort: { referralCount: -1 } },
                    { $limit: parseInt(limit) }
                ]);
            } else if (type === 'creators') {
                users = await User.find({ isCreator: true })
                    .sort({ 'wallet.lifetime': -1 })
                    .limit(parseInt(limit))
                    .select('username avatar wallet.lifetime level');
            }
            
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

// ===== ANALYTICS CONTROLLERS =====
const analytics = {
    getDashboard: async (req, res) => {
        try {
            const totalUsers = await User.countDocuments();
            const onlineUsers = await User.countDocuments({ 
                lastActive: { $gte: new Date(Date.now() - 5 * 60 * 1000) } 
            });
            
            const totalRevenue = await Transaction.aggregate([
                { $match: { category: { $in: ['sale', 'ad', 'offer'] } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            
            const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'pending' });
            
            res.json({
                totalUsers,
                onlineUsers,
                totalRevenue: totalRevenue[0]?.total || 0,
                pendingWithdrawals
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getRevenue: async (req, res) => {
        try {
            const { period = 'month' } = req.query;
            // Implementation for revenue analytics
            res.json({ message: 'Revenue analytics' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getUsers: async (req, res) => {
        try {
            const { period = 'week' } = req.query;
            // Implementation for user analytics
            res.json({ message: 'User analytics' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

// ===== ADMIN CONTROLLERS =====
const admin = {
    getStats: async (req, res) => {
        try {
            const stats = await analytics.getDashboard(req, res);
            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    listUsers: async (req, res) => {
        try {
            const users = await User.find()
                .select('-__v')
                .sort({ createdAt: -1 })
                .limit(100);
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    listWithdrawals: async (req, res) => {
        try {
            const { status } = req.query;
            const filter = status ? { status } : {};
            const withdrawals = await Withdrawal.find(filter)
                .populate('user', 'username')
                .sort({ createdAt: -1 });
            res.json(withdrawals);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = {
    auth,
    user,
    wallet,
    content,
    product,
    ad,
    offer,
    referral,
    chat,
    notification,
    leaderboard,
    analytics,
    admin
};
