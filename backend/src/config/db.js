const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/vaultchain";
    await mongoose.connect(mongoURI);
    console.log("MongoDB Connected Successfully to:", mongoURI);
  } catch (err) {
    console.error("MongoDB Connection Failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
