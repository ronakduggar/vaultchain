const mongoose = require("mongoose");

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
    loginHash: {
      type: String,
      required: true,
    },
    salt: {
      type: String,
      required: true,
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
      default: 100, // 0 to 100
    },
    storageUsedBytes: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
