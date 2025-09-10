import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const authRoutes = (db) => {
  const router = express.Router();
  const JWT_SECRET = process.env.JWT_SECRET || "supersecret"; // move to .env in production

  // register
  router.post("/register", (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const createdAt = new Date().toISOString();

    try {
      const result = db.prepare(
        "INSERT INTO users (username, email, password, createdAt) VALUES (?, ?, ?, ?)"
      ).run(username, email, hashedPassword, createdAt);

      const token = jwt.sign({ id: result.lastInsertRowid, username }, JWT_SECRET, {
        expiresIn: "7d",
      });

      res.json({ message: "Registration successful", token });
    } catch (err) {
      if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return res.status(400).json({ error: "Username or email already exists" });
      }
      res.status(500).json({ error: "Registration failed", err });
      console.error("err", err)
    }
  });

  // login
  router.post("/login", (req, res) => {
    const { email, password } = req.body;

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid email or password" });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ message: "Login successful", token });
  });

  // get current user
  router.get("/me", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      const user = db
        .prepare("SELECT id, username, email, createdAt FROM users WHERE id = ?")
        .get(decoded.id);

      if (!user) return res.status(404).json({ error: "User not found" });

      res.json(user);
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  return router;
};

export default authRoutes;
