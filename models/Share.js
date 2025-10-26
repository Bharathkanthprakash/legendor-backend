const shareSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  sharedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }, // For shared content
  caption: String,
  createdAt: { type: Date, default: Date.now }
});
