import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";
import bodyParser from 'body-parser'
import taskRoutes from "./routes/tasks.js";
import journalRoutes from "./routes/journals.js";
import streakRoutes from "./routes/streaks.js";
import authRoutes from "./routes/auth.js";
import remindersRoutes from "./routes/reminders.js";
import profileRoutes from "./routes/profile.js";
import statsRoutes from "./routes/stats.js"; // FIXED import
import Database from "better-sqlite3";
import timetableRoutes from "./routes/timetable.js";


dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({limit:'20mb'}));
app.use(bodyParser.urlencoded({limit: '60mb', extended: true})); // to support URL-encoded bodies

// DB setup
const db = new Database("amara.db");
db.pragma("foreign_keys = ON");

// USERS TABLE
//add school, course and other shit to db before deploymment 
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    expoPushToken TEXT,
    image TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  )
`).run();

// TASKS TABLE
db.prepare(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    dueDate TEXT,
    completed INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  )
`).run();

// JOURNALS TABLE
db.prepare(`
  CREATE TABLE IF NOT EXISTS journals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  )
`).run();

// STREAKS TABLE
db.prepare(`
  CREATE TABLE IF NOT EXISTS streaks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER UNIQUE NOT NULL,
    currentStreak INTEGER DEFAULT 0,
    longestStreak INTEGER DEFAULT 0,
    lastDate TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  )
`).run();
//timetable
db.prepare(`
CREATE TABLE IF NOT EXISTS timetable (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  day TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  task TEXT,
  duration INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`).run();


// REMINDERS TABLE
db.prepare(`
  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    taskId INTEGER NOT NULL,
    remindAt TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
  )
`).run();

// CRON JOB: Check reminders every minute
cron.schedule("* * * * *", () => {
  const now = new Date();
  const nowISO = now.toISOString();

  // 1. Find reminders that are due now (trigger them)
  const dueReminders = db
    .prepare("SELECT * FROM reminders WHERE remindAt <= ?")
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
app.use("/api/tasks", taskRoutes(db)); // <-- we'll modify taskRoutes so reminders auto-create
app.use("/api/journals", journalRoutes(db));
app.use("/api/streaks", streakRoutes(db));
app.use("/api/auth", authRoutes(db));
app.use("/api/reminders", remindersRoutes(db));
app.use("/api/profile", profileRoutes(db));
app.use("/api/stats", statsRoutes(db));
app.use("/api/timetable", timetableRoutes(db));

// Debug route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
