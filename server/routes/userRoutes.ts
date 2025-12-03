import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { User } from '../models/Schemas';
import auth from '../middleware/auth';

const router = express.Router();

// ... (Register, Login, Profile, Update Profile routes remain unchanged) ...
// Register
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
        res.status(400).json({ error: "Username or Email already exists" });
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword });
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '7d' });

    res.json({ message: "User created", token, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        res.status(400).json({ error: "User not found" });
        return;
    }

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
        res.status(400).json({ error: "Invalid credentials" });
        return;
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '7d' });
    
    res.json({ 
      message: "Login successful",
      token, 
      user: { id: user._id, username: user.username, email: user.email, image: user.image } 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Profile
router.get('/profile', auth, async (req: Request, res: Response) => {
  const user = await User.findById(req.user.id);
  if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
  }
  res.json({ user });
});

// Update Profile
router.put('/profile/update', auth, async (req: Request, res: Response) => {
  const { username, email, image, oldPassword, newPassword } = req.body;
  
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    
    if (username) user.username = username;
    if (email) user.email = email;
    if (image) user.image = image;

    if (oldPassword && newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, user.password!);
      if (!isMatch) {
          res.status(400).json({ message: "Old password incorrect" });
          return;
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    res.json({ message: "Profile updated", user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Streaks
router.get('/streaks', auth, async (req: Request, res: Response) => {
  const user = await User.findById(req.user.id);
  res.json({ currentStreak: user?.currentStreak || 0, longestStreak: user?.longestStreak || 0 });
});

router.put('/streaks/update', auth, async (req: Request, res: Response) => {
  const user = await User.findById(req.user.id);
  if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
  }

  const now = new Date();
  const lastDate = user.lastStudyDate ? new Date(user.lastStudyDate) : null;
  
  let isSameDay = lastDate && now.toDateString() === lastDate.toDateString();
  let isNextDay = lastDate && (now.getDate() - lastDate.getDate() === 1);

  if (!isSameDay) {
    if (isNextDay || !lastDate) {
      user.currentStreak += 1;
    } else {
      user.currentStreak = 1;
    }
    user.lastStudyDate = now;
    if (user.currentStreak > user.longestStreak) user.longestStreak = user.currentStreak;
    await user.save();
  }
  
  res.json({ currentStreak: user.currentStreak, longestStreak: user.longestStreak });
});

// Notifications
router.post('/notifications/register-token', auth, async (req: Request, res: Response) => {
  const { expoPushToken } = req.body;
  await User.findByIdAndUpdate(req.user.id, { expoPushToken });
  res.json({ message: "Push token registered" });
});

// Forgot Password (Corrected)
router.post('/auth/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
  }

  try {
    const user = await User.findOne({ email });
    
    // Security: Always return 200 even if user not found to prevent email enumeration
    if (!user) {
        res.status(200).json({ message: "If that email is registered, a reset link has been sent." });
        return;
    }

    // Generate Reset Token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    
    user.reset_token = hashedToken;
    user.reset_token_expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    // Construct Reset URL (Ensure CLIENT_URL is in .env)
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Configure Transporter
    const transporter = nodemailer.createTransport({
      service: "gmail", // Or use SMTP host/port
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      },
    });

    // Send Email
    await transporter.sendMail({
      from: `"Amara App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      text: `You requested a password reset.\n\nPlease click the following link to reset your password:\n\n${resetUrl}\n\nThis link is valid for 15 minutes.\nIf you did not request this, please ignore this email.`,
      html: `<p>You requested a password reset.</p><p>Click <a href="${resetUrl}">here</a> to reset your password.</p><p>This link is valid for 15 minutes.</p>`
    });

    res.json({ message: "If that email is registered, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Unable to send email" });
  }
});

export default router;