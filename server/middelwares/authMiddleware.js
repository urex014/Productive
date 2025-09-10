import jwt from "jsonwebtoken";
// import crypto from 'crypto'
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET )
    req.userId = decoded.id;
    // req.userId = 1;
  //   console.info("Authenticated user id: ", req.userId)
  // console.info("decoded:", decoded)
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

export default authMiddleware;
