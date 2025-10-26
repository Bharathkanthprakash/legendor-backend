import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import auth from "../middleware/auth.js";
import { sendVerificationEmail, sendWelcomeEmail } from "../utils/emailService.js";

const router = express.Router();

// Register with comprehensive validation
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, username } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: "Name, email, and password are required" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: "Password must be at least 6 characters" 
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: "User with this email or username already exists" 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      username: username || email.split('@')[0],
      password: hashedPassword
    });

    await user.save();

    // Generate tokens
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_REFRESH_SECRET, 
      { expiresIn: "30d" }
    );

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.error("Welcome email failed:", emailError);
    }

    res.status(201).json({
      message: "Account created successfully!",
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      error: "Registration failed. Please try again." 
    });
  }
});

// Enhanced Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: "Email and password are required" 
      });
    }

    // Find user with email or username
    const user = await User.findOne({
      $or: [{ email }, { username: email }]
    });

    if (!user) {
      return res.status(400).json({ 
        error: "Invalid credentials" 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        error: "Invalid credentials" 
      });
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Generate tokens
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_REFRESH_SECRET, 
      { expiresIn: "30d" }
    );

    res.json({
      message: "Login successful",
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified,
        followerCount: user.followerCount,
        followingCount: user.followingCount
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      error: "Login failed. Please try again." 
    });
  }
});

// Refresh token
router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const newToken = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    res.json({ token: newToken });

  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// Get current user with full profile
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -verificationToken")
      .populate('followers', 'name username profilePicture')
      .populate('following', 'name username profilePicture');

    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

// Update profile
router.put("/profile", auth, async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = [
      'name', 'username', 'bio', 'location', 'website', 
      'headline', 'currentPosition', 'education', 'skills',
      'sports', 'favoriteSports', 'notifications'
    ];

    const user = await User.findById(req.user.id);
    
    // Apply allowed updates
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    });

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        profilePicture: user.profilePicture,
        bio: user.bio,
        headline: user.headline,
        sports: user.sports
      }
    });

  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
