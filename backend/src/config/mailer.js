import nodemailer from "nodemailer";

const transporter = process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
            : undefined,
    })
    : null;

export const sendPasswordResetEmail = async (email, token, role) => {
    if (!transporter) {
        console.warn("SMTP not configured – email not sent");
        return false;
    }
    const resetUrl = `${process.env.PASSWORD_RESET_URL}?token=${token}&email=${encodeURIComponent(
        email
    )}&role=${role}`;
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject: "VaultChain password reset",
            text: `Reset your VaultChain password using this link: ${resetUrl}. This link expires in 15 minutes.`,
        });
        return true;
    } catch (error) {
        console.error("Failed to send reset email:", error);
        return false;
    }
};