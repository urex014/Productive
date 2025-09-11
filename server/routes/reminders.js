import express from "express";
import authMiddleware from "../middelwares/authMiddleware.js";

const reminderRoutes = (db) => {
  const router = express.Router();

  // GET all reminders for the logged-in user, with related task info
  router.get("/", authMiddleware, (req, res) => {
    try {
      const query = `
        SELECT 
          r.id, r.userId, r.taskId, r.remindAt, r.note, r.createdAt,
          t.title AS taskTitle, t.description AS taskDescription, t.dueDate
        FROM reminders r
        JOIN tasks t ON r.taskId = t.id
        WHERE r.userId = ?
        ORDER BY r.remindAt ASC
      `;

      const reminders = db.prepare(query).all(req.userId);

      // console.log("Fetched reminders:", reminders);
      res.json({ reminders });
    } catch (err) {
      console.error("Error fetching reminders:", err.message);
      res.status(500).json({ error: "Unable to fetch reminders" });
    }
  });

  return router;
};

export default reminderRoutes;
