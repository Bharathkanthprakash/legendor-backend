import express from "express";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import { uploadProfilePicture, handleUploadError } from "../middleware/upload.js";

const router = express.Router();

// Update user profile
router.put("/", auth, async (req, res) => {
  try {
    const { name, username, sports, favoriteSports } = req.body;

    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (username) user.username = username;
    if (sports) user.sports = sports;
    if (favoriteSports) user.favoriteSports = favoriteSports;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
        sports: user.sports,
        favoriteSports: user.favoriteSports
      }
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Upload profile picture
router.put("/picture", auth, uploadProfilePicture, handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const user = await User.findById(req.user.id);
    user.profilePicture = `/uploads/profile-pics/${req.file.filename}`;
    await user.save();

    res.json({
      message: "Profile picture updated successfully",
      profilePicture: user.profilePicture
    });
  } catch (error) {
    console.error("Upload profile picture error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user profile
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-password -verificationToken -verificationExpires");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
