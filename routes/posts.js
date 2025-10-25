import express from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Post from "../models/Post.js";
import User from "../models/User.js";

dotenv.config();
const router = express.Router();

// JWT Middleware - Enhanced
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  
  const token = authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "No token" });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id; // Make sure this matches your JWT payload structure
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Enhanced Multer setup with better file handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images and videos
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images and videos are allowed!'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Create a post - Enhanced with better error handling
router.post("/", auth, upload.single("media"), async (req, res) => {
  try {
    const { caption } = req.body;
    
    // Validate input
    if (!caption && !req.file) {
      return res.status(400).json({ 
        message: "Post must contain either caption or media" 
      });
    }

    const newPost = new Post({
      user: req.user,
      caption: caption || "",
      mediaUrl: req.file ? `/uploads/${req.file.filename}` : null,
      mediaType: req.file ? (req.file.mimetype.startsWith('video/') ? 'video' : 'image') : null
    });

    await newPost.save();
    
    // Populate user data for response
    await newPost.populate('user', 'name email');
    
    res.status(201).json({
      message: "Post created successfully",
      post: newPost
    });
    
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ 
      message: "Error creating post",
      error: err.message 
    });
  }
});

// Get all posts - Enhanced with population and pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate('user', 'name email') // Populate user details
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments();

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts
    });
    
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ 
      message: "Error fetching posts",
      error: err.message 
    });
  }
});

// Get single post by ID
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'name email')
      .populate('likes', 'name')
      .populate('comments.user', 'name');

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post);
  } catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).json({ 
      message: "Error fetching post",
      error: err.message 
    });
  }
});

// Like/Unlike a post
router.post("/:id/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const likeIndex = post.likes.indexOf(req.user);
    
    if (likeIndex > -1) {
      // Unlike: remove the like
      post.likes.splice(likeIndex, 1);
      await post.save();
      res.json({ 
        message: "Post unliked", 
        liked: false,
        likesCount: post.likes.length 
      });
    } else {
      // Like: add the like
      post.likes.push(req.user);
      await post.save();
      res.json({ 
        message: "Post liked", 
        liked: true,
        likesCount: post.likes.length 
      });
    }
  } catch (err) {
    console.error("Error liking post:", err);
    res.status(500).json({ 
      message: "Error liking post",
      error: err.message 
    });
  }
});

// Add comment to a post
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newComment = {
      user: req.user,
      text: text.trim()
    };

    post.comments.push(newComment);
    await post.save();

    // Populate the new comment's user data
    await post.populate('comments.user', 'name email');

    res.status(201).json({
      message: "Comment added successfully",
      comment: post.comments[post.comments.length - 1]
    });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ 
      message: "Error adding comment",
      error: err.message 
    });
  }
});

// Get user's posts
router.get("/user/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("Error fetching user posts:", err);
    res.status(500).json({ 
      message: "Error fetching user posts",
      error: err.message 
    });
  }
});

// Delete a post (only by owner)
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the authenticated user is the post owner
    if (post.user.toString() !== req.user) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    await Post.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ 
      message: "Error deleting post",
      error: err.message 
    });
  }
});

export default router;