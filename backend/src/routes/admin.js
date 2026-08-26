import express from "express";
import User from "../models/User.js";
import SecurityLog from "../models/SecurityLog.js";
import Transaction from "../models/Transaction.js";
import { adminMiddleware } from "../middleware/auth.js"; // ✅ unified

const router = express.Router();
router.use(adminMiddleware);

// ... (all route handlers remain exactly as provided)
// We keep them unchanged; they are not authentication-related.

export default router;