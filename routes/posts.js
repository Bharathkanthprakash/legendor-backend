import express from "express";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import auth from "../middleware/auth.js";
import { uploadMultiple, handleUploadError } from "../middleware/upload.js";

const router = express.Router();

// Create post with advanced features
router.post("/", auth, uploadMultiple, handleUploadError, async (req, res) => {
  try {
    const { 
      caption, 
      sport, 
      activityType, 
      visibility, 
      location, 
      tags, 
      mentions,
      postType,
      feeling,
      withUsers 
    } = req.body;

    // Process media files
    const media = req.files?.map(file => ({
      url: `/uploads/${file.filename}`,
      mediaType: file.mimetype.startsWith('image/') ? 'image' : 
                file.mimetype.startsWith('video/') ? 'video' : 'file',
      thumbnail: file.mimetype.startsWith('video/') ? 
                `/uploads/thumbnails/${file.filename}.jpg` : undefined
    })) || [];

    // Process mentions
    const mentionIds = mentions ? JSON.parse(mentions) : [];
    const withUserIds = withUsers ? JSON.parse(withUsers) : [];

    // Create post
    const post = new Post({
      user: req.user.id,
      caption,
      media,
      sport,
      activityType: activityType || 'casual',
      visibility: visibility || 'public',
      location: location ? JSON.parse(location) : undefined,
      tags: tags ? JSON.parse(tags) : [],
      mentions: mentionIds,
      postType: postType || 'normal',
      feeling,
      with: withUserIds
    });

    await post.save();
    await post.populate('user', 'name username profilePicture headline');
    await post.populate('mentions', 'name username profilePicture');

    // Update user's post count
    await User.findByIdAndUpdate(req.user.id, { 
      $inc: { postCount: 1 } 
    });

    // Create notifications for mentions
    if (mentionIds.length > 0) {
      const notificationPromises = mentionIds.map(mentionedUserId => 
        new Notification({
          user: mentionedUserId,
          fromUser: req.user.id,
          type: 'mention',
          post: post._id,
          message: `${req.user.name} mentioned you in a post`
        }).save()
      );
      await Promise.all(notificationPromises);
    }

    res.status(201).json({
      message: "Post created successfully",
      post
    });

  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ 
      error: "Failed to create post" 
    });
  }
});

// Get feed with advanced algorithm
router.get("/feed", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user.id);
    
    // Build feed query based on user preferences and relationships
    const feedQuery = {
      $or: [
        // Posts from followed users
        { user: { $in: user.following } },
        // Posts in user's favorite sports
        { sport: { $in: user.favoriteSports } },
        // Popular posts (high engagement)
        { 
          $expr: { 
            $gt: [
              { $add: ["$likesCount", "$commentsCount", "$sharesCount"] }, 
              10
            ] 
          } 
        }
      ],
      visibility: { $in: ['public', 'friends'] }
    };

    const posts = await Post.find(feedQuery)
      .populate('user', 'name username profilePicture headline followersCount')
      .populate('mentions', 'name username profilePicture')
      .sort({ 
        // Score based on recency and engagement
        createdAt: -1 
      })
      .skip(skip)
      .limit(limit)
      .lean();

    // Add engagement status for current user
    const postsWithEngagement = posts.map(post => ({
      ...post,
      isLiked: post.likes?.includes(req.user.id) || false,
      isSaved: post.saves?.includes(req.user.id) || false
    }));

    res.json({
      posts: postsWithEngagement,
      pagination: {
        page,
        limit,
        hasMore: posts.length === limit
      }
    });

  } catch (error) {
    console.error("Feed error:", error);
    res.status(500).json({ 
      error: "Failed to fetch feed" 
    });
  }
});

// Advanced search with filters
router.get("/search", async (req, res) => {
  try {
    const { q, sport, type, location, user } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = {};

    // Text search
    if (q) {
      query.$text = { $search: q };
    }

    // Filters
    if (sport) query.sport = sport;
    if (type) query.activityType = type;
    if (user) query.user = user;

    const posts = await Post.find(query)
      .populate('user', 'name username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ 
      error: "Search failed" 
    });
  }
});

// Save/Unsave post
router.post("/:postId/save", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const isSaved = post.saves.includes(req.user.id);
    
    if (isSaved) {
      // Unsaved
      await Post.findByIdAndUpdate(req.params.postId, {
        $pull: { saves: req.user.id }
      });
      res.json({ message: "Post unsaved", saved: false });
    } else {
      // Save
      await Post.findByIdAndUpdate(req.params.postId, {
        $addToSet: { saves: req.user.id }
      });
      res.json({ message: "Post saved", saved: true });
    }

  } catch (error) {
    console.error("Save post error:", error);
    res.status(500).json({ 
      error: "Failed to save post" 
    });
  }
});

export default router;
