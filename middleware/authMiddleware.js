import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Check if Authorization header is there and starts with Bearer   §
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    // 2. Verify the token using your JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 3. Attach the decoded user info to the request
    req.user = decoded;
    // 4. Allow the request to move forward
    next();
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};
