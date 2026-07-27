const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
    telegramId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    firstName: String,
    lastName: String,
    avatar: String,
    bio: { type: String, default: 'Alpha member' },
    country: String,
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    wallet: {
        balance: { type: Number, default: 0 },
        pending: { type: Number, default: 0 },
        lifetime: { type: Number, default: 0 },
        withdrawn: { type: Number, default: 0 }
    },
    premium: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    isCreator: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    banned: { type: Boolean, default: false },
    referralCode: { type: String, unique: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    achievements: [String],
    settings: {
        notifications: { type: Boolean, default: true },
        darkMode: { type: Boolean, default: true },
        privacy: { type: String, default: 'public' }
    },
    lastActive: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

// Content Schema
const contentSchema = new mongoose.Schema({
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['video', 'photo', 'audio', 'document', 'course'], required: true },
    title: { type: String, required: true },
    description: String,
    fileUrl: String,
    thumbnailUrl: String,
    price: { type: Number, default: 0 },
    isPaid: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    earnings: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    tags: [String],
    createdAt: { type: Date, default: Date.now }
});

// Product Schema
const productSchema = new mongoose.Schema({
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    category: { type: String, enum: ['business', 'ai', 'education', 'design', 'tech', 'entertainment'] },
    imageUrl: String,
    fileUrl: String,
    downloads: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

// Transaction Schema
const transactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['credit', 'debit'] },
    category: { type: String, enum: ['ad', 'offer', 'referral', 'sale', 'withdraw', 'deposit', 'reward'] },
    amount: { type: Number, required: true },
    description: String,
    reference: String,
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    createdAt: { type: Date, default: Date.now }
});

// Withdrawal Schema
const withdrawalSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['bank', 'crypto', 'paypal'] },
    address: String,
    status: { type: String, enum: ['pending', 'approved', 'completed', 'rejected'], default: 'pending' },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    processedAt: Date,
    createdAt: { type: Date, default: Date.now }
});

// Ad Schema
const adSchema = new mongoose.Schema({
    title: String,
    type: { type: String, enum: ['rewarded', 'banner', 'sponsored', 'popup'] },
    reward: { type: Number, default: 0.05 },
    duration: { type: Number, default: 30 },
    url: String,
    imageUrl: String,
    active: { type: Boolean, default: true },
    dailyLimit: { type: Number, default: 10 },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Comment Schema
const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    targetType: { type: String, enum: ['content', 'product', 'post'] },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    createdAt: { type: Date, default: Date.now }
});

// Chat Schema
const chatSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: String,
        type: { type: String, enum: ['text', 'image', 'file', 'voice'], default: 'text' },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }],
    lastMessage: String,
    lastMessageAt: { type: Date, default: Date.now }
});

// Notification Schema
const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['earning', 'message', 'withdraw', 'offer', 'promotion', 'system'] },
    title: String,
    message: String,
    read: { type: Boolean, default: false },
    data: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
});

// Export models
const User = mongoose.model('User', userSchema);
const Content = mongoose.model('Content', contentSchema);
const Product = mongoose.model('Product', productSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
const Ad = mongoose.model('Ad', adSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Chat = mongoose.model('Chat', chatSchema);
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = {
    User,
    Content,
    Product,
    Transaction,
    Withdrawal,
    Ad,
    Comment,
    Chat,
    Notification
};
