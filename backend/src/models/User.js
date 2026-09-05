import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      default: "",
      select: false, // ✅ hide by default
    },
    loginHash: {
      type: String,
      default: "",
      select: false,
    },
    salt: {
      type: String,
      default: "",
    },
    pinHash: {
      type: String,
      default: "",
    },
    walletAddress: {
      type: String,
      default: "",
    },
    isBiometricEnabled: {
      type: Boolean,
      default: false,
    },
    securityScore: {
      type: Number,
      default: 100,
    },
    storageUsedBytes: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    passwordResetTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);