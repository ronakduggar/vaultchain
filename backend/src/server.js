import "dotenv/config";
import express from "express";
import http from "http";                     // ✅ imported http
import cors from "cors";
import { Server as SocketServer } from "socket.io";
import connectDB from "./config/db.js";
import { connectRedis } from "./config/redis.js";

import authRouter from "./routes/auth.js";
import transactionRouter from "./routes/transaction.js";
import userRouter from "./routes/user.js";
import adminRouter from "./routes/admin.js";

const app = express();

// ✅ Create HTTP server explicitly
const server = http.createServer(app);

// ✅ Attach Socket.io to the server (NOT to app.listen)
const io = new SocketServer(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);

// Basic health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

// Real-time communication via Socket.io
io.on("connection", (socket) => {
  console.log("Client connected to socket.io:", socket.id);

  socket.on("security_alert", (data) => {
    io.emit("admin_alert", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ✅ Validate required env vars before starting
if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not defined in environment");
  process.exit(1);
}

// Connect to MongoDB & Redis, then start server
const PORT = process.env.PORT || 5000;
Promise.all([connectDB(), connectRedis()])
  .then(() => {
    // ✅ Use server.listen instead of app.listen
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });

export { app, io };