import express from "express";
import Share from "../models/Share.js";
import Post from "../models/Post.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Share a post
router.post("/", auth, async (req, res) => {
  try {
    const { originalPost, caption } = req.body;
    
    const sharedPost = new Post({
      user: req.user.id,
      caption: caption,
      originalPost: originalPost,
      isShare: true
    });
    
    await sharedPost.save();
    
    const share = new Share({
      user: req.user.id,
      originalPost: originalPost,
      sharedPost: sharedPost._id,
      caption: caption
    });
    
    await share.save();
    await Post.findByIdAndUpdate(originalPost, { $inc: { sharesCount: 1 } });
    
    res.status(201).json(share);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get shares for a post
router.get("/post/:postId", async (req, res) => {
  try {
    const shares = await Share.find({ originalPost: req.params.postId })
      .populate("user", "name username profilePicture");
    
    res.json(shares);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
