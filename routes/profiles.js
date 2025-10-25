import express from "express";
import jwt from "jsonwebtoken";
import Profile from "../models/Profile.js";

const router = express.Router();

const verifyToken = (req, res, next) => {
  const header = req.headers["authorization"];
  if (!header) return res.status(403).json({ message: "No token" });

  const token = header.split(" ")[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Create or update profile
router.post("/", verifyToken, async (req, res) => {
  const { name, role, bio } = req.body;
  try {
    const profile = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      { name, role, bio },
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch {
    res.status(500).json({ message: "Error saving profile" });
  }
});

// Get all profiles
router.get("/", async (req, res) => {
  const profiles = await Profile.find();
  res.json(profiles);
});

export default router;
