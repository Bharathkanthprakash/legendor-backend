import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Content
  caption: { type: String, default: "" },
  media: [{
    url: String,
    mediaType: { 
      type: String, 
      enum: ['image', 'video', 'carousel'] 
    },
    thumbnail: String,
    duration: Number // for videos
  }],
  
  // Sports Context
  sport: String,
  activityType: { 
    type: String, 
    enum: ['training', 'competition', 'achievement', 'casual', 'news'],
    default: 'casual'
  },
  
  // Privacy
  visibility: { 
    type: String, 
    enum: ['public', 'friends', 'private'],
    default: 'public'
  },
  
  // Engagement
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likesCount: { type: Number, default: 0 },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  commentsCount: { type: Number, default: 0 },
  shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Share' }],
  sharesCount: { type: Number, default: 0 },
  saves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Instagram-like Features
  location: {
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  tags: [String],
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // LinkedIn-like Features
  postType: { 
    type: String, 
    enum: ['normal', 'achievement', 'article', 'event', 'job'],
    default: 'normal'
  },
  
  // Facebook-like Features
  feeling: String,
  with: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Shared Post
  originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  isShare: { type: Boolean, default: false },
  shareCaption: String,
  
  // Moderation
  isReported: { type: Boolean, default: false },
  reports: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Indexes for performance
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ sport: 1, createdAt: -1 });
postSchema.index({ 'location.coordinates': '2dsphere' });

export default mongoose.model("Post", postSchema);
