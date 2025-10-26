import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationExpires: Date
});

export default mongoose.model("User", userSchema);
