import express from "express";
import Like from "../models/Like.js";
import Post from "../models/Post.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Like a post
router.post("/:postId/like", auth, async (req, res) => {
  try {
    const like = new Like({
      user: req.user.id,
      post: req.params.postId
    });
    await like.save();
    
    await Post.findByIdAndUpdate(req.params.postId, { $inc: { likesCount: 1 } });
    
    res.status(201).json(like);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Already liked this post" });
    }
    res.status(400).json({ error: error.message });
  }
});

// Unlike a post
router.delete("/:postId/like", auth, async (req, res) => {
  try {
    await Like.findOneAndDelete({
      user: req.user.id,
      post: req.params.postId
    });
    
    await Post.findByIdAndUpdate(req.params.postId, { $inc: { likesCount: -1 } });
    
    res.json({ message: "Post unliked" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get likes for a post
router.get("/:postId/likes", async (req, res) => {
  try {
    const likes = await Like.find({ post: req.params.postId })
      .populate("user", "name username profilePicture");
    res.json(likes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
