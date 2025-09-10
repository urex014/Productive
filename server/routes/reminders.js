
import express from "express";
import authMiddleware from "../middelwares/authMiddleware.js";

const reminderRoutes = (db) => {
  const router = express.Router();

// routes/reminderRoutes.js
router.get("/", authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  const reminders = db
    .prepare("SELECT * FROM reminders WHERE remindAt <= ? AND userId = ?")
    .all(now, req.userId);

  res.json(reminders);
});


  return router;
};

export default reminderRoutes;
