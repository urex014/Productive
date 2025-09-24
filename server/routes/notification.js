// routes/notifications.js
import express from "express";
import db from "../db/db.js"; // adjust path if different
import fetch from 'node-fetch';

const router = express.Router();

//test /api/notifications/test
router.post('/test', async(req,res)=>{
  const {expoPushToken} = req.body;
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: expoPushToken,
        sound: 'default',
        title: 'Test Notification',
        body: 'please abeg work na',
        data: { test: '123' },
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send push' });
  }
})

// POST /api/notifications/register-token
router.post("/register-token", (req, res) => {
  const { userId, expoPushToken } = req.body;

  if (!userId || !expoPushToken) {
    return res.status(400).json({ message: "Missing userId or expoPushToken" });
  }

  try {
    // Update the user's token
    const stmt = db.prepare(
      "UPDATE users SET expoPushToken = ? WHERE id = ?"
    );
    const result = stmt.run(expoPushToken, userId);

    if (result.changes === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(404).json({ message: "Push token registered" });
  } catch (err) {
    console.error("Error saving token:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post('/send-notification', async (req,res)=>{
  try{
    const {token, title, body} = req.body;

    const message = {
      notification:{title, body}, token
    };

    const response = await admin.messaging().send(message);
    res.status(200).json({success:true, response})

  }catch(err){
    res.status(500).json({success:false, error:err.message})
  }
})

export default router;
