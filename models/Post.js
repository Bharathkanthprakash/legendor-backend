import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caption: {
    type: String,
    default: ""
  },
  mediaUrl: {
    type: String
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', null],
    default: null
  },
  
  // UPDATED: Simplified engagement fields - remove the nested arrays
  likesCount: { 
    type: Number, 
    default: 0 
  },
  commentsCount: { 
    type: Number, 
    default: 0 
  },
  sharesCount: { 
    type: Number, 
    default: 0 
  },
  
  // For shared posts
  originalPost: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post' 
  },
  isShare: { 
    type: Boolean, 
    default: false 
  }
}, {
  timestamps: true
});

export default mongoose.model("Post", postSchema);
