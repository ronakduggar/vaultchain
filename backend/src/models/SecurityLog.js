const mongoose = require("mongoose");

const SecurityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // can be null for failed login attempts
    },
    email: {
      type: String,
      required: false,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "USER_LOGIN",
        "USER_REGISTER",
        "PASSWORD_ADD",
        "PASSWORD_UPDATE",
        "PASSWORD_DELETE",
        "WALLET_CONNECTED",
        "SECURITY_SCORE_UPDATE",
        "BACKUP_EXPORT",
        "PIN_SETUP",
        "BIOMETRIC_TOGGLE",
      ],
    },
    ipAddress: {
      type: String,
      default: "127.0.0.1",
    },
    deviceInfo: {
      type: String,
      default: "React Native Mobile Client",
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      required: true,
    },
    details: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SecurityLog", SecurityLogSchema);
