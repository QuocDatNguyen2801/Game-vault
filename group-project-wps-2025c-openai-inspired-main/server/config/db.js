const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

const connectDBTest = async () => {
    try {
        const uri = process.env.MONGO_URI_TEST || process.env.MONGO_URI;
        if (!uri) throw new Error('Missing MONGO_URI_TEST or MONGO_URI env variable');
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Test connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('MongoDB Test connection failed:', error.message);
        process.exit(1);
    }
};

const connectDBLocal = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI_LOCAL);
        console.log(`MongoDB Local connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('MongoDB Local connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = { connectDB, connectDBTest };