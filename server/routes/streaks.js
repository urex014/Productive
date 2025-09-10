import express from "express";
import authMiddleware from "../middelwares/authMiddleware.js";

const streakRoutes = (db) => {
  const router = express.Router();

  // UPDATE streak (called after 1h of reading)
  router.put("/update", authMiddleware, (req, res) => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Get streak for the logged-in user
    const streak = db
      .prepare("SELECT * FROM streaks WHERE userId = ?")
      .get(req.userId);

    if (!streak) {
      // First time creating a streak for this user
      db.prepare(
        `INSERT INTO streaks (userId, currentStreak, longestStreak, lastDate)
         VALUES (?, 1, 1, ?)`
      ).run(req.userId, today);

      return res.json({
        message: "Streak started!",
        currentStreak: 1,
        longestStreak: 1,
      });
    }

    if (streak.lastDate === today) {
      // Already updated today
      return res.json({
        message: "Streak already updated today",
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
      });
    }

    // Compute yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yDate = yesterday.toISOString().split("T")[0];

    let newCurrentStreak;
    if (streak.lastDate === yDate) {
      // Consecutive day
      newCurrentStreak = streak.currentStreak + 1;
    } else {
      // Missed a day → reset streak
      newCurrentStreak = 1;
    }

    const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);

    db.prepare(
      `UPDATE streaks
       SET currentStreak = ?, longestStreak = ?, lastDate = ?
       WHERE userId = ?`
    ).run(newCurrentStreak, newLongestStreak, today, req.userId);

    res.json({
      message: "Streak updated",
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
    });
  });

  // GET streak info for logged-in user
  router.get("/", authMiddleware, (req, res) => {
    const streak = db
      .prepare("SELECT * FROM streaks WHERE userId = ?")
      .get(req.userId);

    if (!streak) {
      db.prepare(`
      INSERT INTO streaks (userId, currentStreak, longestStreak, lastDate)
      VALUES (?, 0, 0, NULL)
    `).run(req.userId);

      return res.json({
        currentStreak: 0,
        longestStreak: 0,
        message: "Start reading to begin a streak",
      });
    }

    res.json(streak);
  });

  return router;
};

export default streakRoutes;
