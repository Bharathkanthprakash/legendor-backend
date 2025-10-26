const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// Add comment to post
router.post('/:postId/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    const comment = new Comment({
      user: req.user.id,
      post: req.params.postId,
      text: text
    });
    
    await comment.save();
    await comment.populate('user', 'name username profilePicture');
    
    await Post.findByIdAndUpdate(req.params.postId, { $inc: { commentsCount: 1 } });
    
    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get comments for a post
router.get('/:postId/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('user', 'name username profilePicture')
      .sort({ createdAt: -1 });
    
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a comment
router.delete('/comments/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Check if user owns the comment
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }
    
    await Comment.findByIdAndDelete(req.params.commentId);
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });
    
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
