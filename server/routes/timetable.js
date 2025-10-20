// routes/timetableRoutes.js
import express from "express";
import authMiddleware from "../middelwares/authMiddleware.js";

const timetableRoutes = (db) => {
  const router = express.Router();

  // Create or update a timetable entry
  router.post("/", authMiddleware, async (req, res) => {
    console.log("Received timetable update request:", req.body);
    const { day, time_slot, task, duration } = req.body;

    // Validate input
    if (!day || !time_slot || task === undefined || !duration) {
      console.error("Invalid request body:", req.body);
      return res.status(400).json({ 
        error: "Missing required fields",
        details: {
          day: !day ? "Day is required" : null,
          time_slot: !time_slot ? "Time slot is required" : null,
          task: task === undefined ? "Task must be specified (can be empty string)" : null,
          duration: !duration ? "Duration is required" : null
        }
      });
    }

    try {
      // Verify user exists
      const user = db.prepare("SELECT id FROM users WHERE id = ?").get(req.userId);
      if (!user) {
        console.error("User not found:", req.userId);
        return res.status(404).json({ error: "User not found" });
      }

      // Check for existing entry
      const existing = db
        .prepare("SELECT * FROM timetable WHERE day = ? AND time_slot = ? AND user_id = ?")
        .get(day, time_slot, req.userId);

      let result;
      if (existing) {
        console.log(`Updating existing entry ${existing.id} for user ${req.userId}`);
        result = db
          .prepare("UPDATE timetable SET task = ?, duration = ? WHERE id = ?")
          .run(task, duration, existing.id);

        return res.json({ 
          message: "Updated timetable entry",
          entry: {
            id: existing.id,
            day,
            time_slot,
            task,
            duration,
            user_id: req.userId
          }
        });
      } else {
        console.log(`Creating new entry for user ${req.userId}`);
        result = db
          .prepare("INSERT INTO timetable (day, time_slot, task, duration, user_id) VALUES (?, ?, ?, ?, ?)")
          .run(day, time_slot, task, duration, req.userId);

        return res.json({ 
          message: "Created new timetable entry",
          entry: {
            id: result.lastInsertRowid,
            day,
            time_slot,
            task,
            duration,
            user_id: req.userId
          }
        });
      }
    } catch (err) {
      console.error("Error updating timetable:", err);
      res.status(500).json({ 
        error: "Failed to update timetable",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

  // Get all timetable entries for logged-in user
  router.get("/", authMiddleware, (req, res) => {
    try {
      console.log("Fetching timetable for user:", req.userId);
      
      // Validate user exists
      const user = db.prepare("SELECT id FROM users WHERE id = ?").get(req.userId);
      if (!user) {
        console.error("User not found:", req.userId);
        return res.status(404).json({ error: "User not found" });
      }

      // Get timetable entries
      const entries = db
        .prepare("SELECT * FROM timetable WHERE user_id = ? ORDER BY time_slot ASC")
        .all(req.userId);
      
      console.log(`Found ${entries.length} timetable entries for user ${req.userId}`);
      
      // If no entries exist, return empty array with message
      if (entries.length === 0) {
        console.log("No timetable entries found for user:", req.userId);
        return res.json([]);
      }

      res.json(entries);
    } catch (err) {
      console.error("Error fetching timetable:", err);
      res.status(500).json({ 
        error: "Failed to fetch timetable",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
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
