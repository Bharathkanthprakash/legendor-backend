import express from "express";
import Post from "../models/Post.js";
import auth from "../middleware/auth.js";
import { uploadSingle, handleUploadError } from "../middleware/upload.js";

const router = express.Router();

// Create a new post with file upload
router.post("/", auth, uploadSingle, handleUploadError, async (req, res) => {
  try {
    const { caption, sport } = req.body;
    
    let mediaUrl = null;
    let mediaType = null;

    // Check if file was uploaded
    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
      
      // Determine media type
      if (req.file.mimetype.startsWith('image/')) {
        mediaType = 'image';
      } else if (req.file.mimetype.startsWith('video/')) {
        mediaType = 'video';
      }
    }

    // Create new post
    const post = new Post({
      user: req.user.id,
      caption: caption || "",
      mediaUrl,
      mediaType,
      sport: sport || ""
    });

    await post.save();
    
    // Populate user data for response
    await post.populate('user', 'name username profilePicture');

    res.status(201).json({
      message: "Post created successfully",
      post
    });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name username profilePicture')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get posts by user
router.get("/user/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .populate('user', 'name username profilePicture')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error("Get user posts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single post by ID
router.get("/:postId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('user', 'name username profilePicture');

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(post);
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a post
router.delete("/:postId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if user owns the post
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this post" });
    }

    await Post.findByIdAndDelete(req.params.postId);

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
