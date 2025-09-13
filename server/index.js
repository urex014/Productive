import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";
import bodyParser from "body-parser";
import http from "http";
import { Server } from "socket.io";

import taskRoutes from "./routes/tasks.js";
import journalRoutes from "./routes/journals.js";
import streakRoutes from "./routes/streaks.js";
import authRoutes from "./routes/auth.js";
import remindersRoutes from "./routes/reminders.js";
import profileRoutes from "./routes/profile.js";
import statsRoutes from "./routes/stats.js";
import timetableRoutes from "./routes/timetable.js";
import chatRoutes from "./routes/chat.js";

import db from "./db/db.js"; // ✅ new DB import

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(bodyParser.urlencoded({ limit: "60mb", extended: true }));

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.IO
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Socket.IO events
io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`User with ID: ${socket.id} joined room: ${room}`);
  });

  socket.on("sendMessage", (msg) => {
  const { chatId, senderId, message } = msg;
  const createdAt = new Date().toISOString();

  // Save message into DB
  const stmt = db.prepare(
    "INSERT INTO messages (chatId, senderId, message, createdAt) VALUES (?, ?, ?, ?)"
  );
  const result = stmt.run(chatId, senderId, message, createdAt);

  // Fetch sender details from users table (✅ lowercase id)
  const sender = db
    .prepare("SELECT username, image FROM users WHERE id = ?")
    .get(senderId);

  const savedMessage = {
    id: result.lastInsertRowid,
    chatId,
    senderId,
    message, // ✅ frontend expects this
    createdAt,
    senderName: sender?.username || "Unknown",
    senderImage:
      sender?.image ||
      "https://img.icons8.com/ios-filled/100/user-male-circle.png",
  };

  // ✅ Broadcast to everyone in the room (sender + others)
  io.to(chatId).emit("receiveMessage", savedMessage);
});


  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

// CRON jobs remain here...
cron.schedule("* * * * *", () => {
  const now = new Date();
  const nowISO = now.toISOString();

  // 1. Find reminders that are due now
  const dueReminders = db
    .prepare(
      `
  SELECT reminders.*, tasks.title 
  FROM reminders
  JOIN tasks ON reminders.taskId = tasks.id
  WHERE remindAt <= ?
`
    )
    .all(nowISO);

  if (dueReminders.length > 0) {
    dueReminders.forEach((rem) => {
      console.log(`Reminder: ${rem.note} (due ${rem.remindAt})`);
    });
  }

  // 2. Delete reminders that are older than 1 hour
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  db.prepare("DELETE FROM reminders WHERE remindAt <= ?").run(oneHourAgo);
});

// Routes
app.use("/api/tasks", taskRoutes(db));
app.use("/api/journals", journalRoutes(db));
app.use("/api/streaks", streakRoutes(db));
app.use("/api/auth", authRoutes(db));
app.use("/api/reminders", remindersRoutes(db));
app.use("/api/profile", profileRoutes(db));
app.use("/api/stats", statsRoutes(db));
app.use("/api/timetable", timetableRoutes(db));
app.use("/api/chats", chatRoutes(db));

// Debug route
app.get("/", (req, res) => {
  res.send("Backend is running with WebSocket support");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
