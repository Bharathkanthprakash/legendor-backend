import jwt from "jsonwebtoken";
import User from "../models/User.js";

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization");
    
    if (!token) {
      return res.status(401).json({ error: "No token, authorization denied" });
    }

    // Check if token starts with Bearer
    if (!token.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    // Extract token without Bearer prefix
    const actualToken = token.replace("Bearer ", "");

    // Verify token
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    
    // Find user by ID
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ error: "Token is not valid" });
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Token is not valid" });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token has expired" });
    }
    
    res.status(500).json({ error: "Server error in authentication" });
  }
};

export default auth;
