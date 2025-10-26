const express = require('express');
const router = express.Router();
const Share = require('../models/Share');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// Share a post
router.post('/', auth, async (req, res) => {
  try {
    const { originalPost, caption } = req.body;
    
    // Create a new post for the shared content
    const sharedPost = new Post({
      user: req.user.id,
      caption: caption,
      originalPost: originalPost,
      isShare: true
    });
    
    await sharedPost.save();
    
    // Create share record
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
router.get('/post/:postId', async (req, res) => {
  try {
    const shares = await Share.find({ originalPost: req.params.postId })
      .populate('user', 'name username profilePicture');
    
    res.json(shares);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
