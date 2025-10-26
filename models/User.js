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
  },
  username: {
    type: String,
    unique: true,
    sparse: true
  },
  profilePicture: {
    type: String,
    default: ""
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  verificationToken: String,
  verificationExpires: Date,
  sports: [{
    name: String,
    category: String,
    skillLevel: { 
      type: String, 
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Professional'],
      default: 'Beginner'
    }
  }],
  favoriteSports: [String]
}, {
  timestamps: true
});

export default mongoose.model("User", userSchema);
