// DB setup
import Database from "better-sqlite3";


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
    note TEXT NOT NULL,
    taskId INTEGER NOT NULL,
    remindAt TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
  )
`).run();

// CHATS TABLE
db.prepare(`
  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK(type IN ('direct', 'group', 'ai')) NOT NULL,
    name TEXT, 
    image TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  )
`).run();

// CHAT PARTICIPANTS TABLE (links users to chats)
db.prepare(`
  CREATE TABLE IF NOT EXISTS chat_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chatId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  )
`).run();

// MESSAGES TABLE
db.prepare(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chatId INTEGER NOT NULL,
    senderId INTEGER, -- NULL if AI/system message
    message TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE,
    FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE SET NULL
  )
`).run();

export default db;