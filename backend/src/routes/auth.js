import express from "express";
import {
    getSalt,
    registerUser,
    loginUser,
    setupPin,
    setupBiometric,
    registerAdmin,
    loginAdmin,
    forgotPasswordUser,
    forgotPasswordAdmin,
    resetPasswordUser,
    resetPasswordAdmin,
    logout,
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// User routes (Zero-Knowledge & Standard)
router.get("/salt", getSalt);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/pin-setup", authMiddleware, setupPin);
router.post("/biometric-setup", authMiddleware, setupBiometric);
router.post("/forgot-password", forgotPasswordUser);
router.post("/reset-password", resetPasswordUser);

// Admin routes
router.post("/admin/register", registerAdmin);
router.post("/admin/login", loginAdmin);
router.post("/admin/forgot-password", forgotPasswordAdmin);
router.post("/admin/reset-password", resetPasswordAdmin);

// Logout (protected)
router.post("/logout", authMiddleware, logout);

export default router;