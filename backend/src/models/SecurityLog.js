import mongoose from "mongoose";

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
        "USER_LOGOUT",
        "USER_REGISTER",
        "USER_PASSWORD_RESET_REQUEST",
        "USER_PASSWORD_RESET",
        "ADMIN_LOGIN",
        "ADMIN_LOGOUT",
        "ADMIN_REGISTER",
        "ADMIN_PASSWORD_RESET_REQUEST",
        "ADMIN_PASSWORD_RESET",
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

export default mongoose.model("SecurityLog", SecurityLogSchema);
