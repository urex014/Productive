import jwt from "jsonwebtoken";

// Keep a fallback secret (same fallback as auth routes) so verification succeeds when env var is missing
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Attach both for compatibility with routes using either property
    req.user = decoded;
    req.userId = decoded.id;
    // console.info("Authenticated user id:", req.userId);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

export default authMiddleware;
