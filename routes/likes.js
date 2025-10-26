const express = require('express');
const router = express.Router();
const Like = require('../models/Like');
const auth = require('../middleware/auth');

// Like a post
router.post('/:postId/like', auth, async (req, res) => {
  try {
    const like = new Like({
      user: req.user.id,
      post: req.params.postId
    });
    await like.save();
    
    // Increment like count in Post model
    await Post.findByIdAndUpdate(req.params.postId, { $inc: { likesCount: 1 } });
    
    res.status(201).json(like);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Unlike a post
router.delete('/:postId/like', auth, async (req, res) => {
  try {
    await Like.findOneAndDelete({
      user: req.user.id,
      post: req.params.postId
    });
    
    // Decrement like count in Post model
    await Post.findByIdAndUpdate(req.params.postId, { $inc: { likesCount: -1 } });
    
    res.json({ message: 'Post unliked' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
