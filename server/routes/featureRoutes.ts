import express, { Request, Response } from 'express';
import { Task, Journal, Timetable, Reminder, User } from '../models/Schemas';
import auth from '../middleware/auth';

const router = express.Router();

// --- TASKS ---

// GET /tasks - Fetch all tasks
router.get('/tasks', auth, async (req: Request, res: Response) => {
  const tasks = await Task.find({ userId: req.user.id }).sort({ dueDate: 1 });
  res.json({ tasks });
});

// POST /tasks - Create Task & Auto-Schedule Reminder
router.post('/tasks', auth, async (req: Request, res: Response) => {
  const { title, description, dueDate } = req.body;
  
  // 1. Create the Task
  const task = await Task.create({ ...req.body, userId: req.user.id });

  // 2. Logic: If dueDate exists, create a Reminder 1 hour before
  if (dueDate) {
    const due = new Date(dueDate);
    const remindAt = new Date(due.getTime() - 60 * 60 * 1000); // Subtract 1 Hour
    const now = new Date();

    // Only create reminder if the time is in the future
    if (remindAt > now) {
      await Reminder.create({
        userId: req.user.id,
        // FIX: Cast task to access _id safely if TS complains, or use task.id if virtual exists
        taskId: (task as any)._id, 
        note: `Upcoming: "${title}" is due in 1 hour.`,
        remindAt: remindAt
      });
      console.log(`[Reminder] Scheduled for task "${title}" at ${remindAt.toISOString()}`);
    }
  }

  res.json(task);
});

// PUT /tasks/:id - Update Task & Sync Reminder
router.put('/tasks/:id', auth, async (req: Request, res: Response) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  
  // Sync reminder if due date changed
  if (req.body.dueDate && task) {
     const due = new Date(req.body.dueDate);
     const remindAt = new Date(due.getTime() - 60 * 60 * 1000); // 1 hour before
     const now = new Date();

     if (remindAt > now) {
         // Update existing reminder or create new one if missing (upsert logic manually)
         // FIX: Cast task._id or use req.params.id
         const existing = await Reminder.findOne({ taskId: (task as any)._id });
         if (existing) {
             existing.remindAt = remindAt;
             await existing.save();
         } else {
             await Reminder.create({
                userId: req.user.id,
                taskId: (task as any)._id,
                note: `Upcoming: "${task.title}" is due in 1 hour.`,
                remindAt: remindAt
             });
         }
     }
  }

  res.json(task);
});

router.delete('/tasks/:id', auth, async (req: Request, res: Response) => {
  await Task.findByIdAndDelete(req.params.id);
  // Cleanup: Delete associated reminders when task is deleted
  await Reminder.deleteMany({ taskId: req.params.id });
  res.json({ success: true });
});

router.delete('/tasks', auth, async (req: Request, res: Response) => {
  await Task.deleteMany({ userId: req.user.id });
  await Reminder.deleteMany({ userId: req.user.id });
  res.json({ success: true });
});

// --- REMINDERS ---
router.get('/reminders', auth, async (req: Request, res: Response) => {
  const reminders = await Reminder.find({ userId: req.user.id })
    .sort({ remindAt: 1 })
    .populate('taskId', 'title description dueDate');
  res.json({ reminders });
});

// --- JOURNALS ---
router.get('/journals', auth, async (req: Request, res: Response) => {
  const notes = await Journal.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(notes);
});

router.post('/journals', auth, async (req: Request, res: Response) => {
  const note = await Journal.create({ ...req.body, userId: req.user.id });
  res.json(note);
});

router.put('/journals/:id', auth, async (req: Request, res: Response) => {
  const note = await Journal.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(note);
});

router.delete('/journals/:id', auth, async (req: Request, res: Response) => {
  await Journal.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

router.delete('/journals', auth, async (req: Request, res: Response) => {
  await Journal.deleteMany({ userId: req.user.id });
  res.json({ success: true });
});

// --- TIMETABLE ---
router.get('/timetable', auth, async (req: Request, res: Response) => {
  const entries = await Timetable.find({ userId: req.user.id });
  res.json(entries);
});

router.post('/timetable', auth, async (req: Request, res: Response) => {
  const { day, time_slot, task, duration } = req.body;
  const entry = await Timetable.findOneAndUpdate(
    { userId: req.user.id, day, time_slot },
    { task, duration },
    { new: true, upsert: true }
  );
  res.json(entry);
});

// --- STATS ---
router.get('/stats', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const totalTasks = await Task.countDocuments({ userId });
    const completedTasks = await Task.countDocuments({ userId, completed: true });
    const user = await User.findById(userId);

    res.json({
      totalTasks,
      completedTasks,
      currentStreak: user?.currentStreak || 0,
      longestStreak: user?.longestStreak || 0
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;