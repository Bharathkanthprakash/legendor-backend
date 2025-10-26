import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import auth from "../middleware/auth.js";
import { sendVerificationEmail } from "../utils/emailService.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, username } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: "User with this email or username already exists" 
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      username,
      password
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Send verification email
router.post("/send-verification", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.isVerified) {
      return res.status(400).json({ error: "Email already verified" });
    }

    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    user.verificationToken = verificationToken;
    user.verificationExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email
    await sendVerificationEmail(user.email, verificationToken);

    res.json({ message: "Verification email sent" });
  } catch (error) {
    console.error("Send verification error:", error);
    res.status(500).json({ error: "Failed to send verification email" });
  }
});

// Verify email
router.post("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(400).json({ error: "Invalid verification token" });
    }

    if (user.verificationToken !== token) {
      return res.status(400).json({ error: "Invalid verification token" });
    }

    if (Date.now() > user.verificationExpires) {
      return res.status(400).json({ error: "Verification token expired" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(400).json({ error: "Invalid verification token" });
  }
});

export default router;
