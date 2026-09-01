import express from "express";
import User from "../models/User.js";
import SecurityLog from "../models/SecurityLog.js";
import Transaction from "../models/Transaction.js";
import { adminMiddleware } from "../middleware/auth.js";

const router = express.Router();
router.use(adminMiddleware);

// 1. GET ADMIN STATISTICS
router.get("/stats", async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ isActive: true });
        const totalTransactions = await Transaction.countDocuments();

        const users = await User.find().select("securityScore storageUsedBytes");
        const avgSecurityScore = users.length > 0
            ? Math.round(users.reduce((sum, u) => sum + (u.securityScore || 100), 0) / users.length)
            : 100;

        const totalStorageBytes = users.reduce((sum, u) => sum + (u.storageUsedBytes || 0), 0);

        res.json({
            totalUsers,
            totalTransactions,
            avgSecurityScore,
            totalStorageBytes,
            timestamp: new Date(),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// 2. GET ALL USERS
router.get("/users", async (req, res) => {
    try {
        const users = await User.find().select("-passwordHash -pinHash");
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// 3. TOGGLE USER ACTIVE STATUS
router.post("/toggle-status/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.isActive = !user.isActive;
        await user.save();

        await SecurityLog.create({
            userId: user._id,
            email: user.email,
            action: "ADMIN_TOGGLE_USER_STATUS",
            status: "SUCCESS",
            details: `User status toggled to ${user.isActive ? "active" : "inactive"}`,
        });

        res.json({ message: "User status updated", isActive: user.isActive });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// 4. GET SECURITY LOGS
router.get("/logs", async (req, res) => {
    try {
        const logs = await SecurityLog.find().sort({ createdAt: -1 }).limit(50);
        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// 5. GET USER DETAILS
router.get("/users/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-passwordHash -pinHash");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// 6. GET USER TRANSACTIONS
router.get("/users/:id/transactions", async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.params.id }).sort({ createdAt: -1 });
        res.json(transactions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;