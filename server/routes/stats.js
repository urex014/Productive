// routes/stats.js
import express from "express";
import authMiddleware from "../middelwares/authMiddleware.js";

export default function statsRoutes(db) {
  const router = express.Router();

  // GET /api/stats
  router.get("/", authMiddleware, (req, res) => {
    try {
      const userId = req.userId;

      // Count all tasks
      const totalTasks = db
        .prepare("SELECT COUNT(*) as count FROM tasks WHERE userId = ?")
        .get(userId).count;

      // Count completed tasks
      const completedTasks = db
        .prepare(
          "SELECT COUNT(*) as count FROM tasks WHERE userId = ? AND completed = 1"
        )
        .get(userId).count;

      // Get streak data
      const streak = db
        .prepare(
          "SELECT currentStreak, longestStreak FROM streaks WHERE userId = ?"
        )
        .get(userId);

      res.json({
        totalTasks,
        completedTasks,
        currentStreak: streak ? streak.currentStreak : 0,
        longestStreak: streak ? streak.longestStreak : 0,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  return router;
}
