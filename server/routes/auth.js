import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// /api/auth
const authRoutes = (db) => {
  const router = express.Router();
  const JWT_SECRET = process.env.JWT_SECRET || "supersecret"; // move to .env in production

  // register
router.post("/register", (req, res) => {
  const { username, email, password } = req.body;

  // 1. Validate required fields
  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // 2. Hash the password
  const hashedPassword = bcrypt.hashSync(password, 10);
  const createdAt = new Date().toISOString();

  try {
    // 3. Insert the new user into the DB
    const result = db.prepare(
      "INSERT INTO users (username, email, password, createdAt) VALUES (?, ?, ?, ?)"
    ).run(username, email, hashedPassword, createdAt);

    // 4. Get the inserted user
    const newUser = db.prepare("SELECT id, username, email FROM users WHERE id = ?")
      .get(result.lastInsertRowid);

    // 5. Create a JWT token with the user's id + username
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 6. Return a success response with token + user details
    res.json({
      message: "Registration successful",
      token,
      user: newUser,
    });
  } catch (err) {
    // 7. Handle unique constraint (duplicate email/username)
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(400).json({ error: "Username or email already exists" });
    }

    // 8. Handle unexpected errors
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});


  // login
  router.post("/login", (req, res) => {
  const { email, password } = req.body;

  // 1. Look up user by email
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  // 2. Compare passwords
  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  // 3. Sign JWT with user info
  const token = jwt.sign(
    { id: user.id, username: user.username }, // payload
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  // 4. Return token + user info (excluding password)
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    message: "Login successful",
    token,
    user: userWithoutPassword,
  });
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
