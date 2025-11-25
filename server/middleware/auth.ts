import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Define the payload structure you expect in your JWT
interface UserPayload {
  id: string;
  email?: string;
  username?: string;
}

const auth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "Invalid token format" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey') as UserPayload;
    
    // Assign decoded user to req.user
    req.user = decoded; 
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export default auth;