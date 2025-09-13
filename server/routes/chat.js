import express from "express";
import authMiddleware from "../middelwares/authMiddleware.js";

const router = express.Router();

export default function chatRoutes(db) {
  // Create a new chat (direct, group, or ai)
   router.post("/", (req, res) => {
    try {
      const { type, name, participants } = req.body;

      if (!type || !["direct", "group", "ai"].includes(type)) {
        return res.status(400).json({ error: "Invalid chat type" });
      }

      // For direct chats, participants must be 2 users
      if (type === "direct") {
        if (!Array.isArray(participants) || participants.length !== 2) {
          return res
            .status(400)
            .json({ error: "Direct chats require exactly 2 participants" });
        }
      }

      // For group chats, at least 2 participants
      if (type === "group") {
        if (!Array.isArray(participants) || participants.length < 2) {
          return res
            .status(400)
            .json({ error: "Group chats require at least 2 participants" });
        }
      }

      // Create the chat
      const stmt = db.prepare(`INSERT INTO chats (type, name) VALUES (?, ?)`);
      const result = stmt.run(type, name || null);
      const chatId = result.lastInsertRowid;

      // Add participants if they exist
      if (Array.isArray(participants) && participants.length > 0) {
        const insertParticipant = db.prepare(
          `INSERT INTO chat_participants (chatId, userId) VALUES (?, ?)`
        );
        participants.forEach((userId) => {
          if (userId) insertParticipant.run(chatId, userId);
        });
      }

      res.json({ chatId, type, name, participants });
    } catch (err) {
      console.error("Error creating chat:", err);
      res.status(500).json({ error: "Failed to create chat" });
    }
  });



  // Get all chats for a user
  router.get("/user/:userId", (req, res) => {
    try {
      const { userId } = req.params;

      const chats = db
        .prepare(
          `
          SELECT 
            c.id,
            c.type,
            c.name,
            c.createdAt,
            -- Determine display name:
            CASE 
              WHEN c.type = 'direct' THEN (
                SELECT u.username 
                FROM users u
                JOIN chat_participants cp2 ON u.id = cp2.userId
                WHERE cp2.chatId = c.id AND u.id != ?
              )
              ELSE c.name
            END AS displayName,
            -- Determine display image (use user image for direct chats, NULL for others):
            CASE 
              WHEN c.type = 'direct' THEN (
                SELECT u.image 
                FROM users u
                JOIN chat_participants cp2 ON u.id = cp2.userId
                WHERE cp2.chatId = c.id AND u.id != ?
              )
              ELSE NULL
            END AS displayImage,
            -- Last message preview:
            (
              SELECT m.message 
              FROM messages m 
              WHERE m.chatId = c.id 
              ORDER BY m.createdAt DESC 
              LIMIT 1
            ) AS lastMessage,
            (
              SELECT m.createdAt 
              FROM messages m 
              WHERE m.chatId = c.id 
              ORDER BY m.createdAt DESC 
              LIMIT 1
            ) AS lastMessageAt
          FROM chats c
          JOIN chat_participants cp ON c.id = cp.chatId
          WHERE cp.userId = ?
          ORDER BY lastMessageAt DESC NULLS LAST, c.createdAt DESC
        `
        )
        .all(userId, userId, userId);

      res.json(chats);
    } catch (err) {
      console.error("Error fetching user chats:", err);
      res.status(500).json({ error: "Failed to fetch chat list" });
    }
  });

  // Get messages for a chat
  router.get("/:chatId/messages", (req, res) => {
    try {
      const { chatId } = req.params;
      const messages = db
        .prepare(
          `
          SELECT m.id, m.chatId, m.senderId, u.username AS senderName, m.message, m.createdAt
          FROM messages m
          LEFT JOIN users u ON m.senderId = u.id
          WHERE m.chatId = ?
          ORDER BY m.createdAt ASC
        `
        )
        .all(chatId);

      res.json(messages);
    } catch (err) {
      console.error("Error fetching messages:", err);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send a message in a chat
  router.post("/:chatId/messages", (req, res) => {
    try {
      const { chatId } = req.params;
      const { senderId, message } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message text is required" });
      }

      const stmt = db.prepare(
        `INSERT INTO messages (chatId, senderId, message) VALUES (?, ?, ?)`
      );
      const result = stmt.run(chatId, senderId || null, message);

      const newMessage = {
        id: result.lastInsertRowid,
        chatId,
        senderId: senderId || null,
        message,
        createdAt: new Date().toISOString(),
      };

      // If AI chat, add automatic reply stub
      const chat = db
        .prepare("SELECT type FROM chats WHERE id = ?")
        .get(chatId);

      if (chat?.type === "ai" && senderId) {
        const aiReply = `AI: I received your message "${message}"`;

        const aiStmt = db.prepare(
          `INSERT INTO messages (chatId, senderId, message) VALUES (?, NULL, ?)`
        );
        const aiResult = aiStmt.run(chatId, aiReply);

        newMessage.aiReply = {
          id: aiResult.lastInsertRowid,
          chatId,
          senderId: null,
          message: aiReply,
          createdAt: new Date().toISOString(),
        };
      }

      res.json(newMessage);
    } catch (err) {
      console.error("Error sending message:", err);
      res.status(500).json({ error: "Failed to send message" });
    }
  });
  // Search for users (by username or email)
router.get("/search/users", (req, res) => {
    try {
      const q = (req.query.q || "").toLowerCase();
      if (!q) return res.json([]);

      const users = db
        .prepare(
          `SELECT id, username, image FROM users WHERE LOWER(username) LIKE ? LIMIT 20`
        )
        .all(`%${q}%`);

      res.json(users);
    } catch (err) {
      console.error("Error searching users:", err);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  return router;
}
