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

// Forgot Password (Generate 6-Digit Code)
router.post('/auth/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
  }

  try {
    const user = await User.findOne({ email });
    
    // Security: Always return 200 even if user not found
    if (!user) {
        res.status(200).json({ message: "If that email is registered, a code has been sent." });
        return;
    }

    // Generate 6-Digit Code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code directly (or hashed if preferred, but plain code is common for short expiry)
    // For better security, hashing is recommended, but we'll store plain for simplicity in this example
    // assuming the expiry is short. To be robust, let's hash it.
    const hashedCode = crypto.createHash("sha256").update(resetCode).digest("hex");
    
    user.reset_token = hashedCode;
    user.reset_token_expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    // Configure Transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      },
    });

    // Styled Email Template with Code
    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
        <div style="text-align: center; padding-bottom: 20px;">
          <h1 style="color: #333; margin-bottom: 5px;">Product1ve</h1>
          <p style="color: #666; margin: 0; font-size: 14px;">Password Reset Verification</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">WSG Yami,</p>
          <p style="font-size: 16px; color: #555; line-height: 1.5; margin-bottom: 25px;">
            Use the code below to reset your password. This code is valid for 15 minutes.
          </p>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background-color: #f0f0f0; color: #333; padding: 15px 30px; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; display: inline-block; border: 1px solid #ddd;">
              ${resetCode}
            </div>
          </div>
          
          <p style="font-size: 14px; color: #888; margin-bottom: 0;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; padding-top: 20px; color: #aaa; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Product1ve. All rights reserved.</p>
        </div>
      </div>
    `;

    // Send Email
    await transporter.sendMail({
      from: `"Product1ve Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Password Reset Code",
      text: `Your password reset code is: ${resetCode}. This code expires in 15 minutes.`,
      html: emailHtml
    });

    res.json({ message: "Code sent to your email." });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Unable to send email" });
  }
});

// Reset Password with Code
router.post('/auth/reset-password', async (req: Request, res: Response) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
        res.status(400).json({ message: "Missing fields" });
        return;
    }

    try {
        const user = await User.findOne({ email });
        if (!user || !user.reset_token || !user.reset_token_expiry) {
            res.status(400).json({ message: "Invalid or expired request" });
            return;
        }

        // Verify Expiry
        if (new Date() > user.reset_token_expiry) {
            res.status(400).json({ message: "Code expired" });
            return;
        }

        // Verify Code (Hash the input code to compare)
        const hashedInputCode = crypto.createHash("sha256").update(code).digest("hex");
        
        if (hashedInputCode !== user.reset_token) {
            res.status(400).json({ message: "Invalid code" });
            return;
        }

        // Update Password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        
        // Clear Reset Token
        user.reset_token = undefined;
        user.reset_token_expiry = undefined;
        
        await user.save();

        res.json({ message: "Password reset successful" });

    } catch (err) {
        console.error("Reset Password Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;