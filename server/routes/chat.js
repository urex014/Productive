import express from "express";
import authMiddleware from "../middelwares/authMiddleware.js";

const router = express.Router();

export default function chatRoutes(db) {
  // Create a new chat (direct, group, or ai)
router.post("/", (req, res) => {
    try {
      const { type, name, image, participants } = req.body;

      // Validate type
      if (!["direct", "group", "ai"].includes(type)) {
        return res.status(400).json({ error: "Invalid chat type" });
      }

      // Validate participants array
      if (!Array.isArray(participants) || participants.length === 0) {
        return res.status(400).json({ error: "Participants are required" });
      }

      // Check all participants exist
      const validParticipants = [];
      for (const userId of participants) {
        const userIdNum = Number(userId);
        if (!userIdNum) {
          return res.status(400).json({ error: "Invalid userId in participants" });
        }

        const userExists = db.prepare(`SELECT id FROM users WHERE id = ?`).get(userId);
        if (!userExists) {
          return res.status(400).json({ error: `User ${userIdNUm} does not exist` });
        }

        validParticipants.push(userIdNum);
      }

      // Prevent duplicate direct chats
      if (type === "direct" && validParticipants.length === 2) {
        const existingChat = db.prepare(`
          SELECT c.id AS chatId
          FROM chats c
          JOIN chat_participants cp ON c.id = cp.chatId
          WHERE c.type = 'direct'
            AND c.id IN (
              SELECT chatId FROM chat_participants WHERE userId = ? 
              INTERSECT 
              SELECT chatId FROM chat_participants WHERE userId = ?
            )
          LIMIT 1
        `).get(participants[0], participants[1]);

        if (existingChat) {
          const chat = db.prepare(`
            SELECT 
              c.id AS chatId, 
              c.type, 
              c.name, 
              c.image, 
              c.createdAt,
              GROUP_CONCAT(cp.userId) as participants
            FROM chats c
            LEFT JOIN chat_participants cp ON c.id = cp.chatId
            WHERE c.id = ?
            GROUP BY c.id
          `).get(existingChat.chatId);

          chat.participants = chat.participants
            ? chat.participants.split(",").map(Number)
            : [];
          return res.json(chat);
        }
      }

      // Insert new chat
      const chatResult = db
        .prepare(`INSERT INTO chats (type, name, image) VALUES (?, ?, ?)`)
        .run(type, name || null, image || null);

      const chatId = chatResult.lastInsertRowid;

      // Insert participants
      const insertParticipant = db.prepare(
        `INSERT INTO chat_participants (chatId, userId) VALUES (?, ?)`
      );
      validParticipants.forEach((userId) => insertParticipant.run(chatId, userId));

      // Fetch full chat object
      const chat = db.prepare(`
        SELECT 
          c.id AS chatId, 
          c.type, 
          c.name, 
          c.image, 
          c.createdAt,
          GROUP_CONCAT(cp.userId) as participants
        FROM chats c
        LEFT JOIN chat_participants cp ON c.id = cp.chatId
        WHERE c.id = ?
        GROUP BY c.id
      `).get(chatId);

      chat.participants = chat.participants
        ? chat.participants.split(",").map(Number)
        : [];

      return res.json(chat);
    } catch (err) {
      console.error("Error creating chat:", err);
      res.status(500).json({ error: "Internal server error" });
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
