import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: function() {
      return !this.media && !this.gif;
    }
  },
  media: [{
    url: String,
    mediaType: {
      type: String,
      enum: ['image', 'video', 'audio', 'file']
    },
    filename: String,
    size: Number
  }],
  gif: {
    url: String,
    preview: String
  },
  messageType: {
    type: String,
    enum: ['text', 'media', 'gif', 'system'],
    default: 'text'
  },
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: String,
    createdAt: { type: Date, default: Date.now }
  }],
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  isEdited: { type: Boolean, default: false },
  editedAt: Date,
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);
