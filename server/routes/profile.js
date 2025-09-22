import express from "express";
import authMiddleware from "../middelwares/authMiddleware.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const profileRoutes = (db) => {
  const router = express.Router();

  // Utility: save base64 → file and return URL
  function saveImage(base64, userId) {
    // Strip base64 header
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Save file under uploads folder
    const fileName = `profile_${userId}_${Date.now()}.jpg`;
    const uploadDir = path.join(__dirname, "../uploads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    // Return URL served by express.static
    return `/uploads/${fileName}`;
  }

  // Upload profile image
  router.post("/image", authMiddleware, (req, res) => {
    const { image } = req.body;
    const userId = req.user?.id;

    if (!image) {
      return res.status(400).json({ message: "A profile image is required" });
    }

    try {
      const imageUrl = saveImage(image, userId);

      db.prepare("UPDATE users SET image = ? WHERE id = ?").run(imageUrl, userId);

      res.json({ success: true, url: imageUrl });
    } catch (err) {
      console.error("Image upload failed:", err);
      res.status(500).json({ message: "Something went wrong..." });
    }
  });

  //notification specific to user
  router.post("/push-token", authMiddleware, (req, res) => {
  const { expoPushToken } = req.body;

  if (!expoPushToken) {
    return res.status(400).json({ message: "Push token required" });
  }

  try {
    db.prepare("UPDATE users SET pushToken = ? WHERE id = ?").run(
      expoPushToken,
      req.userId
    );
    res.json({ message: "Push token saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving token" });
  }
});

  // Get logged-in user's profile
  router.get("/", authMiddleware, (req, res) => {
    const user = db
      .prepare("SELECT id, username, email, image FROM users WHERE id = ?")
      .get(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  });

  // Update logged-in user's profile
  router.put("/update", authMiddleware, async (req, res) => {
    const { username, email, password, image } = req.body;

    let updatedFields = [];
    let values = [];

    if (username) {
      updatedFields.push("username = ?");
      values.push(username);
    }

    if (email) {
      updatedFields.push("email = ?");
      values.push(email);
    }

    if (password) {
      const bcrypt = await import("bcrypt");
      const hashedPassword = await bcrypt.hash(password, 10);
      updatedFields.push("password = ?");
      values.push(hashedPassword);
    }

    if (image) {
      // If image is a base64 string, save it to file
      if (image.startsWith("data:image")) {
        const imageUrl = saveImage(image, req.userId);
        updatedFields.push("image = ?");
        values.push(imageUrl);
      } else {
        // Otherwise assume it's already a URL
        updatedFields.push("image = ?");
        values.push(image);
      }
    }

    if (updatedFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(req.userId);

    const stmt = db.prepare(
      `UPDATE users SET ${updatedFields.join(", ")} WHERE id = ?`
    );
    stmt.run(...values);

    const updatedUser = db
      .prepare("SELECT id, username, email, image FROM users WHERE id = ?")
      .get(req.userId);

    res.json({ message: "Profile updated", user: updatedUser });
  });

  return router;
};

export default profileRoutes;
