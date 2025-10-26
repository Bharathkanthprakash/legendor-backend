import express from "express";
import Story from "../models/Story.js";
import Notification from "../models/Notification.js";
import auth from "../middleware/auth.js";
import { uploadSingle, handleUploadError } from "../middleware/upload.js";

const router = express.Router();

// Create story
router.post("/", auth, uploadSingle, handleUploadError, async (req, res) => {
  try {
    const { caption, location, tags, mentions } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Media file is required" });
    }

    const story = new Story({
      user: req.user.id,
      media: {
        url: `/uploads/stories/${req.file.filename}`,
        mediaType: req.file.mimetype.startsWith('image/') ? 'image' : 'video'
      },
      caption,
      location,
      tags: tags ? JSON.parse(tags) : [],
      mentions: mentions ? JSON.parse(mentions) : []
    });

    await story.save();
    await story.populate('user', 'name username profilePicture');

    res.status(201).json({
      message: "Story created successfully",
      story
    });

  } catch (error) {
    console.error("Create story error:", error);
    res.status(500).json({ 
      error: "Failed to create story" 
    });
  }
});

// Get stories from followed users
router.get("/feed", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    const stories = await Story.find({
      user: { $in: user.following },
      isActive: true,
      expiresAt: { $gt: new Date() }
    })
    .populate('user', 'name username profilePicture')
    .sort({ createdAt: -1 });

    // Group stories by user
    const storiesByUser = stories.reduce((acc, story) => {
      const userId = story.user._id.toString();
      if (!acc[userId]) {
        acc[userId] = {
          user: story.user,
          stories: []
        };
      }
      acc[userId].stories.push(story);
      return acc;
    }, {});

    res.json(Object.values(storiesByUser));

  } catch (error) {
    console.error("Stories feed error:", error);
    res.status(500).json({ 
      error: "Failed to fetch stories" 
    });
  }
});

// View story
router.post("/:storyId/view", auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);
    
    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    // Check if already viewed
    if (!story.viewers.includes(req.user.id)) {
      story.viewers.push(req.user.id);
      story.viewCount += 1;
      await story.save();

      // Create view notification (optional)
      if (story.user.toString() !== req.user.id) {
        await Notification.create({
          user: story.user,
          fromUser: req.user.id,
          type: 'story',
          story: story._id,
          message: `${req.user.name} viewed your story`
        });
      }
    }

    res.json({ 
      message: "Story viewed", 
      viewCount: story.viewCount 
    });

  } catch (error) {
    console.error("View story error:", error);
    res.status(500).json({ 
      error: "Failed to view story" 
    });
  }
});

export default router;
