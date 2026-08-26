import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: true, 
            trim: true
    },
        email: {
            type: String, 
            required: true, 
            unique: true, 
            lowercase: true, 
            trim: true
        },
        passwordHash: { 
            type: String, 
            required: true, 
            select: false 
        },
        isActive: { 
            type: Boolean,
            default: true 
        },
        passwordResetTokenHash: { 
            type: String, 
            default: null, 
            select: false
         },
        passwordResetExpiresAt: { 
            type: Date,
            default: null, 
            select: false 
        },
    },
    { timestamps: true }
);

export default mongoose.model("Admin", AdminSchema);
