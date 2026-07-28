const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alpha-super', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
        
        // Create indexes
        await conn.connection.db.collection('users').createIndex({ telegramId: 1 }, { unique: true });
        console.log('✅ Indexes created');
    } catch (error) {
        console.error(`❌ MongoDB connection error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = { connectDB };
