import jwt from "jsonwebtoken";
import { isTokenRevoked } from "../config/redis.js";

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware factory that authenticates a request and optionally checks a role.
 * @param {string} requiredRole - "user", "admin", or undefined (any authenticated)
 */
const authenticate = (requiredRole = null) => async (req, res, next) => {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: "Authorization token is required" });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);

        // Check role if required
        if (requiredRole && payload.role !== requiredRole) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }

        // Check if token was revoked (logout)
        if (await isTokenRevoked(payload.jti)) {
            return res.status(401).json({ message: "Session has been logged out" });
        }

        // Attach user payload to request
        req.user = payload;
        next();
    } catch (error) {
        // jwt.verify throws for expired/invalid tokens
        return res.status(401).json({ message: "Token is invalid or expired" });
    }
};

// Convenience exports
export const authMiddleware = authenticate();                 // any authenticated user
export const adminMiddleware = authenticate("admin");         // only admin