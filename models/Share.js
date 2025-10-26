import mongoose from "mongoose";

const shareSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  sharedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  caption: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Share', shareSchema);
