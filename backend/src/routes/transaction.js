const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const { authMiddleware } = require("./auth");
const SecurityLog = require("../models/SecurityLog");
const User = require("../models/User");

// 1. LOG BLOCKCHAIN TRANSACTION
router.post("/log", authMiddleware, async (req, res) => {
  try {
    const { txHash, ipfsHash, actionType, gasUsed, blockNumber } = req.body;
    if (!txHash || !ipfsHash || !actionType || gasUsed === undefined || !blockNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const transaction = new Transaction({
      userId: req.user.id,
      txHash,
      ipfsHash,
      actionType,
      gasUsed,
      blockNumber,
    });

    await transaction.save();

    // Map actions to security log types
    let securityAction = "PASSWORD_ADD";
    if (actionType === "UPDATE") securityAction = "PASSWORD_UPDATE";
    if (actionType === "DELETE") securityAction = "PASSWORD_DELETE";

    await SecurityLog.create({
      userId: req.user.id,
      email: req.user.email,
      action: securityAction,
      status: "SUCCESS",
      details: `Logged on-chain action ${actionType} with txHash ${txHash} and IPFS CID ${ipfsHash}`,
    });

    // Update approximate user data size (each transaction block stores ~500 bytes)
    const user = await User.findById(req.user.id);
    if (user) {
      user.storageUsedBytes = (user.storageUsedBytes || 0) + 512;
      await user.save();
    }

    res.status(201).json({ message: "Transaction logged successfully", transaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. GET USER TRANSACTION HISTORY
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const history = await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
