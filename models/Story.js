import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  media: {
    url: { type: String, required: true },
    mediaType: { 
      type: String, 
      enum: ['image', 'video'],
      required: true 
    },
    duration: { type: Number, default: 5 } // seconds
  },
  caption: String,
  location: String,
  tags: [String],
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  viewCount: { type: Number, default: 0 },
  expiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

storySchema.index({ user: 1, expiresAt: 1 });
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Story", storySchema);
