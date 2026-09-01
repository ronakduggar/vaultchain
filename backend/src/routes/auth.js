import express from "express";
import {
    registerUser,
    loginUser,
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

// User routes
router.post("/register", registerUser);
router.post("/login", loginUser);
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