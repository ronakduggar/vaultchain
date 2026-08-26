import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Hash a plain password using bcrypt.
 * @param {string} password - plain text password
 * @returns {Promise<string>} hashed password
 */
export const hashPassword = async (password) => {
    return await bcrypt.hash(password, 12);
};

/**
 * Compare a plain password with a stored bcrypt hash.
 * @param {string} password - plain text
 * @param {string} hash - stored hash
 * @returns {Promise<boolean>}
 */
export const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

/**
 * Generate a JWT for a user/admin account.
 * @param {Object} account - mongoose document with _id, email, name
 * @param {string} role - "user" or "admin"
 * @returns {string} signed JWT
 */
export const issueToken = (account, role) => {
    return jwt.sign(
        {
            id: account._id,
            email: account.email,
            name: account.name,
            role,
        },
        JWT_SECRET,
        {
            expiresIn: "7d",
            jwtid: crypto.randomUUID(), // unique token ID for revocation
        }
    );
};

/**
 * Hash a raw token for storage (used for password reset tokens).
 * @param {string} token - raw hex token
 * @returns {string} SHA-256 hex digest
 */
export const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Securely compare two hashed tokens (timing-safe).
 * @param {string} providedToken - raw token from request
 * @param {string} storedHash - stored hex hash
 * @returns {boolean} true if match
 */
export const compareTokenHash = (providedToken, storedHash) => {
    if (!providedToken || !storedHash) return false;
    try {
        const providedBuffer = Buffer.from(hashToken(providedToken), "hex");
        const storedBuffer = Buffer.from(storedHash, "hex");
        if (providedBuffer.length !== storedBuffer.length) return false;
        return crypto.timingSafeEqual(providedBuffer, storedBuffer);
    } catch {
        return false;
    }
};

/**
 * Generate a random reset token (32 bytes hex).
 * @returns {string}
 */
export const generateResetToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

/**
 * Normalize email to lowercase and trim.
 */
export const normalizeEmail = (email) => email?.trim().toLowerCase();

/**
 * Create a public-safe user object (no sensitive fields).
 */
export const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    walletAddress: user.walletAddress,
    isBiometricEnabled: user.isBiometricEnabled,
    securityScore: user.securityScore,
});