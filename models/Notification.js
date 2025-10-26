import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  fromUser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: {
    type: String,
    enum: [
      'like', 'comment', 'share', 'follow', 
      'mention', 'message', 'post', 'story',
      'friend_request', 'event'
    ],
    required: true
  },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  story: { type: mongoose.Schema.Types.ObjectId, ref: 'Story' },
  message: String,
  isRead: { type: Boolean, default: false },
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
