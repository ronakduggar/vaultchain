const express = require("express");
const router = express.Router();
const User = require("../models/User");
const SecurityLog = require("../models/SecurityLog");
const Transaction = require("../models/Transaction");

// 1. GET SYSTEM ANALYTICS & STATS
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalTx = await Transaction.countDocuments();
    
    // Average Security Score
    const scoreAgg = await User.aggregate([
      { $group: { _id: null, avgScore: { $avg: "$securityScore" } } }
    ]);
    const avgSecurityScore = scoreAgg.length > 0 ? Math.round(scoreAgg[0].avgScore) : 100;

    // Total Storage Used
    const storageAgg = await User.aggregate([
      { $group: { _id: null, totalBytes: { $sum: "$storageUsedBytes" } } }
    ]);
    const totalStorageBytes = storageAgg.length > 0 ? storageAgg[0].totalBytes : 0;

    // Category Distribution Mock (for admin charts)
    const transactionTypeStats = await Transaction.aggregate([
      { $group: { _id: "$actionType", count: { $sum: 1 } } }
    ]);

    res.json({
      totalUsers,
      activeUsers,
      totalTransactions: totalTx,
      avgSecurityScore,
      totalStorageBytes,
      txTypes: transactionTypeStats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. GET ALL USERS LIST
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-loginHash -pinHash").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 3. GET SYSTEM SECURITY LOGS
router.get("/logs", async (req, res) => {
  try {
    const logs = await SecurityLog.find().sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 4. ACTIVATE / DEACTIVATE USER
router.post("/toggle-status/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ message: `User status toggled to ${user.isActive}`, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
