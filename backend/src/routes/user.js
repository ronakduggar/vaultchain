const express = require("express");
const router = express.Router();
const User = require("../models/User");
const SecurityLog = require("../models/SecurityLog");
const { authMiddleware } = require("./auth");

// 1. GET PROFILE & METRICS
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-loginHash -pinHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. CONNECT WALLET ADDRESS
router.post("/wallet-connect", authMiddleware, async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) return res.status(400).json({ message: "Wallet address is required" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.walletAddress = walletAddress;
    await user.save();

    await SecurityLog.create({
      userId: user._id,
      email: user.email,
      action: "WALLET_CONNECTED",
      status: "SUCCESS",
      details: `Wallet connected: ${walletAddress}`,
    });

    res.json({ message: "Wallet linked successfully", walletAddress: user.walletAddress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 3. UPDATE SECURITY SCORE
router.post("/security-score", authMiddleware, async (req, res) => {
  try {
    const { score } = req.body;
    if (score === undefined || score < 0 || score > 100) {
      return res.status(400).json({ message: "Score must be a number between 0 and 100" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.securityScore = score;
    await user.save();

    await SecurityLog.create({
      userId: user._id,
      email: user.email,
      action: "SECURITY_SCORE_UPDATE",
      status: "SUCCESS",
      details: `Security score updated to ${score}%`,
    });

    res.json({ message: "Security score updated", securityScore: user.securityScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 4. GET PERSONAL SECURITY LOGS
router.get("/logs", authMiddleware, async (req, res) => {
  try {
    const logs = await SecurityLog.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
