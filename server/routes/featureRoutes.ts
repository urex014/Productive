import express, { Request, Response } from 'express';
import { Task, Journal, Timetable, Reminder, User } from '../models/Schemas';
import auth from '../middleware/auth';

const router = express.Router();

// --- TASKS ---
router.get('/tasks', auth, async (req: Request, res: Response) => {
  const tasks = await Task.find({ userId: req.user.id }).sort({ dueDate: 1 });
  res.json({ tasks });
});

router.post('/tasks', auth, async (req: Request, res: Response) => {
  const task = await Task.create({ ...req.body, userId: req.user.id });
  res.json(task);
});

router.put('/tasks/:id', auth, async (req: Request, res: Response) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(task);
});

router.delete('/tasks/:id', auth, async (req: Request, res: Response) => {
  await Task.findByIdAndDelete(req.params.id);
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