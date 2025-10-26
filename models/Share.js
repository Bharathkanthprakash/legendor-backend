const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  sharedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  caption: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Share', shareSchema);
