const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alpha-super', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
        
        // Remove the problematic index creation
        // The index already exists, so we don't need to create it again
        
        console.log('✅ Database ready');
    } catch (error) {
        console.error(`❌ MongoDB connection error: ${error.message}`);
        // Don't exit, just log the error
        console.log('⚠️ Continuing with limited functionality');
    }
};

module.exports = { connectDB };
