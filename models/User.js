import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  
  // Profile
  profilePicture: { type: String, default: "" },
  coverPhoto: { type: String, default: "" },
  bio: { type: String, default: "" },
  location: { type: String, default: "" },
  website: { type: String, default: "" },
  
  // Professional Info (LinkedIn-like)
  headline: { type: String, default: "" },
  currentPosition: { type: String, default: "" },
  education: [{
    school: String,
    degree: String,
    field: String,
    startYear: Number,
    endYear: Number
  }],
  skills: [String],
  
  // Social Features
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Preferences
  sports: [{
    name: String,
    category: String,
    skillLevel: { 
      type: String, 
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Professional'],
      default: 'Beginner'
    }
  }],
  favoriteSports: [String],
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true }
  },
  
  // Verification & Security
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationExpires: Date,
  isActive: { type: Boolean, default: true },
  
  // Stats
  postCount: { type: Number, default: 0 },
  followerCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  
  // Timestamps
  lastActive: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Index for search
userSchema.index({ name: 'text', username: 'text', headline: 'text' });

export default mongoose.model("User", userSchema);
