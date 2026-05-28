require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");

async function checkDB() {
    try {
        console.log("Connecting to:", process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Database connected.");

        const userCount = await User.countDocuments();
        console.log("Total Users in DB:", userCount);

        const users = await User.find().limit(5);
        console.log("Last 5 Users:", users.map(u => ({ id: u._id, email: u.email, name: u.name })));

        process.exit(0);
    } catch (err) {
        console.error("❌ Diagnostic failed:", err.message);
        process.exit(1);
    }
}

checkDB();
