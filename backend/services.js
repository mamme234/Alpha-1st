const { User, Transaction, Notification } = require('./models');
const { generateReferralCode } = require('./auth');

// ===== EARNING SERVICES =====
const EarningService = {
    // Process ad reward
    async processAdReward(userId, adId, reward) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');
        
        user.wallet.balance += reward;
        user.wallet.lifetime += reward;
        user.xp += 5;
        await user.updateLevel();
        await user.save();
        
        await Transaction.create({
            user: userId,
            type: 'credit',
            category: 'ad',
            amount: reward,
            description: `Ad reward ${adId}`
        });
        
        return user;
    },

    // Process offer completion
    async processOfferCompletion(userId, offerId, reward) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');
        
        user.wallet.balance += reward;
        user.wallet.lifetime += reward;
        user.xp += 10;
        await user.updateLevel();
        await user.save();
        
        await Transaction.create({
            user: userId,
            type: 'credit',
            category: 'offer',
            amount: reward,
            description: `Offer completion ${offerId}`
        });
        
        return user;
    },

    // Process referral reward
    async processReferralReward(referrerId, referredId) {
        const reward = 0.50;
        const user = await User.findById(referrerId);
        if (!user) throw new Error('Referrer not found');
        
        user.wallet.balance += reward;
        user.wallet.lifetime += reward;
        await user.save();
        
        await Transaction.create({
            user: referrerId,
            type: 'credit',
            category: 'referral',
            amount: reward,
            description: `Referral bonus for user ${referredId}`
        });
        
        // Notify referrer
        await Notification.create({
            user: referrerId,
            type: 'earning',
            title: 'Referral Reward!',
            message: `You earned $${reward} for your referral!`,
            data: { referredId, reward }
        });
        
        return user;
    }
};

// ===== LEVEL SERVICE =====
const LevelService = {
    // Calculate level from XP
    calculateLevel(xp) {
        return Math.floor(xp / 100) + 1;
    },

    // XP required for next level
    xpRequiredForLevel(level) {
        return level * 100;
    },

    // Update user level
    async updateLevel(user) {
        const newLevel = this.calculateLevel(user.xp);
        if (newLevel > user.level) {
            user.level = newLevel;
            await user.save();
            
            // Notify user
            await Notification.create({
                user: user._id,
                type: 'system',
                title: 'Level Up! 🎉',
                message: `Congratulations! You've reached Level ${newLevel}!`,
                data: { level: newLevel }
            });
        }
        return user;
    }
};

// ===== REWARD SERVICE =====
const RewardService = {
    // Daily rewards
    async processDailyReward(userId) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');
        
        const reward = 0.02;
        user.wallet.balance += reward;
        user.wallet.lifetime += reward;
        user.xp += 2;
        await user.updateLevel();
        await user.save();
        
        await Transaction.create({
            user: userId,
            type: 'credit',
            category: 'reward',
            amount: reward,
            description: 'Daily login reward'
        });
        
        return user;
    },

    // Lucky spin
    async luckySpin(userId) {
        const rewards = [0, 0.01, 0.05, 0.10, 0.25, 0.50, 1.00];
        const reward = rewards[Math.floor(Math.random() * rewards.length)];
        
        if (reward > 0) {
            const user = await User.findById(userId);
            user.wallet.balance += reward;
            user.wallet.lifetime += reward;
            await user.save();
            
            await Transaction.create({
                user: userId,
                type: 'credit',
                category: 'reward',
                amount: reward,
                description: 'Lucky spin reward'
            });
        }
        
        return reward;
    }
};

// ===== PAYMENT SERVICE =====
const PaymentService = {
    // Process product purchase
    async processPurchase(userId, productId, amount) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');
        
        if (user.wallet.balance < amount) {
            throw new Error('Insufficient balance');
        }
        
        user.wallet.balance -= amount;
        await user.save();
        
        await Transaction.create({
            user: userId,
            type: 'debit',
            category: 'sale',
            amount: amount,
            description: `Product purchase ${productId}`
        });
        
        return user;
    },

    // Process withdrawal
    async processWithdrawal(userId, amount, method, address) {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');
        
        if (user.wallet.balance < amount) {
            throw new Error('Insufficient balance');
        }
        
        const withdrawal = await Withdrawal.create({
            user: userId,
            amount,
            method,
            address,
            status: 'pending'
        });
        
        return withdrawal;
    }
};

// ===== NOTIFICATION SERVICE =====
const NotificationService = {
    // Send notification to user
    async sendToUser(userId, title, message, type = 'system', data = {}) {
        await Notification.create({
            user: userId,
            title,
            message,
            type,
            data
        });
    },

    // Send notification to multiple users
    async sendToMany(userIds, title, message, type = 'system', data = {}) {
        const notifications = userIds.map(userId => ({
            user: userId,
            title,
            message,
            type,
            data
        }));
        await Notification.insertMany(notifications);
    },

    // Send notification to all users
    async sendToAll(title, message, type = 'system', data = {}) {
        const users = await User.find().select('_id');
        const notifications = users.map(user => ({
            user: user._id,
            title,
            message,
            type,
            data
        }));
        await Notification.insertMany(notifications);
    }
};

// ===== ANALYTICS SERVICE =====
const AnalyticsService = {
    // Get user stats
    async getUserStats() {
        const total = await User.countDocuments();
        const online = await User.countDocuments({ 
            lastActive: { $gte: new Date(Date.now() - 5 * 60 * 1000) } 
        });
        const newToday = await User.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        
        return { total, online, newToday };
    },

    // Get revenue stats
    async getRevenueStats(period = 'day') {
        const startDate = new Date();
        if (period === 'day') startDate.setHours(0, 0, 0, 0);
        else if (period === 'week') startDate.setDate(startDate.getDate() - 7);
        else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
        
        const revenue = await Transaction.aggregate([
            { $match: { 
                createdAt: { $gte: startDate },
                category: { $in: ['sale', 'ad', 'offer'] }
            }},
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        const platformFees = await Transaction.aggregate([
            { $match: { 
                createdAt: { $gte: startDate },
                category: 'sale'
            }},
            { $group: { _id: null, total: { $sum: { $multiply: ['$amount', 0.15] } } } }
        ]);
        
        return {
            revenue: revenue[0]?.total || 0,
            platformFees: platformFees[0]?.total || 0
        };
    },

    // Get content stats
    async getContentStats() {
        const total = await Content.countDocuments();
        const pending = await Content.countDocuments({ status: 'pending' });
        const approved = await Content.countDocuments({ status: 'approved' });
        
        return { total, pending, approved };
    }
};

module.exports = {
    EarningService,
    LevelService,
    RewardService,
    PaymentService,
    NotificationService,
    AnalyticsService
};
