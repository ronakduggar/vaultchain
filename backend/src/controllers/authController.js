import crypto from "crypto";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import SecurityLog from "../models/SecurityLog.js";
import { revokeToken } from "../config/redis.js";
import { sendPasswordResetEmail } from "../config/mailer.js";
import {
    hashPassword,
    comparePassword,
    issueToken,
    generateResetToken,
    compareTokenHash,
    normalizeEmail,
    publicUser,
} from "../services/authService.js";

const RESET_TTL = 15 * 60 * 1000; // 15 minutes

// ---------- HELPER: handle password reset request (shared by user & admin) ----------
const handleForgotPassword = (Model, action, role) => async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const account = await Model.findOne({ email }).select(
            "+passwordResetTokenHash +passwordResetExpiresAt"
        );

        if (account) {
            // Generate token and store its hash
            const rawToken = generateResetToken();
            account.passwordResetTokenHash = crypto
                .createHash("sha256")
                .update(rawToken)
                .digest("hex");
            account.passwordResetExpiresAt = new Date(Date.now() + RESET_TTL);
            await account.save();

            await SecurityLog.create({
                email,
                action,
                status: "SUCCESS",
                details: "Reset token generated",
            });

            // Send email (non-blocking)
            const emailSent = await sendPasswordResetEmail(email, rawToken, role);
            if (!emailSent && process.env.NODE_ENV !== "production") {
                // For development only: return the raw token
                return res.json({
                    message: "If an account exists, reset instructions have been sent",
                    resetToken: rawToken, // ⚠️ only in dev
                });
            }
        }

        // Always return same message to avoid user enumeration
        return res.json({
            message: "If an account exists, reset instructions have been sent",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ---------- HELPER: handle password reset (shared) ----------
const handleResetPassword = (Model, action, isAdmin) => async (req, res) => {
    try {
        const { email, token, password } = req.body;
        const normalizedEmail = normalizeEmail(email);

        if (!normalizedEmail || !token || !password) {
            return res.status(400).json({ message: "Email, token, and password are required" });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters" });
        }

        const account = await Model.findOne({ email: normalizedEmail }).select(
            "+passwordResetTokenHash +passwordResetExpiresAt"
        );
        if (!account) {
            return res.status(400).json({ message: "Reset token is invalid or expired" });
        }

        // Check token validity using timing-safe compare
        const isValid = compareTokenHash(token, account.passwordResetTokenHash);
        const isExpired = account.passwordResetExpiresAt < new Date();

        if (!isValid || isExpired) {
            return res.status(400).json({ message: "Reset token is invalid or expired" });
        }

        // Update password (bcrypt hash)
        account.passwordHash = await hashPassword(password);
        account.passwordResetTokenHash = null;
        account.passwordResetExpiresAt = null;
        await account.save();

        await SecurityLog.create({
            email: account.email,
            action,
            status: "SUCCESS",
            details: "Password reset successful",
        });

        return res.json({ message: "Password reset successful" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ---------- GET SALT (Zero-Knowledge) ----------
export const getSalt = async (req, res) => {
    try {
        const { email } = req.query;
        const normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail) {
            return res.status(400).json({ message: "Email parameter is required" });
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json({ salt: user.salt || "" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ---------- USER REGISTRATION ----------
export const registerUser = async (req, res) => {
    try {
        const { name, email, password, loginHash, salt } = req.body;
        const normalizedEmail = normalizeEmail(email);

        if (!name || !normalizedEmail) {
            return res.status(400).json({ message: "Name and email are required" });
        }

        if (!password && (!loginHash || !salt)) {
            return res.status(400).json({ message: "Password or (loginHash and salt) are required" });
        }

        if (password && password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters" });
        }

        // Check existing user
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(409).json({ message: "An account already exists with this email" });
        }

        let passwordHash = "";
        let storedLoginHash = "";
        if (password) {
            passwordHash = await hashPassword(password);
        }
        if (loginHash) {
            storedLoginHash = loginHash;
            if (!passwordHash) {
                passwordHash = await hashPassword(loginHash);
            }
        }

        // Create user
        const user = await User.create({
            name,
            email: normalizedEmail,
            passwordHash,
            loginHash: storedLoginHash,
            salt: salt || "",
        });

        await SecurityLog.create({
            userId: user._id,
            email: user.email,
            action: "USER_REGISTER",
            status: "SUCCESS",
            details: salt ? "User successfully registered with local salt generation" : "User registered",
        });

        const token = issueToken(user, "user");
        return res.status(201).json({ token, user: publicUser(user) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ---------- USER LOGIN ----------
export const loginUser = async (req, res) => {
    try {
        const { email, password, loginHash } = req.body;
        const normalizedEmail = normalizeEmail(email);

        if (!normalizedEmail || (!password && !loginHash)) {
            return res.status(400).json({ message: "Email and password or loginHash are required" });
        }

        const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash +loginHash");
        if (!user || !user.isActive) {
            await SecurityLog.create({
                email: normalizedEmail,
                action: "USER_LOGIN",
                status: "FAILED",
                details: "User not found or inactive",
            });
            return res.status(401).json({ message: "Invalid email or password" });
        }

        let isMatch = false;
        if (loginHash) {
            if (user.loginHash && user.loginHash === loginHash) {
                isMatch = true;
            } else if (user.passwordHash) {
                isMatch = await comparePassword(loginHash, user.passwordHash);
            }
        } else if (password && user.passwordHash) {
            isMatch = await comparePassword(password, user.passwordHash);
        }

        if (!isMatch) {
            await SecurityLog.create({
                email: normalizedEmail,
                action: "USER_LOGIN",
                status: "FAILED",
                details: "Incorrect credentials",
            });
            return res.status(401).json({ message: "Invalid email or password" });
        }

        await SecurityLog.create({
            userId: user._id,
            email: user.email,
            action: "USER_LOGIN",
            status: "SUCCESS",
            details: "User logged in successfully",
        });

        const token = issueToken(user, "user");
        return res.json({ token, user: publicUser(user) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ---------- SETUP PIN (Protected) ----------
export const setupPin = async (req, res) => {
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

        return res.json({ message: "PIN setup successful" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ---------- SETUP BIOMETRICS (Protected) ----------
export const setupBiometric = async (req, res) => {
    try {
        const { enabled } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.isBiometricEnabled = !!enabled;
        await user.save();

        await SecurityLog.create({
            userId: user._id,
            email: user.email,
            action: "BIOMETRIC_TOGGLE",
            status: "SUCCESS",
            details: `Biometrics setup toggled to ${enabled}`,
        });

        return res.json({ message: "Biometrics preference updated", enabled: user.isBiometricEnabled });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ---------- ADMIN REGISTRATION ----------
export const registerAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const normalizedEmail = normalizeEmail(email);

        if (!name || !normalizedEmail || !password || password.length < 8) {
            return res.status(400).json({
                message: "Name, email, and a password of at least 8 characters are required",
            });
        }

        const existing = await Admin.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(409).json({ message: "Admin already exists" });
        }

        const passwordHash = await hashPassword(password);
        const admin = await Admin.create({
            name,
            email: normalizedEmail,
            passwordHash,
        });

        await SecurityLog.create({
            email: admin.email,
            action: "ADMIN_REGISTER",
            status: "SUCCESS",
        });

        const token = issueToken(admin, "admin");
        return res.status(201).json({
            token,
            admin: { id: admin._id, name: admin.name, email: admin.email },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ---------- ADMIN LOGIN ----------
export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = normalizeEmail(email);

        if (!normalizedEmail || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const admin = await Admin.findOne({ email: normalizedEmail }).select("+passwordHash");
        if (!admin || !admin.isActive) {
            await SecurityLog.create({
                email: normalizedEmail,
                action: "ADMIN_LOGIN",
                status: "FAILED",
                details: "Admin not found or inactive",
            });
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await comparePassword(password, admin.passwordHash);
        if (!isMatch) {
            await SecurityLog.create({
                email: normalizedEmail,
                action: "ADMIN_LOGIN",
                status: "FAILED",
                details: "Incorrect password",
            });
            return res.status(401).json({ message: "Invalid email or password" });
        }

        await SecurityLog.create({
            email: admin.email,
            action: "ADMIN_LOGIN",
            status: "SUCCESS",
        });

        const token = issueToken(admin, "admin");
        return res.json({
            token,
            admin: { id: admin._id, name: admin.name, email: admin.email },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

// ---------- FORGOT PASSWORD (User) ----------
export const forgotPasswordUser = handleForgotPassword(
    User,
    "USER_PASSWORD_RESET_REQUEST",
    "user"
);

// ---------- FORGOT PASSWORD (Admin) ----------
export const forgotPasswordAdmin = handleForgotPassword(
    Admin,
    "ADMIN_PASSWORD_RESET_REQUEST",
    "admin"
);

// ---------- RESET PASSWORD (User) ----------
export const resetPasswordUser = handleResetPassword(
    User,
    "USER_PASSWORD_RESET",
    false
);

// ---------- RESET PASSWORD (Admin) ----------
export const resetPasswordAdmin = handleResetPassword(
    Admin,
    "ADMIN_PASSWORD_RESET",
    true
);

// ---------- LOGOUT ----------
export const logout = async (req, res) => {
    try {
        // req.user is set by authMiddleware
        const { jti, exp, email, role } = req.user;
        await revokeToken(jti, exp);
        await SecurityLog.create({
            email,
            action: role === "admin" ? "ADMIN_LOGOUT" : "USER_LOGOUT",
            status: "SUCCESS",
        });
        return res.json({ message: "Logged out successfully" });
    } catch (error) {
        console.error(error);
        return res.status(503).json({ message: "Logout service unavailable" });
    }
};