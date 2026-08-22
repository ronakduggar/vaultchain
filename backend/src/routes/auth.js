const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const SecurityLog = require("../models/SecurityLog");

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || "vaultchain_jwt_secret_key_1337";

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided, authorization denied" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// 1. GET SALT (Zero-Knowledge: get salt to hash password locally)
router.get("/salt", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: "Email parameter is required" });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ salt: user.salt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. REGISTER USER
router.post("/register", async (req, res) => {
  try {
    const { name, email, loginHash, salt } = req.body;
    if (!name || !email || !loginHash || !salt) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      loginHash,
      salt,
    });

    await newUser.save();

    // Log the registration event
    await SecurityLog.create({
      userId: newUser._id,
      email: newUser.email,
      action: "USER_REGISTER",
      status: "SUCCESS",
      details: "User successfully registered with local salt generation",
    });

    // Create JWT
    const token = jwt.sign({ id: newUser._id, email: newUser.email, name: newUser.name }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        walletAddress: newUser.walletAddress,
        isBiometricEnabled: newUser.isBiometricEnabled,
        securityScore: newUser.securityScore,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 3. LOGIN USER (Zero-Knowledge: compares client derived loginHash)
router.post("/login", async (req, res) => {
  try {
    const { email, loginHash } = req.body;
    if (!email || !loginHash) {
      return res.status(400).json({ message: "Email and login hash are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      await SecurityLog.create({
        email: email.toLowerCase(),
        action: "USER_LOGIN",
        status: "FAILED",
        details: "Login failed: User not found",
      });
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (user.loginHash !== loginHash) {
      await SecurityLog.create({
        userId: user._id,
        email: user.email,
        action: "USER_LOGIN",
        status: "FAILED",
        details: "Login failed: Incorrect credentials",
      });
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Success login logging
    await SecurityLog.create({
      userId: user._id,
      email: user.email,
      action: "USER_LOGIN",
      status: "SUCCESS",
      details: "User logged in successfully via E2EE loginHash verification",
    });

    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        isBiometricEnabled: user.isBiometricEnabled,
        securityScore: user.securityScore,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 4. VERIFY OTP (Demonstration endpoint - returns code or validates code 123456)
router.post("/request-otp", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });
  // Mock sending OTP
  res.json({ message: "OTP sent successfully to " + email, mockCode: "123456" });
});

router.post("/verify-otp", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ message: "Email and code are required" });
  
  if (code === "123456") {
    res.json({ success: true, message: "OTP verified successfully" });
  } else {
    res.status(400).json({ success: false, message: "Invalid OTP code" });
  }
});

// 5. SETUP PIN (Protected route)
router.post("/pin-setup", authMiddleware, async (req, res) => {
  try {
    const { pinHash } = req.body;
    if (!pinHash) return res.status(400).json({ message: "Pin hash is required" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.pinHash = pinHash;
    await user.save();

    await SecurityLog.create({
      userId: user._id,
      email: user.email,
      action: "PIN_SETUP",
      status: "SUCCESS",
      details: "PIN successfully updated",
    });

    res.json({ message: "PIN setup successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 6. TOGGLE BIOMETRICS (Protected route)
router.post("/biometric-setup", authMiddleware, async (req, res) => {
  try {
    const { enabled } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBiometricEnabled = enabled;
    await user.save();

    await SecurityLog.create({
      userId: user._id,
      email: user.email,
      action: "BIOMETRIC_TOGGLE",
      status: "SUCCESS",
      details: `Biometrics setup toggled to ${enabled}`,
    });

    res.json({ message: "Biometrics preference updated", enabled: user.isBiometricEnabled });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = { router, authMiddleware };
