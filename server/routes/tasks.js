import express from "express";
import authMiddleware from "../middelwares/authMiddleware.js";

const taskRoutes = (db) => {
  const router = express.Router();

  // CREATE task (with reminder)
  router.post("/", authMiddleware, (req, res) => {
    try {
      const { title, description, dueDate } = req.body;

      if (!title || !description || !dueDate) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Insert the task
      const stmt = db.prepare(
        "INSERT INTO tasks (userId, title, description, dueDate) VALUES (?, ?, ?, ?)"
      );
      const result = stmt.run(req.userId, title, description, dueDate);

      const taskId = result.lastInsertRowid;

      // Validate the dueDate
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        return res.status(400).json({ error: "Invalid dueDate format" });
      }

      // Default: remind 1 hour before the due date
      const remindAt = new Date(dueDateObj.getTime() - 60 * 60 * 1000);

      // Insert the reminder
      const reminderStmt = db.prepare(
        "INSERT INTO reminders (userId, taskId, remindAt) VALUES (?, ?, ?)"
      );
      const reminderResult = reminderStmt.run(
        req.userId,
        taskId,
        remindAt.toISOString()
      );

      // Send back task and reminder info
      res.json({
        id: taskId,
        userId: req.userId,
        title,
        description,
        dueDate,
        completed: 0,
        reminder: {
          id: reminderResult.lastInsertRowid,
          userId: req.userId,
          taskId,
          remindAt: remindAt.toISOString(),
        },
      });
    } catch (err) {
      console.error("Error creating task with reminder:", err);
      res.status(500).json({ error: "Something went wrong", err });
    }
  });

  // READ all tasks for current user
  router.get("/", authMiddleware, (req, res) => {
    try {
      const tasks = db
        .prepare("SELECT * FROM tasks WHERE userId = ?")
        .all(req.userId);
        if(!tasks) return res.status(200).json({message:"no tasks yet. Create one!"})

        const taskWithReminders = tasks.map((task) => {
          const reminder = db
            .prepare("SELECT * FROM reminders WHERE taskId = ? AND userId =?")
            .get(task.id, req.userId);
            
          return { ...task, reminder };
        });

      res.json(taskWithReminders);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      res.status(500).json({ error: "Something went wrong" });
    }
  });

  // UPDATE task (supports partial update)
  router.put("/:id", authMiddleware, (req, res) => {
    const { id } = req.params;

    const task = db
      .prepare("SELECT * FROM tasks WHERE id = ? AND userId = ?")
      .get(id, req.userId);

    if (!task) {
      return res.status(404).json({ error: "Task not found or not yours" });
    }

    const updatedTask = {
      ...task,
      ...req.body, // overwrite with new ones
    };

    db.prepare(
      `UPDATE tasks 
       SET title = ?, description = ?, dueDate = ?, completed = ? 
       WHERE id = ? AND userId = ?`
    ).run(
      updatedTask.title,
      updatedTask.description,
      updatedTask.dueDate,
      updatedTask.completed,
      id,
      req.userId
    );

    res.json({ message: "Task updated", task: updatedTask });
  });

  // DELETE ALL tasks for current user
  router.delete("/clear", authMiddleware, (req, res) => {
    try {
      db.prepare("DELETE FROM reminders WHERE userId = ?").run(req.userId);

      const result = db.prepare("DELETE FROM tasks WHERE userId = ?").run(req.userId);

      if (result.changes === 0) {
        return res.status(404).json({ error: "No tasks found to delete" });
      }

      res.json({ message: "All tasks deleted", deletedCount: result.changes });
    } catch (err) {
      console.error("Error deleting tasks:", err);
      res.status(500).json({ error: "Something went wrong" });
    }
  });

  // DELETE single task
  router.delete("/:id", authMiddleware, (req, res) => {
    const { id } = req.params;
    const taskId = Number(id);

    const result = db
      .prepare("DELETE FROM tasks WHERE id = ? AND userId = ?")
      .run(taskId, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Task not found or not yours" });
    }

    res.json({ message: "Task deleted" });
  });

  return router;
};

export default taskRoutes;
