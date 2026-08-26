import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoURI) throw new Error("MONGODB_URI or MONGO_URI is required");
    await mongoose.connect(mongoURI);
    console.log("MongoDB Connected Successfully to:", mongoURI);
  } catch (err) {
    console.error("MongoDB Connection Failed:", err.message);
    process.exit(1);
  }
};

export default connectDB;
