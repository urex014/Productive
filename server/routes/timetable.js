// routes/timetableRoutes.js
import express from "express";
import authMiddleware from "../middelwares/authMiddleware.js";

const timetableRoutes = (db) => {
  const router = express.Router();

  // Create or update a timetable entry
  router.post("/", authMiddleware, async (req, res) => {
    const { day, time_slot, task, duration } = req.body;

    if (!day || !time_slot || !task || !duration) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const existing = db
        .prepare("SELECT * FROM timetable WHERE day = ? AND time_slot = ? AND user_id = ?")
        .get(day, time_slot, req.userId);

      if (existing) {
        db.prepare("UPDATE timetable SET task = ?, duration = ? WHERE id = ?")
          .run(task, duration, existing.id);

        return res.json({ message: "Updated timetable entry" });
      } else {
        db.prepare("INSERT INTO timetable (day, time_slot, task, duration, user_id) VALUES (?, ?, ?, ?, ?)")
          .run(day, time_slot, task, duration, req.userId);

        return res.json({ message: "Created new timetable entry" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Get all timetable entries for logged-in user
  router.get("/", authMiddleware, (req, res) => {
    const entries = db
      .prepare("SELECT * FROM timetable WHERE user_id = ?")
      .all(req.userId);
    res.json(entries);
  });

  // Update an entry
  router.put("/:id", authMiddleware, (req, res) => {
    const { id } = req.params;
    const { day, time_slot, task, duration } = req.body;

    const stmt = db.prepare(`
      UPDATE timetable
      SET day = ?, time_slot = ?, task = ?, duration = ?
      WHERE id = ? AND user_id = ?
    `);

    const result = stmt.run(day, time_slot, task, duration, id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json({ success: true });
  });

  // Delete an entry
  router.delete("/:id", authMiddleware, (req, res) => {
    const { id } = req.params;

    const stmt = db.prepare("DELETE FROM timetable WHERE id = ? AND user_id = ?");
    const result = stmt.run(id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json({ success: true });
  });

  return router;
};

export default timetableRoutes;
