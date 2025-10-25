const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (!process.env.DB_URL) {
            throw new Error('DB_URL environment variable is not defined. Please check your .env file.');
        }

        const conn = await mongoose.connect(process.env.DB_URL, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
            bufferCommands: false, // Disable mongoose buffering
        });
        


        
        console.log("DB connected successfully!!!");
        console.log(`MongoDB connected: ${conn.connection.host}`);
    }
    catch(err) {
        console.log("Database connection failed:", err.message);
        console.log("Please check:");
        console.log("1. MongoDB is running");
        console.log("2. DB_URL is correctly set in .env file");
        console.log("3. Network connectivity");
        process.exit(1);
    }
}

module.exports = connectDB;