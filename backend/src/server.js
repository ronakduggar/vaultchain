require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");
const connectDB = require("./config/db");

const { router: authRouter } = require("./routes/auth");
const transactionRouter = require("./routes/transaction");
const userRouter = require("./routes/user");
const adminRouter = require("./routes/admin");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
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
    // Broadcast security incidents to admin dashboard clients
    io.emit("admin_alert", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Connect to MongoDB & Start Server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`VaultChain Core API running on port ${PORT}`);
  });
});

module.exports = { app, server, io };
