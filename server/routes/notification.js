import express from "express";
import { sendNotification } from "../utils/notification.js";

const router = express.Router();

/**
 * POST /api/notify
 * Body: { token: string, message: string }
 */
router.post("/", async (req, res) => {
  const { token, message } = req.body;

  if (!token || !message) {
    return res.status(400).json({ error: "Token and message are required" });
  }

  const result = await sendNotification(token, message);
  res.json(result);
});

export default router;
