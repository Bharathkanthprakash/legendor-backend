import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import auth from "../middleware/auth.js";
import { sendVerificationEmail, sendWelcomeEmail } from "../utils/emailService.js";

const router = express.Router();

// Register with email verification
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

    // Generate verification token
    const verificationToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Create user with verification data
    const user = new User({
      name,
      email,
      username: username || email.split('@')[0],
      password: hashedPassword,
      verificationToken,
      verificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error("❌ Verification email failed:", emailError);
      // Continue registration but inform user
    }

    // Generate auth tokens
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

    res.status(201).json({
      message: "Account created successfully! Please check your email for verification.",
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

// Enhanced Login with email verification check
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

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(400).json({ 
        error: "Please verify your email before logging in. Check your email for verification link." 
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

// Verify email endpoint
router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by email and token
    const user = await User.findOne({
      email: decoded.email,
      verificationToken: token,
      verificationExpires: { $gt: Date.now() } // Check if not expired
    });

    if (!user) {
      return res.status(400).json({ 
        error: "Invalid or expired verification token" 
      });
    }

    // Update user as verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.error("Welcome email failed:", emailError);
    }

    res.json({ 
      message: "Email verified successfully! You can now login to your account.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error("Verify email error:", error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ 
        error: "Verification token has expired. Please request a new one." 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ 
        error: "Invalid verification token" 
      });
    }
    
    res.status(500).json({ 
      error: "Internal server error during verification" 
    });
  }
});

// Resend verification email
router.post("/resend-verification", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.isVerified) {
      return res.status(400).json({ 
        error: "Email is already verified" 
      });
    }

    // Generate new verification token
    const verificationToken = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    user.verificationToken = verificationToken;
    user.verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send email
    await sendVerificationEmail(user.email, verificationToken);

    res.json({ 
      message: "Verification email sent successfully" 
    });

  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ 
      error: "Failed to send verification email" 
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
      .select("-password -verificationToken -verificationExpires")
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
        sports: user.sports,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Forgot password - send reset email
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not
      return res.json({ 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email (you'll need to create this function in emailService.js)
    // await sendPasswordResetEmail(user.email, resetToken);

    res.json({ 
      message: "If an account with that email exists, a password reset link has been sent." 
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ 
      error: "Failed to process password reset request" 
    });
  }
});

// Reset password
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ 
        error: "Password must be at least 6 characters" 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded.userId,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        error: "Invalid or expired reset token" 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ 
      message: "Password reset successfully" 
    });

  } catch (error) {
    console.error("Reset password error:", error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({ 
        error: "Invalid or expired reset token" 
      });
    }
    
    res.status(500).json({ 
      error: "Failed to reset password" 
    });
  }
});

// Check username availability
router.get("/check-username/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const existingUser = await User.findOne({ username });
    
    res.json({ 
      available: !existingUser 
    });

  } catch (error) {
    console.error("Check username error:", error);
    res.status(500).json({ 
      error: "Failed to check username availability" 
    });
  }
});

export default router;
