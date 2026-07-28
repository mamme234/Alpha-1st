const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
    telegramId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    firstName: String,
    lastName: String,
    avatar: String,
    bio: { type: String, default: 'Super App member' },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    wallet: {
        balance: { type: Number, default: 0 },
        pending: { type: Number, default: 0 },
        lifetime: { type: Number, default: 0 },
        withdrawn: { type: Number, default: 0 }
    },
    premium: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    isCreator: { type: Boolean, default: false },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    ratings: [{ type: Number, min: 1, max: 5 }],
    achievements: [String],
    settings: {
        notifications: { type: Boolean, default: true },
        darkMode: { type: Boolean, default: true }
    },
    createdAt: { type: Date, default: Date.now }
});

// Video Schema
const videoSchema = new mongoose.Schema({
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: String,
    url: String,
    thumbnail: String,
    views: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    isPaid: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

// Product Schema
const productSchema = new mongoose.Schema({
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    category: { type: String, enum: ['prompts', 'websites', 'bots', 'code', 'logos', 'ui', 'ebooks', 'courses', 'photos', 'videos'] },
    imageUrl: String,
    fileUrl: String,
    downloads: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

// Job Schema
const jobSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: String,
    budget: { type: Number, required: true },
    category: { type: String, enum: ['programming', 'design', 'translation', 'writing', 'video', 'marketing'] },
    status: { type: String, enum: ['open', 'in_progress', 'completed', 'cancelled'], default: 'open' },
    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});

// Course Schema
const courseSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    category: { type: String, enum: ['programming', 'design', 'business', 'marketing', 'ai'] },
    videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
    pdfs: [String],
    quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    rating: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    createdAt: { type: Date, default: Date.now }
});

// Transaction Schema
const transactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['credit', 'debit'] },
    category: { type: String, enum: ['sale', 'purchase', 'withdraw', 'deposit', 'reward', 'tip', 'subscription'] },
    amount: { type: Number, required: true },
    description: String,
    reference: String,
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    createdAt: { type: Date, default: Date.now }
});

// Comment Schema
const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    targetType: { type: String, enum: ['video', 'product', 'course'] },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
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
    type: { type: String, enum: ['earning', 'message', 'withdraw', 'offer', 'promotion', 'system', 'follow', 'like', 'comment'] },
    title: String,
    message: String,
    read: { type: Boolean, default: false },
    data: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
});

// Export models
const User = mongoose.model('User', userSchema);
const Video = mongoose.model('Video', videoSchema);
const Product = mongoose.model('Product', productSchema);
const Job = mongoose.model('Job', jobSchema);
const Course = mongoose.model('Course', courseSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Chat = mongoose.model('Chat', chatSchema);
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = {
    User,
    Video,
    Product,
    Job,
    Course,
    Transaction,
    Comment,
    Chat,
    Notification
};
