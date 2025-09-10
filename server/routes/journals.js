import express from "express";
import authMiddleware from "../middelwares/authMiddleware.js";

const journalRoutes = (db) => {
  const router = express.Router();

  // CREATE a new journal entry
  router.post("/", authMiddleware, (req, res) => {
    const { title, content } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const stmt = db.prepare(
      "INSERT INTO journals (userId, title, content) VALUES (?, ?, ?)"
    );
    const result = stmt.run(req.userId, title || null, content);

    res.json({
      id: result.lastInsertRowid,
      userId: req.userId,
      title,
      content,
      createdAt: new Date().toISOString(),
    });
  });

  // GET all journal entries for the logged-in user
  router.get("/", authMiddleware, (req, res) => {
    const journals = db
      .prepare(
        "SELECT * FROM journals WHERE userId = ? ORDER BY createdAt DESC"
      )
      .all(req.userId);
      if(!journals) return res.status(200).json({message:"no journals yet. Create one!"})

    res.json(journals);
  });

  // GET a single journal entry (only if it belongs to the logged-in user)
  router.get("/:id", authMiddleware, (req, res) => {
    const journal = db
      .prepare("SELECT * FROM journals WHERE id = ? AND userId = ?")
      .get(req.params.id, req.userId);

    if (!journal) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    res.json(journal);
  });

  // UPDATE a journal entry (partial update, only if it belongs to the user)
  router.put("/:id", authMiddleware, (req, res) => {
    const { id } = req.params;

    const journal = db
      .prepare("SELECT * FROM journals WHERE id = ? AND userId = ?")
      .get(id, req.userId);

    if (!journal) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    const updatedJournal = { ...journal, ...req.body };

    db.prepare(
      "UPDATE journals SET title = ?, content = ? WHERE id = ? AND userId = ?"
    ).run(updatedJournal.title, updatedJournal.content, id, req.userId);

    res.json({ message: "Journal updated", journal: updatedJournal });
  });

  // DELETE a journal entry (only if it belongs to the user)
  router.delete("/:id", authMiddleware, (req, res) => {
    const result = db
      .prepare("DELETE FROM journals WHERE id = ? AND userId = ?")
      .run(req.params.id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    res.json({ message: "Journal deleted" });
  });

  return router;
};

export default journalRoutes;
